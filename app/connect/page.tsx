'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';
import Navigation from '../components/Navigation';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Extend Window interface for grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function ConnectPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(!RECAPTCHA_SITE_KEY);

  const getCaptchaToken = useCallback(async (): Promise<string | null> => {
    if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) {
      return null;
    }

    return new Promise((resolve) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, {
            action: 'contact',
          });
          resolve(token);
        } catch (error) {
          console.error('reCAPTCHA error:', error);
          resolve(null);
        }
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      // Get captcha token if reCAPTCHA is configured
      const captchaToken = await getCaptchaToken();

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <>
      {/* Load reCAPTCHA v3 script if site key is configured */}
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          onLoad={() => setRecaptchaLoaded(true)}
        />
      )}
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-12">
              Connect
            </h1>

            <div className="space-y-8 text-gray-300 leading-relaxed text-lg mb-12">
              <p>
                If something resonated, if you have questions, or if you just want to say hello — reach out.
              </p>
              <p>
                I read every message. I can't promise I'll respond to everything immediately,
                but I do my best to reply to thoughtful questions and feedback.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 md:p-12">
              <h2 className="font-serif text-2xl font-light text-white mb-6">Get In Touch</h2>

              {status === 'success' ? (
                <div className="text-gray-300 py-8 text-center">
                  <p className="text-lg mb-2">Message sent.</p>
                  <p className="text-sm text-gray-500">Thanks for reaching out. I'll get back to you when I can.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === 'error' && (
                    <p className="text-red-400 text-sm">{errorMessage}</p>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      placeholder="Your name"
                      required
                      disabled={status === 'loading'}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      placeholder="your@email.com"
                      required
                      disabled={status === 'loading'}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm text-gray-400 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={8}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-zinc-700 text-white placeholder-gray-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                      placeholder="What's on your mind?"
                      required
                      disabled={status === 'loading'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading' || (!!RECAPTCHA_SITE_KEY && !recaptchaLoaded)}
                    className="w-full px-8 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>

                  {RECAPTCHA_SITE_KEY && (
                    <p className="text-xs text-gray-600 text-center mt-4">
                      Protected by reCAPTCHA.{' '}
                      <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">
                        Privacy
                      </a>{' '}
                      &{' '}
                      <a href="https://policies.google.com/terms" className="underline" target="_blank" rel="noopener noreferrer">
                        Terms
                      </a>
                    </p>
                  )}
                </form>
              )}
            </div>

            <div className="mt-12 p-8 bg-zinc-900 border border-zinc-800">
              <h3 className="font-serif text-xl font-light text-white mb-4">
                Other Ways to Connect
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Social links and community spaces coming soon.
                For now, the best way to stay updated is through the newsletter on the homepage.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
