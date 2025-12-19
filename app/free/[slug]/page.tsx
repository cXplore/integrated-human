import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import { getAllLeadMagnets, getLeadMagnetBySlug } from '@/lib/lead-magnets';
import LeadMagnetForm from '@/app/components/LeadMagnetForm';

export async function generateStaticParams() {
  const leadMagnets = getAllLeadMagnets();
  return leadMagnets.map((lm) => ({
    slug: lm.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const leadMagnet = getLeadMagnetBySlug(slug);

  if (!leadMagnet) {
    return {
      title: 'Resource Not Found',
    };
  }

  return {
    title: `${leadMagnet.title} | Free Download | Integrated Human`,
    description: leadMagnet.description,
  };
}

export default async function LeadMagnetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const leadMagnet = getLeadMagnetBySlug(slug);

  if (!leadMagnet) {
    notFound();
  }

  // Get related lead magnets for sidebar
  const allLeadMagnets = getAllLeadMagnets();
  const otherLeadMagnets = allLeadMagnets.filter((lm) => lm.slug !== slug).slice(0, 2);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {leadMagnet.category}
              </span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-green-500 font-medium">
                Free Download
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
              {leadMagnet.title}
            </h1>

            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              {leadMagnet.description}
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* What's Inside */}
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-light text-white mb-6">
                  What's Inside
                </h2>
                <div className="prose prose-invert max-w-none">
                  {getWhatsInside(slug)}
                </div>
              </section>

              {/* Who It's For */}
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-light text-white mb-6">
                  This Is For You If...
                </h2>
                <ul className="space-y-3">
                  {getWhoItsFor(slug).map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sidebar with Form */}
            <div className="lg:col-span-2">
              <div className="sticky top-8">
                {/* Download Form */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
                  <h3 className="text-white font-medium mb-4 text-center">
                    Get Your Free Copy
                  </h3>
                  <LeadMagnetForm
                    slug={slug}
                    title={leadMagnet.title}
                    buttonText="Download Now"
                  />
                </div>

                {/* Other Resources */}
                {otherLeadMagnets.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 p-6">
                    <h3 className="text-white font-medium mb-4">
                      Other Free Resources
                    </h3>
                    <div className="space-y-4">
                      {otherLeadMagnets.map((lm) => (
                        <Link
                          key={lm.slug}
                          href={`/free/${lm.slug}`}
                          className="block group"
                        >
                          <h4 className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium mb-1">
                            {lm.title}
                          </h4>
                          <p className="text-gray-600 text-xs">
                            {lm.category}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Courses */}
        <section className="py-16 px-6 bg-zinc-900/50 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-white mb-4">
              Ready to Go Deeper?
            </h2>
            <p className="text-gray-400 mb-8">
              This guide is just the beginning. Our courses offer comprehensive, structured paths for real transformation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/courses"
                className="px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
              >
                Browse All Courses
              </Link>
              <Link
                href="/free"
                className="px-8 py-3 border border-zinc-700 text-gray-300 hover:text-white hover:border-zinc-500 transition-colors"
              >
                More Free Resources
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Helper functions for specific content
function getWhatsInside(slug: string): React.ReactNode {
  const content: Record<string, React.ReactNode> = {
    'shadow-work-prompts': (
      <div className="space-y-4 text-gray-400">
        <p>
          This guide contains 5 powerful journaling prompts designed to surface shadow material—
          the parts of yourself you've hidden, denied, or pushed out of awareness.
        </p>
        <ul className="space-y-2">
          <li>• <strong className="text-gray-300">The Projection Mirror</strong> – See your shadow in what triggers you about others</li>
          <li>• <strong className="text-gray-300">The Forbidden Self</strong> – Reveal what you've exiled because it wasn't acceptable</li>
          <li>• <strong className="text-gray-300">The Recurring Pattern</strong> – Find shadow through life patterns that keep repeating</li>
          <li>• <strong className="text-gray-300">The Unlived Life</strong> – Discover your "golden shadow"—positive qualities you've suppressed</li>
          <li>• <strong className="text-gray-300">The Body's Shadow</strong> – Access shadow through chronic tension and body dialogue</li>
        </ul>
        <p>
          Each prompt includes reflection questions and insights to help you understand what emerges.
        </p>
      </div>
    ),
    'nervous-system-reset-checklist': (
      <div className="space-y-4 text-gray-400">
        <p>
          A printable quick-reference guide to identify your nervous system state and apply the right intervention—
          because different states need different tools.
        </p>
        <ul className="space-y-2">
          <li>• <strong className="text-gray-300">State Identification</strong> – Checklists for sympathetic, dorsal vagal, and ventral vagal states</li>
          <li>• <strong className="text-gray-300">Reset from Fight/Flight</strong> – Immediate, short, and longer interventions for activation</li>
          <li>• <strong className="text-gray-300">Reset from Shutdown</strong> – Gentle ways to come back from freeze and collapse</li>
          <li>• <strong className="text-gray-300">Daily Maintenance</strong> – Morning, throughout-day, and evening practices</li>
          <li>• <strong className="text-gray-300">Quick Reference Card</strong> – A cut-out summary to keep with you</li>
        </ul>
        <p>
          Print it, keep it visible, and use it daily until regulation becomes natural.
        </p>
      </div>
    ),
    'integration-starter-kit': (
      <div className="space-y-4 text-gray-400">
        <p>
          Your foundation guide to the four pillars of integration: Mind, Body, Soul, and Relationships.
          This is the essential framework for becoming whole.
        </p>
        <ul className="space-y-2">
          <li>• <strong className="text-gray-300">The Integration Framework</strong> – Understanding the four pillars and how they connect</li>
          <li>• <strong className="text-gray-300">Starting Points</strong> – Where to begin your integration journey</li>
          <li>• <strong className="text-gray-300">Key Concepts</strong> – Essential ideas for each pillar</li>
          <li>• <strong className="text-gray-300">Practices</strong> – Foundational exercises for each area</li>
          <li>• <strong className="text-gray-300">Resources</strong> – Where to go deeper in each domain</li>
        </ul>
      </div>
    ),
    'archetype-email-course': (
      <div className="space-y-4 text-gray-400">
        <p>
          A 7-day email journey into Jungian archetypes—the universal patterns that shape your psyche.
          One insight delivered to your inbox each day.
        </p>
        <ul className="space-y-2">
          <li>• <strong className="text-gray-300">Day 1</strong> – What are archetypes and why they matter</li>
          <li>• <strong className="text-gray-300">Day 2</strong> – The Hero/Heroine pattern</li>
          <li>• <strong className="text-gray-300">Day 3</strong> – The Shadow archetype</li>
          <li>• <strong className="text-gray-300">Day 4</strong> – The Anima/Animus</li>
          <li>• <strong className="text-gray-300">Day 5</strong> – The Wise Elder</li>
          <li>• <strong className="text-gray-300">Day 6</strong> – The Child and Trickster</li>
          <li>• <strong className="text-gray-300">Day 7</strong> – Integration and working with your archetypes</li>
        </ul>
        <p>
          Each email includes reflection prompts to help you recognize these patterns in your own life.
        </p>
      </div>
    ),
  };

  return content[slug] || <p className="text-gray-400">Practical tools for your integration journey.</p>;
}

function getWhoItsFor(slug: string): string[] {
  const audiences: Record<string, string[]> = {
    'shadow-work-prompts': [
      'You want to understand yourself at a deeper level',
      'You notice patterns in your life that keep repeating',
      'Certain people or situations trigger intense reactions in you',
      "You sense there are parts of yourself you've been avoiding",
      "You're ready to do the uncomfortable work of real self-discovery",
    ],
    'nervous-system-reset-checklist': [
      'You experience anxiety, stress, or overwhelm regularly',
      'You sometimes feel shutdown, numb, or disconnected',
      'You want practical tools you can use in the moment',
      "You're building a daily practice for nervous system health",
      "You want to understand your body's stress responses better",
    ],
    'integration-starter-kit': [
      "You're new to personal development and want a framework",
      "You've done some work but want to see how it all connects",
      'You feel fragmented and want to become more whole',
      "You're ready to take your growth seriously",
      'You want a clear path forward, not just random tips',
    ],
    'archetype-email-course': [
      "You're curious about Jungian psychology",
      'You want to understand the deeper patterns in your personality',
      "You're interested in symbols, myths, and meaning",
      'You prefer learning in small daily doses',
      'You want to discover which archetypes are active in your life',
    ],
  };

  return audiences[slug] || [
    'You want to grow and become more whole',
    "You're ready for practical tools, not just theory",
    'You value depth over quick fixes',
  ];
}
