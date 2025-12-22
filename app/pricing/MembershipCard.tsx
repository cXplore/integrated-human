'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TierConfig } from '@/lib/subscriptions';

interface MembershipCardProps {
  tier: TierConfig;
}

export default function MembershipCard({ tier }: MembershipCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  const price = interval === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  const monthlyEquivalent = interval === 'yearly' ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice;
  const savings = interval === 'yearly' ? tier.monthlyPrice * 12 - tier.yearlyPrice : 0;

  const handleSubscribe = async () => {
    if (!session?.user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier.id,
          interval,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col bg-zinc-900 border border-amber-500/50 transition-all">
      <div className="p-8 flex-1">
        <h3 className="font-serif text-3xl text-white mb-2 text-center">{tier.name}</h3>
        <p className="text-gray-400 text-center mb-8">{tier.description}</p>

        {/* Interval Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 text-sm transition-colors ${
              interval === 'monthly'
                ? 'bg-zinc-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 text-sm transition-colors ${
              interval === 'yearly'
                ? 'bg-zinc-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-light text-white">${price}</span>
            <span className="text-gray-500">/{interval === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          {interval === 'yearly' && (
            <div className="text-sm text-green-500 mt-2">
              Save ${savings}/year (${monthlyEquivalent}/mo)
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
              <svg
                className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="p-8 pt-0">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full py-4 font-medium transition-colors bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            'Start Membership'
          )}
        </button>
        <p className="text-center text-gray-500 text-xs mt-4">
          Cancel anytime. No commitment.
        </p>
      </div>
    </div>
  );
}
