'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-12">
      <div className="max-w-xl mx-auto text-center">
        <h3 className="font-serif text-2xl md:text-3xl font-light text-white mb-4">
          Stay Connected
        </h3>
        <p className="text-gray-400 mb-8 leading-relaxed">
          New articles on mind, body, soul and relationships. No spam, no algorithms.
          Just depth when it's ready.
        </p>

        {status === 'success' ? (
          <div className="text-gray-300 py-4">
            <p className="mb-2">You're in.</p>
            <p className="text-sm text-gray-500">We'll be in touch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            {status === 'error' && (
              <p className="text-red-400 text-sm mb-2 w-full">Something went wrong. Please try again.</p>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-3 bg-black border border-zinc-700 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-500 transition-colors"
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-gray-600">
          Unsubscribe anytime. No hard feelings.
        </p>
      </div>
    </div>
  );
}
