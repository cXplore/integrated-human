import type { Metadata } from 'next';
import NervousSystemQuiz from '../components/NervousSystemQuiz';
import Navigation from '../components/Navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nervous System State Check | Integrated Human',
  description: 'Discover your nervous system\'s current state and default patterns. Based on polyvagal theory, this assessment reveals how your body responds to stress and what it needs to regulate.',
  openGraph: {
    title: 'Nervous System State Check | Integrated Human',
    description: 'Understand your nervous system\'s state and learn what it needs to regulate.',
    type: 'website',
  },
};

export default function NervousSystemCheckPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/body"
              className="text-gray-500 hover:text-white transition-colors text-sm mb-4 inline-block"
            >
              ← Back to Body
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
              Nervous System State Check
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Your nervous system is constantly reading your environment and responding.
              This assessment reveals your current baseline—the state your body defaults
              to—and what you need to find regulation.
            </p>
          </div>

          {/* About Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 mb-12">
            <h2 className="font-serif text-xl text-white mb-3">Polyvagal Theory Basics</h2>
            <div className="space-y-3 text-gray-400 text-sm">
              <p>
                Dr. Stephen Porges' polyvagal theory describes how our autonomic nervous
                system responds to cues of safety and danger. We have three primary states:
              </p>
              <ul className="space-y-2 ml-4">
                <li>
                  <strong className="text-emerald-400">Ventral Vagal (Safe/Social)</strong> —
                  Calm, connected, able to engage. This is where we want to spend most of our time.
                </li>
                <li>
                  <strong className="text-orange-400">Sympathetic (Fight/Flight)</strong> —
                  Activated, mobilized for action. Useful for real threats, but draining as a baseline.
                </li>
                <li>
                  <strong className="text-blue-400">Dorsal Vagal (Freeze/Shutdown)</strong> —
                  Collapsed, numb, disconnected. Our oldest survival response when fight/flight fails.
                </li>
              </ul>
              <p>
                Many people also develop a <strong className="text-violet-400">fawn response</strong>—a
                pattern of appeasing others as a survival strategy, which combines elements of all three.
              </p>
            </div>
          </div>

          {/* Quiz */}
          <NervousSystemQuiz />

          {/* Footer Note */}
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <p className="text-gray-500 text-sm text-center">
              Based on polyvagal theory (Dr. Stephen Porges) and somatic psychology.
              This is a self-reflection tool, not a clinical diagnosis.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
