'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface PurchaseButtonProps {
  courseSlug: string;
  price: number;
  currency: string;
  className?: string;
}

export default function PurchaseButton({
  courseSlug,
  price,
  currency,
  className = '',
}: PurchaseButtonProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  useEffect(() => {
    async function checkPurchase() {
      if (session?.user) {
        try {
          const res = await fetch(`/api/purchases?courseSlug=${courseSlug}`);
          const data = await res.json();
          setPurchased(data.purchased);
        } catch (error) {
          console.error('Error checking purchase:', error);
        }
      }
      setCheckingPurchase(false);
    }

    if (status !== 'loading') {
      checkPurchase();
    }
  }, [session, status, courseSlug]);

  const handlePurchase = async () => {
    if (!session) {
      // Redirect to login
      window.location.href = `/login?callbackUrl=/courses/${courseSlug}`;
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseSlug }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingPurchase) {
    return (
      <button
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
      >
        Loading...
      </button>
    );
  }

  if (purchased) {
    return (
      <Link
        href={`/courses/${courseSlug}`}
        className={`${className} bg-green-600 hover:bg-green-700`}
      >
        Access Course
      </Link>
    );
  }

  const priceDisplay = price === 0 ? 'Free' : `$${price} ${currency}`;

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Processing...' : `Enroll Now${price === 0 ? '' : ` · ${priceDisplay}`}`}
    </button>
  );
}
