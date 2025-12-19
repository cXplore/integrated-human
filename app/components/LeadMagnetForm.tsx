'use client';

import { useState } from 'react';

interface LeadMagnetFormProps {
  slug: string;
  title: string;
  buttonText?: string;
  className?: string;
}

export default function LeadMagnetForm({
  slug,
  title,
  buttonText = 'Get Free Download',
  className = '',
}: LeadMagnetFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/lead-magnets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, slug }),
      });

      const data = await res.json();

      if (res.ok && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setStatus('success');
        // Open download in new tab
        window.open(data.downloadUrl, '_blank');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success' && downloadUrl) {
    return (
      <div className={`text-center ${className}`}>
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl text-white mb-2">Check your download!</h3>
        <p className="text-gray-400 mb-4">
          Your {title} should have opened in a new tab.
        </p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
        >
          Open Again
        </a>
        <p className="text-gray-500 text-sm mt-4">
          We've also added you to our newsletter for more insights on integration.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm text-gray-400 mb-1">
            First Name (optional)
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your first name"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full px-6 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors ${
            status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {status === 'loading' ? 'Processing...' : buttonText}
        </button>

        {status === 'error' && (
          <p className="text-red-400 text-sm text-center">
            Something went wrong. Please try again.
          </p>
        )}

        <p className="text-gray-600 text-xs text-center">
          By downloading, you agree to receive our newsletter. Unsubscribe anytime.
        </p>
      </div>
    </form>
  );
}
