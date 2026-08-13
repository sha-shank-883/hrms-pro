import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/payment';
import { useAuth } from '../../context/AuthContext';
import {
  XMarkIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { FaQrcode, FaCreditCard, FaUniversity, FaWallet } from 'react-icons/fa';

/**
 * Loads the Razorpay checkout script on demand.
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
 * RazorpayCheckout Modal for Indian Customers (UPI, Cards, NetBanking, Wallets).
 *
 * @param {Object} props
 * @param {Object} props.plan - { id, name, seats, price, currency }
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} props.onSuccess - Successful payment handler
 */
const RazorpayCheckout = ({ plan, onClose, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setScriptLoaded(loaded);
      if (!loaded) {
        setError('Failed to load Razorpay SDK. Please check your internet connection.');
      }
    });
  }, []);

  const handlePayNow = async () => {
    if (!scriptLoaded || !window.Razorpay) {
      setError('Razorpay SDK is not ready yet. Please wait a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const seatsCount = plan.seats || 10;
      // 1. Create order on backend
      const res = await paymentService.createRazorpayOrder(plan.id, seatsCount);
      if (!res.success || !res.data?.orderId) {
        throw new Error(res.message || 'Failed to create Razorpay payment order');
      }

      const orderData = res.data;

      // 2. Configure Razorpay options
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'HRMS Pro',
        description: `${orderData.planName || plan.name} (${seatsCount} Seats)`,
        image: 'https://hrmspro.online/logo.png',
        order_id: orderData.orderId,
        prefill: {
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'HR Admin',
          email: user?.email || 'admin@hrmspro.online',
          contact: user?.phone || '',
        },
        notes: {
          tenant_id: user?.tenant_id || '',
          plan_id: plan.id,
          seats: String(seatsCount),
        },
        theme: {
          color: '#16a34a',
        },
        handler: async function (response) {
          setLoading(true);
          try {
            // 3. Verify cryptographic HMAC signature on backend
            const verifyRes = await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
              seats: seatsCount,
            });

            if (verifyRes.success) {
              setSuccess(true);
              if (refreshProfile) {
                await refreshProfile();
              }
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
        console.error('Razorpay payment failed:', resp.error);
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

  const seats = plan.seats || 10;
  const ratePerSeat = plan.id === 'scale' ? 799 : 299;
  const calculatedTotal = (seats * ratePerSeat).toLocaleString('en-IN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white">
                Razorpay Checkout (India)
              </span>
            </div>
            <h3 className="text-xl font-black">{plan.name}</h3>
            <p className="text-xs text-emerald-100 font-medium">
              {seats} Employee Seats Included &bull; Full Cloud Access
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Order Breakdown Box */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/80 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Unit Rate</span>
              <span>₹{ratePerSeat} / employee / month</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Active Seats</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{seats} Employees</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Billing Cycle</span>
              <span>30 Days (Monthly)</span>
            </div>
            <div className="pt-2.5 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Total Amount</span>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{calculatedTotal}
                </span>
                <span className="text-xs text-gray-400 ml-1">INR</span>
              </div>
            </div>
          </div>

          {/* Supported Indian Payment Methods */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Supported Payment Methods:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                <FaQrcode className="text-emerald-500 text-sm shrink-0" />
                <span className="truncate font-semibold">UPI (GPay / PhonePe)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                <FaCreditCard className="text-blue-500 text-sm shrink-0" />
                <span className="truncate font-semibold">Debit / Credit Cards</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                <FaUniversity className="text-amber-500 text-sm shrink-0" />
                <span className="truncate font-semibold">Net Banking (50+ Banks)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                <FaWallet className="text-purple-500 text-sm shrink-0" />
                <span className="truncate font-semibold">Paytm / Wallets</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircleIcon className="w-7 h-7 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold text-sm">Payment Succeeded!</p>
                <p className="text-xs">Your plan and {seats} seats are active now. Redirecting...</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!success && (
            <button
              type="button"
              disabled={loading || !scriptLoaded}
              onClick={handlePayNow}
              className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading || !scriptLoaded
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/25 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Processing Razorpay...</span>
                </>
              ) : (
                <>
                  <BoltIcon className="w-4 h-4" />
                  <span>Pay ₹{calculatedTotal} with Razorpay</span>
                </>
              )}
            </button>
          )}

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
            <span>256-Bit SSL Encrypted &bull; Razorpay Secure Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckout;
