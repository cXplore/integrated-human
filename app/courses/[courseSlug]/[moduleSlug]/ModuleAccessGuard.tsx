'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ModuleAccessGuardProps {
  courseSlug: string;
  moduleSlug: string;
  moduleNumber: number;
  courseTitle: string;
  price: number;
  currency: string;
  children: React.ReactNode;
}

export default function ModuleAccessGuard({
  courseSlug,
  moduleSlug,
  moduleNumber,
  courseTitle,
  price,
  currency,
  children,
}: ModuleAccessGuardProps) {
  const { data: session, status } = useSession();
  const [purchased, setPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  // First module is always free
  const isPreviewModule = moduleNumber === 1;

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

  // Show content if: it's the preview module, OR user has purchased
  const hasAccess = isPreviewModule || purchased;

  // While checking, show loading for non-preview modules
  if (!isPreviewModule && (status === 'loading' || checkingPurchase)) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-zinc-800 rounded w-full mb-4"></div>
        <div className="h-4 bg-zinc-800 rounded w-5/6 mb-4"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Locked state
  return (
    <div className="relative">
      {/* Blurred preview of first ~200 chars */}
      <div className="relative overflow-hidden max-h-48">
        <div className="blur-sm opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950" />
      </div>

      {/* Locked message */}
      <div className="mt-8 p-8 bg-zinc-900 border border-zinc-800 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h3 className="font-serif text-2xl text-white mb-3">
          This Module is Locked
        </h3>

        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Enroll in <span className="text-white">{courseTitle}</span> to access this module and all course content, including quizzes and certificates.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <EnrollButton
            courseSlug={courseSlug}
            price={price}
            currency={currency}
          />
          <Link
            href={`/courses/${courseSlug}`}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            View Course Details →
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-600">
          Module 1 is free to preview.{' '}
          <Link href={`/courses/${courseSlug}`} className="text-gray-500 hover:text-gray-400 underline">
            Start there →
          </Link>
        </p>
      </div>
    </div>
  );
}

// Separate component for the enroll button to handle checkout
function EnrollButton({
  courseSlug,
  price,
  currency,
}: {
  courseSlug: string;
  price: number;
  currency: string;
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!session) {
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

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className={`px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? 'Processing...' : `Enroll Now · $${price} ${currency}`}
    </button>
  );
}
