import type { Metadata } from 'next';
import ShadowProfileQuiz from '../components/ShadowProfileQuiz';
import Navigation from '../components/Navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shadow Profile Assessment | Integrated Human',
  description: 'Discover your primary shadow patterns—the unconscious strategies you developed to cope with early pain. Understand what drives your reactions and begin the work of integration.',
  openGraph: {
    title: 'Shadow Profile Assessment | Integrated Human',
    description: 'Discover your primary shadow patterns and begin the work of integration.',
    type: 'website',
  },
};

export default function ShadowProfilePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black">
        <div className="max-w-3xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/mind"
              className="text-gray-500 hover:text-white transition-colors text-sm mb-4 inline-block"
            >
              ← Back to Mind
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
              Shadow Profile Assessment
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Discover the unconscious patterns that shape your behavior.
              The shadow contains what you've rejected to survive—but integration
              is how you reclaim your wholeness.
            </p>
          </div>

          {/* About Section */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 mb-12">
            <h2 className="font-serif text-xl text-white mb-3">What is the Shadow?</h2>
            <div className="space-y-3 text-gray-400 text-sm">
              <p>
                Carl Jung described the shadow as the parts of ourselves we've pushed into
                the unconscious—emotions that weren't accepted, traits that weren't safe,
                desires that were shamed. The shadow doesn't disappear; it runs the show from
                backstage.
              </p>
              <p>
                This assessment identifies your primary <strong className="text-white">shadow patterns</strong>—the
                strategies you developed early in life to cope with pain. These patterns were once
                necessary for survival. Now, they may be limiting your growth.
              </p>
              <p>
                <strong className="text-white">15 questions, ~5 minutes.</strong> Your results
                reveal your dominant patterns with guidance for integration.
              </p>
            </div>
          </div>

          {/* Quiz */}
          <ShadowProfileQuiz />

          {/* Footer Note */}
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <p className="text-gray-500 text-sm text-center">
              Based on Jungian shadow psychology and depth psychology frameworks.
              This is a self-reflection tool, not a clinical diagnosis.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
