import type { Metadata } from 'next';
import ArchetypeQuiz from '../components/ArchetypeQuiz';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Archetype Assessment | Integrated Human',
  description: 'Discover your archetypal profile. Explore the masculine and feminine patterns that shape your psyche — King, Warrior, Magician, Lover, Queen, Mother, and more.',
  openGraph: {
    title: 'Archetype Assessment | Integrated Human',
    description: 'Discover your archetypal profile. Explore the masculine and feminine patterns that shape your psyche.',
    type: 'website',
  },
};

export default function ArchetypesPage() {
  return (
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
            Archetype Assessment
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Discover which archetypal energies are most active in your psyche.
            This assessment explores both masculine (King, Warrior, Magician, Lover)
            and feminine (Queen, Mother, Lover, Maiden, Huntress, Mystic, Wild Woman) patterns.
          </p>
        </div>

        {/* Exploration Option */}
        <div className="bg-gradient-to-r from-amber-900/20 to-zinc-900 border border-amber-800/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl text-white mb-1">Want to go deeper?</h2>
              <p className="text-gray-400 text-sm">
                Skip the quiz. Have a real conversation about your patterns, relationships, and struggles.
              </p>
            </div>
            <Link
              href="/archetype-exploration"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Guided Exploration
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-3">Uses AI credits</p>
        </div>

        {/* About Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 mb-12">
          <h2 className="font-serif text-xl text-white mb-3">How the Quiz Works</h2>
          <div className="space-y-3 text-gray-400 text-sm">
            <p>
              The four masculine archetypes are King, Warrior, Magician, and Lover.
              The seven feminine archetypes are Queen, Mother, Lover, Maiden, Huntress, Mystic, and Wild Woman.
            </p>
            <p>
              Jung observed that men also carry an inner feminine (the <em>anima</em>) and women
              an inner masculine (the <em>animus</em>) — a complementary dimension that bridges
              us to wholeness and to genuine relationship with the opposite sex.
            </p>
            <p>
              <strong className="text-white">12 questions, ~10-15 minutes.</strong> Your results
              will show your primary archetypes, shadow patterns, and inner opposite.
            </p>
          </div>
        </div>

        {/* Quiz */}
        <ArchetypeQuiz />

        {/* Footer Note */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <p className="text-gray-500 text-sm text-center">
            Based on the work of Carl Jung, Robert Moore, Douglas Gillette, and Jean Shinoda Bolen.
            This is a self-reflection tool, not a clinical assessment.
          </p>
        </div>
      </div>
    </main>
  );
}
