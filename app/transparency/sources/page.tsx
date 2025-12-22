import Navigation from '../../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sources & Influences | Integrated Human',
  description: 'The traditions, researchers, and thinkers that inform our approach to personal development.',
  openGraph: {
    title: 'Sources & Influences | Integrated Human',
    description: 'What traditions and research inform our content.',
  },
};

const categories = [
  {
    name: 'Psychology & Therapy',
    description: 'The clinical and theoretical foundations we draw from.',
    sources: [
      {
        name: 'Attachment Theory',
        figures: 'John Bowlby, Mary Ainsworth, Sue Johnson',
        what: 'Understanding how early relationships shape adult patterns of connection.',
      },
      {
        name: 'Internal Family Systems (IFS)',
        figures: 'Richard Schwartz',
        what: 'Parts work—relating to inner conflicts as a system of protective parts.',
      },
      {
        name: 'Jungian Psychology',
        figures: 'Carl Jung, Marie-Louise von Franz, Robert Moore',
        what: 'Shadow work, archetypes, individuation, the collective unconscious.',
      },
      {
        name: 'Somatic Psychology',
        figures: 'Peter Levine, Pat Ogden, Bessel van der Kolk',
        what: 'The body as a site of trauma and healing. Somatic experiencing.',
      },
      {
        name: 'Polyvagal Theory',
        figures: 'Stephen Porges, Deb Dana',
        what: 'Understanding the nervous system states and their role in safety and connection.',
      },
      {
        name: 'Developmental Psychology',
        figures: 'Erik Erikson, Donald Winnicott',
        what: 'Life stages, the "good enough" parent, true and false self.',
      },
    ],
  },
  {
    name: 'Contemplative Traditions',
    description: 'Ancient wisdom traditions that have stood the test of time.',
    sources: [
      {
        name: 'Buddhism',
        figures: 'Traditional teachings, Pema Chödrön, Jack Kornfield, Tara Brach',
        what: 'Mindfulness, impermanence, suffering as resistance, compassion practices.',
      },
      {
        name: 'Advaita Vedanta',
        figures: 'Ramana Maharshi, Nisargadatta Maharaj, Rupert Spira',
        what: 'Non-dual awareness, the nature of self, direct inquiry.',
      },
      {
        name: 'Stoicism',
        figures: 'Marcus Aurelius, Epictetus, Seneca',
        what: 'What is within our control, virtue ethics, equanimity.',
      },
      {
        name: 'Existentialism',
        figures: 'Viktor Frankl, Irvin Yalom, Rollo May',
        what: 'Meaning-making, facing mortality, authentic living.',
      },
    ],
  },
  {
    name: 'Neuroscience & Biology',
    description: 'The scientific understanding of mind, brain, and body.',
    sources: [
      {
        name: 'Neuroplasticity Research',
        figures: 'Norman Doidge, Richard Davidson',
        what: 'The brain\'s capacity to change throughout life.',
      },
      {
        name: 'Stress & Resilience',
        figures: 'Robert Sapolsky, Kelly McGonigal',
        what: 'How stress affects the body and mind, building resilience.',
      },
      {
        name: 'Sleep Science',
        figures: 'Matthew Walker',
        what: 'The critical role of sleep in mental and physical health.',
      },
      {
        name: 'Psychedelic Research',
        figures: 'Robin Carhart-Harris, Roland Griffiths, Stanislav Grof',
        what: 'The therapeutic potential of altered states, integration practices.',
      },
    ],
  },
  {
    name: 'Embodiment & Movement',
    description: 'Understanding the body as integral to psychological work.',
    sources: [
      {
        name: 'Feldenkrais Method',
        figures: 'Moshé Feldenkrais',
        what: 'Movement awareness, neuroplasticity through movement.',
      },
      {
        name: 'Breathwork Traditions',
        figures: 'Wim Hof, Stanislav Grof, traditional pranayama',
        what: 'Using breath to regulate the nervous system and access altered states.',
      },
      {
        name: 'Embodied Cognition',
        figures: 'Antonio Damasio, Eugene Gendlin',
        what: 'The body\'s role in emotion, cognition, and the felt sense.',
      },
    ],
  },
  {
    name: 'Relationships & Intimacy',
    description: 'Understanding how we connect with others.',
    sources: [
      {
        name: 'Emotionally Focused Therapy',
        figures: 'Sue Johnson',
        what: 'Attachment in adult relationships, the science of love.',
      },
      {
        name: 'Gottman Research',
        figures: 'John & Julie Gottman',
        what: 'What makes relationships work, the four horsemen, repair attempts.',
      },
      {
        name: 'Relational Psychoanalysis',
        figures: 'Stephen Mitchell',
        what: 'The self as formed in relationship, transference in daily life.',
      },
    ],
  },
];

export default function SourcesPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/transparency" className="text-gray-500 hover:text-gray-300 transition-colors">
                ← Back to Transparency
              </Link>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Sources & Influences
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              The traditions, researchers, and thinkers that inform our approach.
              We stand on many shoulders.
            </p>

            {/* Note on approach */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-gray-300 italic">
                We draw from multiple lineages without claiming mastery of any.
                Our approach is synthetic—taking what's useful, testing it in practice,
                and acknowledging when we're working beyond established evidence.
              </p>
            </div>

            {/* Categories */}
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category.name}>
                  <h2 className="font-serif text-2xl text-white mb-2">{category.name}</h2>
                  <p className="text-gray-500 text-sm mb-6">{category.description}</p>

                  <div className="space-y-6">
                    {category.sources.map((source) => (
                      <div
                        key={source.name}
                        className="p-5 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <h3 className="text-white font-medium mb-1">{source.name}</h3>
                        <p className="text-gray-500 text-sm mb-2">{source.figures}</p>
                        <p className="text-gray-400 text-sm">{source.what}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* What We're Not */}
            <div className="mt-16 pt-16 border-t border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-6">What We're Not Drawing From</h2>
              <p className="text-gray-400 mb-4">
                For transparency, here are some popular approaches we don't use or
                recommend:
              </p>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-gray-600">—</span>
                  <span>Manifestation and Law of Attraction frameworks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600">—</span>
                  <span>Hustle culture and toxic productivity approaches</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600">—</span>
                  <span>Cult-like group dynamics or guru worship</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600">—</span>
                  <span>Approaches that bypass emotional pain rather than process it</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="border-t border-zinc-800 pt-12 mt-16">
              <p className="text-gray-500 mb-4">
                Want to explore our methodology?
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/transparency/methodology"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Our Methodology →
                </Link>
                <Link
                  href="/transparency/standards"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Quality Standards →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
