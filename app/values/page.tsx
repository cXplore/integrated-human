import Navigation from '../components/Navigation';
import ValuesReflection from '../components/ValuesReflection';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Values Reflection | Integrated Human',
  description: 'A guided reflection to clarify what truly matters to you. Private, contemplative, and entirely for you.',
  openGraph: {
    title: 'Values Reflection | Integrated Human',
    description: 'Clarify what truly matters to you.',
  },
};

export default function ValuesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href="/soul"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Soul
            </Link>

            <ValuesReflection />

            {/* Context Section */}
            <div className="mt-16 pt-8 border-t border-zinc-800">
              <h2 className="font-serif text-2xl text-white mb-6">About This Reflection</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Most of us inherit our values from culture, family, and circumstance without
                  ever examining them. We pursue success without asking what success means to us.
                  We avoid failure without knowing what we're really afraid of losing.
                </p>
                <p>
                  Values clarification isn't about finding the "right" values — it's about
                  getting honest about what already moves you. The goal isn't to pick values
                  from a list, but to uncover what's been driving you all along.
                </p>
                <p>
                  This reflection draws on Acceptance and Commitment Therapy (ACT), existential
                  philosophy, and classic exercises in meaning-making. It's designed to help
                  you articulate what matters — so you can live more intentionally aligned with it.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
