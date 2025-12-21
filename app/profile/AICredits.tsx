'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CreditData {
  creditBalance: number;
  monthlyCredits: number;
  monthlyRemainingCredits: number;
  purchasedCredits: number;
  hasCredits: boolean;
  recentUsage: {
    credits: number;
    messageCount: number;
  };
}

export default function AICredits() {
  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const response = await fetch('/api/credits');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCredits();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Unable to load credits
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wide text-gray-500">
          AI Credits
        </h2>
        <Link
          href="/pricing"
          className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
        >
          Get more →
        </Link>
      </div>

      {/* Balance */}
      <div className="text-center py-4">
        <div className="text-4xl font-serif text-white mb-1">
          {data.creditBalance.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">credits available</div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        {data.monthlyCredits > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>Monthly (remaining)</span>
            <span>{data.monthlyRemainingCredits.toLocaleString()}</span>
          </div>
        )}
        {data.purchasedCredits > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>Purchased</span>
            <span>{data.purchasedCredits.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Recent Usage */}
      {data.recentUsage.messageCount > 0 && (
        <div className="pt-3 border-t border-zinc-800">
          <div className="text-xs text-gray-500 mb-2">Last 30 days</div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{data.recentUsage.messageCount} messages</span>
            <span>{data.recentUsage.credits.toLocaleString()} credits used</span>
          </div>
        </div>
      )}

      {/* No credits warning */}
      {!data.hasCredits && (
        <div className="bg-amber-900/20 border border-amber-800/50 p-3 text-center">
          <p className="text-amber-400 text-sm">
            You're out of AI credits
          </p>
          <Link
            href="/pricing"
            className="text-xs text-amber-500 hover:text-amber-400 mt-1 inline-block"
          >
            Purchase credits to continue using AI features
          </Link>
        </div>
      )}
    </div>
  );
}
