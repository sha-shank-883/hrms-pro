import React, { useState, useEffect, useRef } from 'react';
import { paymentService } from '../../services/payment';
import { useAuth } from '../../context/AuthContext';
import {
  XMarkIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BoltIcon,
  SparklesIcon,
  CurrencyRupeeIcon,
  CreditCardIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  CheckBadgeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { FaPaypal, FaLock, FaCrown, FaShieldAlt } from 'react-icons/fa';

/**
 * Loads Razorpay script on demand
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Loads PayPal SDK script on demand
 */
let payPalScriptPromise = null;
function loadPayPalScript(clientId, currency = 'USD') {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (payPalScriptPromise) return payPalScriptPromise;

  payPalScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.paypal));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = (err) => {
      payPalScriptPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return payPalScriptPromise;
}

/**
 * Unified Subscription Checkout Modal
 * Provides Monthly vs Yearly (20% Discount), Auto-Pay toggle, Dynamic Seats Adjuster,
 * and seamless switching between Razorpay (UPI/INR) and PayPal (Cards/USD).
 */
const SubscriptionCheckoutModal = ({ plan, onClose, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  
  // Gateway selector ('razorpay' | 'paypal')
  const [selectedGateway, setSelectedGateway] = useState(
    plan?.gateway || (plan?.currency === 'USD' ? 'paypal' : 'razorpay')
  );

  // Billing Cycle ('yearly' | 'monthly')
  const [billingCycle, setBillingCycle] = useState('yearly');
  
  // Auto-Pay toggle
  const [autoPay, setAutoPay] = useState(true);

  // Dynamic Seats (editable in checkout)
  const [seatCount, setSeatCount] = useState(Math.max(1, plan?.seats || (plan?.id === 'scale' ? 25 : 10)));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Razorpay state
  const [razorpayReady, setRazorpayReady] = useState(false);

  // PayPal state
  const [paypalStatus, setPaypalStatus] = useState('idle'); // idle | loading | ready | error
  const paypalContainerRef = useRef(null);
  const paypalButtonsRef = useRef(null);
  const isMountedRef = useRef(true);

  const planId = plan?.id === 'scale' ? 'scale' : 'hatch';
  const planName = planId === 'scale' ? 'Scale Plan' : 'Hatch Plan';

  // Base Per-Seat Rates
  const inrBaseRate = planId === 'scale' ? 799 : 299;
  const usdBaseRate = planId === 'scale' ? 10 : 4;

  // Yearly rates with 20% discount
  const isYearly = billingCycle === 'yearly';
  const inrTotal = isYearly
    ? Math.round(inrBaseRate * seatCount * 12 * 0.80)
    : Math.round(inrBaseRate * seatCount);

  const inrMonthlyEquivalent = isYearly ? Math.round(inrTotal / 12) : inrTotal;
  const inrSavings = isYearly ? Math.round(inrBaseRate * seatCount * 12 * 0.20) : 0;

  const usdTotal = isYearly
    ? (usdBaseRate * seatCount * 12 * 0.80).toFixed(2)
    : (usdBaseRate * seatCount).toFixed(2);

  const usdMonthlyEquivalent = isYearly ? (parseFloat(usdTotal) / 12).toFixed(2) : usdTotal;
  const usdSavings = isYearly ? (usdBaseRate * seatCount * 12 * 0.20).toFixed(2) : '0.00';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (paypalButtonsRef.current && typeof paypalButtonsRef.current.close === 'function') {
        try {
          paypalButtonsRef.current.close().catch(() => {});
        } catch (_) {}
      }
    };
  }, []);

  // Pre-load Razorpay SDK
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      if (isMountedRef.current) setRazorpayReady(loaded);
    });
  }, []);

  // Initialize PayPal when user selects PayPal tab or changes seat/cycle
  useEffect(() => {
    if (selectedGateway !== 'paypal' || success) return;

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setPaypalStatus('error');
      setError('PayPal is not configured. Please use Razorpay or contact support.');
      return;
    }

    let isSubscribed = true;
    setPaypalStatus('loading');
    setError(null);

    loadPayPalScript(clientId, 'USD')
      .then((paypal) => {
        if (!isSubscribed || !isMountedRef.current) return;
        if (!paypal || !paypal.Buttons) {
          throw new Error('PayPal SDK loaded without Buttons component');
        }

        if (paypalButtonsRef.current && typeof paypalButtonsRef.current.close === 'function') {
          try {
            paypalButtonsRef.current.close().catch(() => {});
          } catch (_) {}
          paypalButtonsRef.current = null;
        }

        if (paypalContainerRef.current) {
          paypalContainerRef.current.innerHTML = '';
        }

        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
            height: 45,
          },

          createOrder: async () => {
            try {
              setError(null);
              const response = await paymentService.createOrder(planId, 'USD', seatCount, billingCycle, autoPay);
              return response.data?.orderId;
            } catch (err) {
              const msg = err.response?.data?.message || err.message || 'Failed to create PayPal order.';
              setError(msg);
              throw err;
            }
          },

          onApprove: async (data) => {
            setLoading(true);
            try {
              const response = await paymentService.captureOrder(data.orderID, planId, 'USD', seatCount, billingCycle, autoPay);
              setSuccess(true);
              setSuccessMessage(`PayPal payment completed! ${planName} (${seatCount} Seats, ${isYearly ? 'Yearly' : 'Monthly'}) is active.`);

              if (refreshProfile) await refreshProfile();

              setTimeout(() => {
                if (onSuccess) onSuccess(response.data);
                if (onClose) onClose();
              }, 2500);
            } catch (err) {
              setError(err.response?.data?.message || err.message || 'Payment capture failed.');
            } finally {
              if (isMountedRef.current) setLoading(false);
            }
          },

          onError: (err) => {
            console.error('[PayPal] Button error:', err);
            setError('An error occurred during the PayPal checkout process. Please try again.');
          },
        });

        if (paypalContainerRef.current && isSubscribed) {
          buttons.render(paypalContainerRef.current).then(() => {
            if (isSubscribed && isMountedRef.current) {
              paypalButtonsRef.current = buttons;
              setPaypalStatus('ready');
            }
          }).catch(() => {});
        }
      })
      .catch((err) => {
        if (isSubscribed && isMountedRef.current) {
          console.error('[PayPal] Script load error:', err);
          setPaypalStatus('error');
          setError('Failed to load PayPal checkout. Please use Razorpay or try again.');
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [selectedGateway, planId, seatCount, billingCycle, autoPay, success]);

  // Handle Razorpay Payment Trigger
  const handleRazorpayPay = async () => {
    if (!window.Razorpay) {
      setError('Razorpay SDK is loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create order on backend (server calculates strict price & 20% yearly discount)
      const res = await paymentService.createRazorpayOrder(planId, seatCount, billingCycle, autoPay);
      if (!res.success || !res.data?.orderId) {
        throw new Error(res.message || 'Failed to create Razorpay payment order');
      }

      const orderData = res.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount, // in paise
        currency: 'INR',
        name: 'HRMS Pro',
        description: `${planName} (${seatCount} Seats • ${isYearly ? 'Yearly Plan' : 'Monthly Plan'})`,
        image: 'https://hrmspro.online/logo.png',
        order_id: orderData.orderId,
        prefill: {
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'HR Admin',
          email: user?.email || 'admin@hrmspro.online',
          contact: user?.phone || '',
        },
        notes: {
          tenant_id: user?.tenant_id || '',
          plan_id: planId,
          seats: String(seatCount),
          billing_cycle: billingCycle,
          auto_pay: String(autoPay)
        },
        theme: {
          color: planId === 'scale' ? '#f59e0b' : '#16a34a',
        },
        handler: async function (response) {
          setLoading(true);
          try {
            // 3. Cryptographic HMAC verification on backend
            const verifyRes = await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: planId,
              seats: seatCount,
              billingCycle: billingCycle,
              autoPay: autoPay
            });

            if (verifyRes.success) {
              setSuccess(true);
              setSuccessMessage(`Payment confirmed! ${planName} (${seatCount} Seats • ${isYearly ? '365 Days' : '30 Days'}) is active.`);
              if (refreshProfile) await refreshProfile();

              setTimeout(() => {
                if (onSuccess) onSuccess(verifyRes.data);
                if (onClose) onClose();
              }, 2500);
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed');
            }
          } catch (verErr) {
            console.error('Razorpay verification error:', verErr);
            setError(verErr.response?.data?.message || verErr.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(`Payment failed: ${resp.error.description || resp.error.reason || 'Transaction declined'}`);
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Failed to initiate Razorpay checkout:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initialize payment.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-850 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-750 overflow-hidden transition-all my-auto">
        
        {/* Header - Always visible at top */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-750 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 ${
              planId === 'scale' 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {planId === 'scale' ? <FaCrown className="w-5 h-5" /> : <FaShieldAlt className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Upgrade to {planName}
                <span className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full ${
                  planId === 'scale'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                }`}>
                  {planId === 'scale' ? '👑 SCALE VIP' : '🛡️ HATCH PRO'}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Choose duration, seat capacity, and payment gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Success Notification */}
          {success && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
              <CheckCircleIcon className="w-14 h-14 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                Payment Successful & Plan Activated!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                {successMessage}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-bold">
                  <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
                  Your VIP Status is now Active
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Payment Notice:</span> {error}
              </div>
            </div>
          )}

          {!success && (
            <>
              {/* 1. Billing Cycle Toggle: Monthly vs Yearly (Save 20%) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Billing Duration
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('yearly');
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      billingCycle === 'yearly'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <CalendarDaysIcon className="w-4 h-4 text-primary-500" />
                    <span>Yearly (365 Days)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      SAVE 20%
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('monthly');
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <span>Monthly (30 Days)</span>
                  </button>
                </div>
              </div>

              {/* 2. Employee Seats Capacity Stepper */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Employee Seats Capacity
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Add or reduce seats for your organization
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSeatCount(Math.max(1, seatCount - 5))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-14 text-center font-black text-base text-gray-900 dark:text-white">
                      {seatCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSeatCount(seatCount + 5)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSeatCount(preset)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        seatCount === preset
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-400'
                      }`}
                    >
                      {preset} Seats
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Payment Gateway Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Razorpay Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway('razorpay');
                      setError(null);
                    }}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all ${
                      selectedGateway === 'razorpay'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md ring-1 ring-emerald-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        <CurrencyRupeeIcon className="w-4 h-4 text-emerald-600" />
                        Razorpay
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        India / UPI
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      UPI, Cards, NetBanking
                    </p>
                    <div className="mt-2 font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      ₹{inrTotal.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-gray-500">INR</span>
                    </div>
                  </button>

                  {/* PayPal Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGateway('paypal');
                      setError(null);
                    }}
                    className={`relative p-3.5 rounded-2xl border-2 text-left transition-all ${
                      selectedGateway === 'paypal'
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-1 ring-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        <FaPaypal className="w-4 h-4 text-blue-600" />
                        PayPal
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Global / USD
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Credit / Debit Cards & PayPal
                    </p>
                    <div className="mt-2 font-extrabold text-sm text-blue-700 dark:text-blue-400">
                      ${usdTotal}{' '}
                      <span className="text-[10px] font-normal text-gray-500">USD</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 4. Auto-Pay Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <SparklesIcon className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Enable Auto-Renewal for Future Cycles
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Uninterrupted access for your team without manual renews
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPay}
                    onChange={(e) => setAutoPay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* 5. Order Breakdown Box */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Selected Tier:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{planName}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Capacity & Cycle:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {seatCount} Seats • {isYearly ? '12 Months (Yearly)' : '1 Month'}
                  </span>
                </div>
                {isYearly && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Yearly 20% Discount Savings:</span>
                    <span>
                      {selectedGateway === 'razorpay' ? `-₹${inrSavings.toLocaleString('en-IN')}` : `-$${usdSavings}`}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
                  <span>Total Payable:</span>
                  <div className="text-right">
                    <span className={selectedGateway === 'razorpay' ? 'text-emerald-600 text-lg' : 'text-blue-600 text-lg'}>
                      {selectedGateway === 'razorpay'
                        ? `₹${inrTotal.toLocaleString('en-IN')} INR`
                        : `$${usdTotal} USD`}
                    </span>
                    {isYearly && (
                      <span className="block text-[10px] font-normal text-gray-400">
                        (Equiv. {selectedGateway === 'razorpay' ? `₹${inrMonthlyEquivalent.toLocaleString('en-IN')}/mo` : `$${usdMonthlyEquivalent}/mo`})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Active Gateway Action Button */}
              {selectedGateway === 'razorpay' ? (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRazorpayPay}
                    disabled={loading || !razorpayReady}
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Processing Razorpay Checkout...
                      </>
                    ) : (
                      <>
                        <BoltIcon className="w-5 h-5" />
                        Pay ₹{inrTotal.toLocaleString('en-IN')} via Razorpay ({isYearly ? 'Yearly' : 'Monthly'})
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {paypalStatus === 'loading' && (
                    <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                      <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-600" />
                      Loading PayPal payment options...
                    </div>
                  )}

                  <div
                    ref={paypalContainerRef}
                    className={paypalStatus === 'loading' ? 'hidden' : 'min-h-[90px]'}
                  />
                </div>
              )}

              {/* Security & Invoicing Guarantee Footer */}
              <div className="pt-1 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                GST Invoice & VIP Subscriber status activated instantly.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutModal;
