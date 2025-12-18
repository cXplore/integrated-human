import Navigation from '../components/Navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library | Integrated Human',
  description: 'Curated book recommendations for shadow work, psychology, philosophy, and personal growth. Essential reads for the integration journey.',
  openGraph: {
    title: 'Library | Integrated Human',
    description: 'Curated book recommendations for shadow work, psychology, and personal growth.',
  },
};

const books = [
  {
    title: 'Man and His Symbols',
    author: 'Carl Jung',
    category: 'Mind',
    note: 'Jung\'s most accessible work on the unconscious, symbols, dreams, and the process of individuation. Start here if you want to understand shadow work without the academic density.',
  },
  {
    title: 'Tao Te Ching',
    author: 'Lao Tzu (Stephen Mitchell translation)',
    category: 'Soul',
    note: 'Ancient wisdom on flow, paradox, strength in softness, and wu wei (effortless action). Read when you\'re overthinking or trying to force something that won\'t move.',
  },
  {
    title: 'The Way of Zen',
    author: 'Alan Watts',
    category: 'Soul',
    note: 'Clear, grounded introduction to Zen philosophy and practice. Watts strips away the mystical nonsense while keeping the depth. Essential for understanding presence without spiritual bypassing.',
  },
  {
    title: 'Attached',
    author: 'Amir Levine & Rachel Heller',
    category: 'Mind',
    note: 'Attachment theory for real relationships. Anxious, avoidant, secure — explained without therapy jargon. Read this before blaming yourself or your partner for the same patterns repeating.',
  },
  {
    title: 'The Body Keeps the Score',
    author: 'Bessel van der Kolk',
    category: 'Body',
    note: 'How trauma lives in the body, not just the mind. Essential reading for understanding why insight alone doesn\'t heal, and why embodiment practices (breath, movement, somatic work) matter.',
  },
  {
    title: 'King, Warrior, Magician, Lover',
    author: 'Robert Moore & Douglas Gillette',
    category: 'Mind',
    note: 'Archetypal masculine development. Useful framework for understanding your patterns, though don\'t take it as gospel. Read critically, integrate what lands.',
  },
  {
    title: 'When Things Fall Apart',
    author: 'Pema Chödrön',
    category: 'Soul',
    note: 'Buddhist nun on staying present with discomfort, impermanence, and uncertainty. For when everything is collapsing and you\'re tired of running.',
  },
];

export default function LibraryPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Library
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              Essential books for the integrated life. Not self-help. Not quick fixes. Just depth.
            </p>

            <div className="space-y-6">
              {books.map((book, index) => (
                <div key={index} className="bg-zinc-900 p-8 border border-zinc-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-serif text-2xl font-light text-white">
                        {book.title}
                      </h2>
                      <p className="text-gray-400 mt-1">{book.author}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-gray-500 bg-zinc-800 px-3 py-1">
                      {book.category}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{book.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-zinc-900 border border-zinc-800">
              <p className="text-gray-300 leading-relaxed italic">
                More book notes, quotes, and author deep-dives coming soon. This is a living library —
                it grows as the work deepens.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
