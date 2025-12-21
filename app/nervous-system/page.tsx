import Navigation from '../components/Navigation';
import NervousSystemCheckIn from '../components/NervousSystemCheckIn';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nervous System Check-In | Integrated Human',
  description: 'A quick check-in to understand your current nervous system state and what your body needs right now.',
  openGraph: {
    title: 'Nervous System Check-In | Integrated Human',
    description: 'Understand your current nervous system state.',
  },
};

export default function NervousSystemPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href="/body"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Body
            </Link>

            <NervousSystemCheckIn />

            {/* Context Section */}
            <div className="mt-16 pt-8 border-t border-zinc-800">
              <h2 className="font-serif text-2xl text-white mb-6">About This Tool</h2>
              <div className="prose prose-invert prose-gray max-w-none">
                <div className="space-y-4 text-gray-400 leading-relaxed">
                  <p>
                    This check-in is based on Polyvagal Theory, developed by Stephen Porges.
                    It describes how your autonomic nervous system responds to perceived safety
                    and threat through three main pathways:
                  </p>
                  <ul className="space-y-2 list-none pl-0">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 font-medium">Ventral Vagal</span>
                      <span>— Social engagement, feeling safe, connected, grounded</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-amber-400 font-medium">Sympathetic</span>
                      <span>— Mobilization, fight or flight, activation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 font-medium">Dorsal Vagal</span>
                      <span>— Immobilization, shutdown, conservation</span>
                    </li>
                  </ul>
                  <p>
                    None of these states are "bad" — they're all adaptive responses that helped
                    our ancestors survive. The goal isn't to stay in ventral vagal forever
                    (that's not possible), but to build the capacity to notice where you are
                    and to have tools for returning to connection when you're ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
