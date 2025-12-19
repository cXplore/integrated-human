'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface PurchaseSuccessProps {
  courseSlug: string;
}

export default function PurchaseSuccess({ courseSlug }: PurchaseSuccessProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  useEffect(() => {
    const purchaseStatus = searchParams.get('purchase');
    const sessionId = searchParams.get('session_id');

    if (purchaseStatus === 'success' && sessionId) {
      setStatus('verifying');

      // Verify the purchase with our API
      fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus('success');
            // Reload after short delay to update UI
            setTimeout(() => {
              window.location.href = `/courses/${courseSlug}`;
            }, 2000);
          } else {
            setStatus('error');
          }
        })
        .catch(() => {
          setStatus('error');
        });
    } else if (purchaseStatus === 'success') {
      // Success without session ID - webhook might have handled it
      setStatus('success');
      setTimeout(() => {
        window.location.href = `/courses/${courseSlug}`;
      }, 2000);
    }
  }, [searchParams, courseSlug]);

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 p-8 max-w-md mx-4 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl text-white mb-2">Confirming your purchase...</h2>
            <p className="text-gray-400">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl text-white mb-2">Purchase Successful!</h2>
            <p className="text-gray-400">You now have access to this course. Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl text-white mb-2">Verification Issue</h2>
            <p className="text-gray-400 mb-4">
              There was an issue verifying your purchase. If you completed payment, please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-zinc-900 hover:bg-gray-200 transition-colors"
            >
              Refresh Page
            </button>
          </>
        )}
      </div>
    </div>
  );
}
