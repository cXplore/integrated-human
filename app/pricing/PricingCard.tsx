'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TierConfig } from '@/lib/subscriptions';

interface PricingCardProps {
  tier: TierConfig;
  featured?: boolean;
}

export default function PricingCard({ tier, featured = false }: PricingCardProps) {
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
    <div
      className={`relative flex flex-col bg-zinc-900 border ${
        featured ? 'border-amber-500' : 'border-zinc-800'
      } transition-all`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-amber-500 text-black text-xs font-medium px-3 py-1">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        <h3 className="font-serif text-2xl text-white mb-1">{tier.name}</h3>
        <p className="text-gray-500 text-sm mb-6">{tier.description}</p>

        {/* Interval Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-3 py-1 text-sm transition-colors ${
              interval === 'monthly'
                ? 'bg-zinc-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-3 py-1 text-sm transition-colors ${
              interval === 'yearly'
                ? 'bg-zinc-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Yearly
          </button>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-light text-white">${price}</span>
            <span className="text-gray-500">/{interval === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          {interval === 'yearly' && (
            <div className="text-sm text-green-500 mt-1">
              Save ${savings}/year (${monthlyEquivalent}/mo)
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
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
      <div className="p-6 pt-0">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className={`w-full py-3 font-medium transition-colors ${
            featured
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Start ${tier.name}`
          )}
        </button>
      </div>
    </div>
  );
}
