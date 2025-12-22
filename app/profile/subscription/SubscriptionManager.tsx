'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SubscriptionData {
  id: string;
  tier: string;
  tierName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: string[];
}

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
    setLoading(false);
  };

  const handleAction = async (action: 'cancel' | 'resume' | 'portal') => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (action === 'portal' && data.url) {
        window.location.href = data.url;
        return;
      }

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        loadSubscription();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    }
    setActionLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl text-white mb-2">No Active Subscription</h2>
          <p className="text-gray-400 mb-6">
            Subscribe to unlock all courses, get AI credits, and support your integration journey.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
          >
            View Plans
          </Link>
        </div>

        {/* Benefits Preview */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">Membership Benefits</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-400">Unlimited access to courses</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-400">Monthly AI credits</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-400">Discounts on advanced content</span>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-400">Priority support</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = subscription.status === 'active';
  const isPastDue = subscription.status === 'past_due';

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-800 text-green-400'
            : 'bg-red-900/20 border-red-800 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-serif text-2xl text-white">{subscription.tierName}</h2>
              <span className={`px-2 py-0.5 text-xs uppercase tracking-wide ${
                isActive && !subscription.cancelAtPeriodEnd
                  ? 'bg-green-900/50 text-green-400'
                  : isPastDue
                    ? 'bg-red-900/50 text-red-400'
                    : 'bg-yellow-900/50 text-yellow-400'
              }`}>
                {subscription.cancelAtPeriodEnd
                  ? 'Canceling'
                  : subscription.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {subscription.cancelAtPeriodEnd
                ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                : `Renews ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          </div>

          <Link
            href="/pricing"
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Change plan
          </Link>
        </div>

        {/* Features */}
        <div className="border-t border-zinc-800 pt-6">
          <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-4">Your Benefits</h3>
          <ul className="space-y-2">
            {subscription.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-300">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Billing Period */}
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-4">Billing Period</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">
              {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {subscription.cancelAtPeriodEnd
                ? 'Subscription will not renew'
                : 'Automatically renews'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-4">Manage</h3>
        <div className="space-y-3">
          {/* Billing Portal */}
          <button
            onClick={() => handleAction('portal')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div className="text-left">
                <p className="text-white">Update Payment Method</p>
                <p className="text-gray-500 text-sm">Change card or billing details</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Cancel / Resume */}
          {subscription.cancelAtPeriodEnd ? (
            <button
              onClick={() => handleAction('resume')}
              disabled={actionLoading}
              className="w-full flex items-center justify-between p-4 bg-green-900/20 border border-green-800/50 hover:bg-green-900/30 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div className="text-left">
                  <p className="text-green-400">Resume Subscription</p>
                  <p className="text-gray-500 text-sm">Continue your membership</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleAction('cancel')}
              disabled={actionLoading}
              className="w-full flex items-center justify-between p-4 border border-zinc-700 hover:border-red-800/50 hover:bg-red-900/10 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div className="text-left">
                  <p className="text-gray-300">Cancel Subscription</p>
                  <p className="text-gray-500 text-sm">Access continues until period end</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Past Due Warning */}
      {isPastDue && (
        <div className="bg-red-900/20 border border-red-800 p-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-red-400 font-medium mb-1">Payment Failed</h3>
              <p className="text-gray-400 text-sm mb-3">
                Your last payment didn't go through. Please update your payment method to continue your subscription.
              </p>
              <button
                onClick={() => handleAction('portal')}
                className="text-sm text-red-400 hover:text-red-300 underline"
              >
                Update payment method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
