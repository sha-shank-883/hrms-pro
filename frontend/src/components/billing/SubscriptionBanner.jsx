import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/**
 * Non-blocking subscription expiry banner.
 * Shows when the tenant's free trial has expired but does NOT block service.
 * Dismissable with a 24-hour snooze stored in localStorage.
 */
const SubscriptionBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Check snooze
  useEffect(() => {
    const snoozedUntil = localStorage.getItem('subscription_banner_snoozed');
    if (snoozedUntil && new Date(snoozedUntil) > new Date()) {
      setDismissed(true);
    }
  }, []);

  // Determine if banner should show
  const plan = user?.subscription_plan || 'free';
  const expiry = user?.subscription_expiry;
  const isExpired = user?.subscription_expired === true;
  const isFreeExpired = plan === 'free' && isExpired;

  // Also show if there's an expiry and it's in the past
  const expiryDate = expiry ? new Date(expiry) : null;
  const isManualExpired = expiryDate && expiryDate < new Date();
  const shouldShow = (isFreeExpired || isManualExpired) && !dismissed;

  if (!shouldShow) return null;

  const handleDismiss = () => {
    setDismissed(true);
    // Snooze for 24 hours
    const snoozedUntil = new Date();
    snoozedUntil.setHours(snoozedUntil.getHours() + 24);
    localStorage.setItem('subscription_banner_snoozed', snoozedUntil.toISOString());
  };

  return (
    <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="flex items-center justify-center p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <ExclamationTriangleIcon className="h-5 w-5 text-white" />
            </span>
            <p className="text-sm font-medium truncate">
              <span className="hidden md:inline">Your free trial has expired. </span>
              <span className="md:hidden">Trial expired. </span>
              Upgrade your plan to unlock all features.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/settings?tab=billing"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-orange-600 text-sm font-bold rounded-lg hover:bg-orange-50 transition-all shadow-sm hover:shadow-md"
            >
              <SparklesIcon className="h-4 w-4" />
              Upgrade Plan
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-white/20 transition-colors"
              aria-label="Dismiss banner"
            >
              <XMarkIcon className="h-5 w-5 text-white/80 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
