import Navigation from '../../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Deeper Work | Integrated Human',
  description: 'Beyond the spectrum of development lies something else—the awareness in which all of it appears.',
  openGraph: {
    title: 'The Deeper Work | Integrated Human',
    description: 'Beyond the spectrum of development lies something else.',
  },
};

const contemplativeCourses = [
  {
    slug: 'presence-practices',
    title: 'Presence Practices',
    description: 'Learning to actually be here',
  },
  {
    slug: 'meditation-fundamentals',
    title: 'Meditation Fundamentals',
    description: 'Building a sustainable practice',
  },
  {
    slug: 'foundations-of-consciousness',
    title: 'Psychedelic Foundations',
    description: 'Building capacity before going deep',
  },
  {
    slug: 'psychedelic-integration',
    title: 'Psychedelic Preparation & Integration',
    description: 'Safe and meaningful experiences',
  },
  {
    slug: 'death-contemplation',
    title: 'Death Contemplation',
    description: 'Using mortality as a teacher',
  },
];

const relatedArticles = [
  { slug: 'the-practice-of-presence', title: 'The Practice of Presence' },
  { slug: 'embracing-impermanence', title: 'Embracing Impermanence' },
  { slug: 'the-nature-of-ego', title: 'The Nature of Ego' },
  { slug: 'confronting-mortality', title: 'Confronting Mortality' },
  { slug: 'the-search-for-meaning', title: 'The Search for Meaning' },
  { slug: 'the-wisdom-of-uncertainty', title: 'The Wisdom of Uncertainty' },
];

export default function DeeperWorkPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/transparency" className="text-gray-500 hover:text-gray-300 transition-colors">
                &larr; Back to Transparency
              </Link>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              The Deeper Work
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              Beyond the spectrum of development lies something else—the awareness
              in which all of it appears.
            </p>

            {/* Opening */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-lg text-gray-300 italic">
                "The spectrum maps human development—how we grow, heal, and become
                more integrated. But there's a dimension the spectrum can't capture:
                the awareness that watches the whole dance."
              </p>
            </div>

            {/* The Pointing */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">What This Points Toward</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  The Development Spectrum is about becoming—becoming more regulated,
                  more integrated, more embodied. And this work matters. You can't
                  skip it. Spiritual bypassing doesn't work.
                </p>
                <p>
                  But alongside the work of becoming, there's another dimension:
                  the recognition of what you already are. Not what you're becoming—what
                  is already here, watching the becoming.
                </p>
                <p>
                  Call it awareness, consciousness, presence, the witness, the ground
                  of being. Different traditions use different words. The words don't
                  matter. What matters is that this isn't something you achieve at the
                  end of <Link href="/transparency/methodology" className="text-gray-300 hover:text-white underline underline-offset-2">the spectrum</Link>. It's available now. It's what's looking.
                </p>
              </div>
            </div>

            {/* The Relationship */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Development and Awakening</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  There's a relationship between psychological development and awakening,
                  but it's not linear. You don't complete the spectrum and then wake up.
                  Awakening can happen at any point—and usually does in glimpses before
                  it stabilizes.
                </p>
                <p>
                  But without psychological integration, awakening experiences often
                  don't stick. The insight fades. Or worse, they're used to bypass
                  the hard work that remains. "I'm already enlightened, so I don't
                  need to look at my shadow." This is a trap.
                </p>
                <p>
                  The deepest understanding seems to be: do the psychological work
                  <em> and </em> recognize what's already here. They're not opposed.
                  Integration clears the obstacles; recognition reveals what was
                  never obscured.
                </p>
              </div>
            </div>

            {/* What We Offer */}
            <div className="mb-16 p-8 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">What We Can and Can't Offer</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  We can't teach awakening. No one can. It's not a skill to be
                  transmitted. We can only point—and pointing is not the moon.
                </p>
                <p>
                  What we can offer: practices that quiet the noise. Meditation
                  that builds the capacity to look. Frameworks for working with
                  psychedelics safely—substances that can, in the right conditions,
                  reveal what's behind the curtain. Contemplations on death that
                  strip away what doesn't matter.
                </p>
                <p>
                  We can also offer honesty: we're fellow travelers, not enlightened
                  teachers. We've tasted something. We're still integrating it.
                  We're suspicious of anyone who claims to have arrived.
                </p>
              </div>
            </div>

            {/* The Paths */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Paths Into This Territory</h2>
              <div className="space-y-4 text-gray-400 mb-8">
                <p>
                  Different doors lead to the same room. Some people find it through
                  meditation—years of sitting, watching the mind, until something
                  shifts. Some find it through psychedelics—a compressed glimpse
                  that then needs integration. Some through inquiry—asking "what
                  am I?" until the question dissolves. Some through crisis—when
                  everything falls apart and something remains.
                </p>
                <p>
                  We offer content on several of these paths. Not because one is
                  better, but because different doors open for different people.
                </p>
              </div>

              {/* Courses */}
              <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-4">Related Courses</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {contemplativeCourses.map((course) => (
                  <Link
                    key={course.slug}
                    href={`/courses/${course.slug}`}
                    className="block p-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <h4 className="text-white font-medium mb-1">{course.title}</h4>
                    <p className="text-gray-500 text-sm">{course.description}</p>
                  </Link>
                ))}
              </div>

              {/* Articles */}
              <h3 className="text-gray-500 text-sm uppercase tracking-wide mb-4">Related Articles</h3>
              <div className="flex flex-wrap gap-2">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/posts/${article.slug}`}
                    className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {article.title}
                  </Link>
                ))}
              </div>
            </div>

            {/* A Note on Psychedelics */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">A Note on Psychedelics</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  Psychedelics can show you, in hours, what might take years of
                  meditation. They can also destabilize you, trigger latent
                  conditions, or create experiences you're not ready to integrate.
                </p>
                <p>
                  We're not advocates or opponents. We're pragmatists. These
                  substances exist, people use them, and the quality of preparation
                  and integration determines whether the experience heals or harms.
                </p>
                <p>
                  Our courses on psychedelics focus on harm reduction, preparation,
                  and integration—not on convincing anyone to use them. If you're
                  going to walk this path, walk it carefully.
                </p>
              </div>
            </div>

            {/* The Paradox */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">The Paradox</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  Here's the strange thing: the awareness we're pointing toward
                  doesn't need development. It doesn't improve. It's not on a
                  spectrum. It's the space in which the spectrum appears.
                </p>
                <p>
                  And yet, the human being <em>does</em> develop. The nervous system
                  regulates. The shadow integrates. The body embodies. These aren't
                  illusions to transcend—they're the dance of being human.
                </p>
                <p>
                  Hold both. Do the work of becoming. And notice what was never
                  becoming anything at all.
                </p>
              </div>
            </div>

            {/* Closing quote */}
            <div className="mb-16 p-8 bg-zinc-900/30 border border-zinc-800">
              <p className="text-gray-400 italic">
                "Before enlightenment, chop wood, carry water. After enlightenment,
                chop wood, carry water."
              </p>
              <p className="text-gray-600 text-sm mt-2">— Zen proverb</p>
            </div>

            {/* Two Paths */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Two Paths</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  <strong className="text-gray-300">The indirect path</strong> works
                  through the spectrum. Regulate the nervous system. Integrate the shadow.
                  Embody what you've learned. As you do this, something shifts—the noise
                  quiets, identification loosens, and what was always here becomes easier
                  to notice.
                </p>
                <p>
                  <strong className="text-gray-300">The direct path</strong> turns
                  attention toward awareness itself. "Who am I?" "What is looking?"
                  Rest there, and something surprising happens: the qualities you
                  were trying to cultivate arise on their own. Why? Because you're
                  no longer identified with the resistance. The fighting stops.
                  Presence becomes natural. Acceptance stops being effort. The
                  spectrum work becomes automated.
                </p>
                <p>
                  Most people need both. Glimpses of recognition, and gradual integration.
                  The direct path without integration becomes spiritual bypassing.
                  The indirect path without recognition can become self-improvement
                  that never arrives.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <p className="text-gray-500 mb-4">
                Explore the framework
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/transparency/methodology"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  &larr; The Development Spectrum
                </Link>
                <Link
                  href="/soul"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Browse Soul Content &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
