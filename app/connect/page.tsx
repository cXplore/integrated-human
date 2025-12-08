'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';

export default function ConnectPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
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
                    <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
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
                    disabled={status === 'loading'}
                    className="w-full px-8 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
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
