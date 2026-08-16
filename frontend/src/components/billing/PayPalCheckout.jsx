import React, { useState, useEffect, useRef } from 'react';
import { paymentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/**
 * Global helper to load the PayPal SDK script safely once.
 * Avoids multiple script insertions or removing scripts while zoid is active.
 */
let scriptPromise = null;

const loadPayPalScript = (clientId, currency = 'USD') => {
  if (window.paypal) {
    return Promise.resolve(window.paypal);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const scriptId = 'paypal-js-sdk';
    let script = document.getElementById(scriptId);

    if (script) {
      if (window.paypal) {
        resolve(window.paypal);
        return;
      }
      script.addEventListener('load', () => resolve(window.paypal), { once: true });
      script.addEventListener('error', (e) => reject(e), { once: true });
      return;
    }

    script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&components=buttons`;
    script.async = true;
    script.onload = () => {
      resolve(window.paypal);
    };
    script.onerror = (err) => {
      scriptPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return scriptPromise;
};

/**
 * PayPal Checkout Modal
 *
 * Renders a PayPal Smart Button inside a modal overlay.
 * Uses the PayPal JS SDK loaded dynamically.
 *
 * Props:
 *   plan       – { id, name, price, currency }
 *   onClose    – () => void
 *   onSuccess  – (data) => void   (called after successful payment)
 */
const PayPalCheckout = ({ plan, onClose, onSuccess }) => {
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | ready | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const paypalContainerRef = useRef(null);
  const buttonsInstanceRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (buttonsInstanceRef.current && typeof buttonsInstanceRef.current.close === 'function') {
        try {
          buttonsInstanceRef.current.close().catch(() => {});
        } catch {
          // ignore zoid teardown errors on unmount
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!plan) return;

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AeL8e53xhlpZGF7sBBrSHNDh7cbZDWmHjsFir_9jPXYTXcp4L6FXysyobFYWYPya2BMPZGlhMpB4roL7';
    if (!clientId) {
      setStatus('error');
      setErrorMsg('PayPal is not configured. Please add VITE_PAYPAL_CLIENT_ID to your environment.');
      return;
    }

    let isSubscribed = true;
    setStatus('loading');
    setErrorMsg('');

    loadPayPalScript(clientId, 'USD')
      .then((paypal) => {
        if (!isSubscribed || !isMountedRef.current) return;
        if (!paypal || !paypal.Buttons) {
          throw new Error('PayPal SDK loaded without Buttons component');
        }

        // Clean up previous button if active
        if (buttonsInstanceRef.current && typeof buttonsInstanceRef.current.close === 'function') {
          try {
            buttonsInstanceRef.current.close().catch(() => {});
          } catch {
            // ignore
          }
          buttonsInstanceRef.current = null;
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
              const response = await paymentService.createOrder(
                plan.id,
                plan.currency || 'USD',
                plan.seats || 10
              );
              return response.data.orderId;
            } catch (err) {
              if (isMountedRef.current) {
                setStatus('error');
                setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Failed to create PayPal order. Make sure you are logged in.');
              }
              throw err;
            }
          },

          onApprove: async (data) => {
            if (isMountedRef.current) setStatus('processing');
            try {
              const response = await paymentService.captureOrder(
                data.orderID,
                plan.id,
                plan.currency || 'USD',
                plan.seats || 10
              );
              if (isMountedRef.current) {
                setSuccessData(response.data);
                setStatus('success');
              }

              if (refreshProfile) {
                await refreshProfile();
              }

              if (onSuccess) onSuccess(response.data);
            } catch (err) {
              if (isMountedRef.current) {
                setStatus('error');
                setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Payment capture failed.');
              }
            }
          },

          onCancel: () => {
            // User closed PayPal popup
          },

          onError: (err) => {
            const msg = String(err?.message || err || '');
            // Ignore normal component teardown errors when modal closes or cleans up
            if (msg.includes('zoid') || msg.includes('destroyed') || msg.includes('component destroyed')) {
              return;
            }
            console.error('[PayPal] SDK error:', err);
            if (isMountedRef.current) {
              setStatus('error');
              setErrorMsg('PayPal encountered an error. Please try again.');
            }
          },
        });

        buttonsInstanceRef.current = buttons;

        if (paypalContainerRef.current && buttons.isEligible()) {
          buttons
            .render(paypalContainerRef.current)
            .then(() => {
              if (isSubscribed && isMountedRef.current) {
                setStatus('ready');
              }
            })
            .catch((err) => {
              const msg = String(err?.message || err || '');
              if (msg.includes('zoid') || msg.includes('destroyed') || msg.includes('component destroyed')) {
                return;
              }
              console.error('[PayPal] Render error:', err);
              if (isSubscribed && isMountedRef.current) {
                setStatus('error');
                setErrorMsg('Failed to render PayPal buttons.');
              }
            });
        } else if (isSubscribed && isMountedRef.current) {
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!isSubscribed || !isMountedRef.current) return;
        console.error('[PayPal] SDK script loading error:', err);
        setStatus('error');
        setErrorMsg('Failed to load PayPal SDK. Please check your internet connection.');
      });

    return () => {
      isSubscribed = false;
    };
  }, [plan, retryCount]);

  const isINR = plan.currency === 'INR';
  const seats = plan.seats || 10;
  const rateUSD = plan.id === 'hatch' ? 4 : 10;
  const rateINR = plan.id === 'hatch' ? 299 : 799;
  const totalUSD = (rateUSD * seats).toFixed(2);
  const totalINR = (rateINR * seats).toLocaleString('en-IN');

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.name} Plan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300">
                {seats} Seats
              </span>
            </div>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
              {isINR ? `₹${plan.price || totalINR} INR / month` : `$${plan.price || totalUSD} USD / month`}
              {isINR && (
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">
                  (~${totalUSD} USD)
                </span>
              )}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {seats} Employees × {isINR ? `₹${rateINR}` : `$${rateUSD}`}/emp • {isINR ? 'Processed in USD via PayPal' : 'Monthly billing'}
            </p>
          </div>
          {status !== 'processing' && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading PayPal...</p>
            </div>
          )}

          {/* PayPal Buttons Container */}
          <div
            ref={paypalContainerRef}
            className={status === 'loading' || status === 'success' || status === 'processing' ? 'hidden' : ''}
          />

          {/* Processing state */}
          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Processing payment...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Please don't close this window.</p>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Payment Successful!</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your <strong>{plan.name}</strong> plan is now active.
                </p>
                {successData?.expiresAt && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Active until {new Date(successData.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <ExclamationCircleIcon className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Payment Failed</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{errorMsg}</p>
              </div>
              <button
                onClick={() => {
                  setRetryCount((c) => c + 1);
                }}
                className="mt-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === 'ready' || status === 'loading') && (
          <div className="px-6 pb-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Payments secured by PayPal. We never see your card details.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayPalCheckout;
