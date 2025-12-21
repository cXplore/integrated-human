'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CreditPackage,
  AI_CREDIT_PRICE,
  TOKENS_PER_CREDIT,
  MIN_CUSTOM_CREDIT_AMOUNT,
  MAX_CUSTOM_CREDIT_AMOUNT,
} from '@/lib/subscriptions';

interface CreditPackagesProps {
  packages: CreditPackage[];
}

export default function CreditPackages({ packages }: CreditPackagesProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!session?.user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoadingId(pkg.id);

    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        setLoadingId(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingId(null);
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  const handleCustomPurchase = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < MIN_CUSTOM_CREDIT_AMOUNT || amount > MAX_CUSTOM_CREDIT_AMOUNT) {
      return;
    }

    if (!session?.user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoadingId('custom');

    try {
      const credits = Math.floor(amount / AI_CREDIT_PRICE);
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAmount: amount, credits }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        setLoadingId(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingId(null);
    }
  };

  const customCredits = customAmount
    ? Math.floor(parseFloat(customAmount) / AI_CREDIT_PRICE)
    : 0;
  const customTokens = customCredits * TOKENS_PER_CREDIT;
  const isValidCustomAmount =
    customAmount &&
    !isNaN(parseFloat(customAmount)) &&
    parseFloat(customAmount) >= MIN_CUSTOM_CREDIT_AMOUNT &&
    parseFloat(customAmount) <= MAX_CUSTOM_CREDIT_AMOUNT;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const totalTokens = pkg.credits * TOKENS_PER_CREDIT;
          return (
            <div
              key={pkg.id}
              className="bg-zinc-900 border border-zinc-800 p-6 text-center"
            >
              <div className="text-3xl font-light text-white mb-1">
                {pkg.credits}
              </div>
              <div className="text-gray-500 text-sm mb-1">credits</div>
              <div className="text-gray-600 text-xs mb-4">
                ({formatTokens(totalTokens)} tokens)
              </div>

              <div className="text-2xl font-light text-white mb-1">
                ${pkg.price.toFixed(2)}
              </div>
              <div className="text-gray-500 text-sm mb-6">
                ${AI_CREDIT_PRICE.toFixed(3)} per credit
              </div>

              <button
                onClick={() => handlePurchase(pkg)}
                disabled={loadingId === pkg.id}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingId === pkg.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Buy Credits'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom amount */}
      <div className="bg-zinc-900 border border-zinc-800 p-6">
        <div className="text-center mb-4">
          <div className="text-lg font-light text-white mb-1">Custom Amount</div>
          <div className="text-gray-500 text-sm">
            Choose your own amount (${MIN_CUSTOM_CREDIT_AMOUNT}-${MAX_CUSTOM_CREDIT_AMOUNT})
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min={MIN_CUSTOM_CREDIT_AMOUNT}
              max={MAX_CUSTOM_CREDIT_AMOUNT}
              step="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={MIN_CUSTOM_CREDIT_AMOUNT.toString()}
              className="w-32 pl-7 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 text-white text-center rounded focus:outline-none focus:border-zinc-500"
            />
          </div>

          {isValidCustomAmount && (
            <div className="text-gray-400 text-sm">
              = {customCredits.toLocaleString()} credits ({formatTokens(customTokens)} tokens)
            </div>
          )}

          <button
            onClick={handleCustomPurchase}
            disabled={!isValidCustomAmount || loadingId === 'custom'}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingId === 'custom' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              'Buy Credits'
            )}
          </button>
        </div>

        <div className="text-center mt-4 text-gray-600 text-xs">
          Credits never expire
        </div>
      </div>
    </div>
  );
}
