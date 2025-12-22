import Navigation from '../../components/Navigation';
import SpectrumVisual from '../../components/SpectrumVisual';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Methodology | Integrated Human',
  description: 'The Development Spectrum framework—understanding where you are on your journey and meeting you there.',
  openGraph: {
    title: 'Our Methodology | Integrated Human',
    description: 'The Development Spectrum framework for personal development.',
  },
};

const spectrumStages = [
  {
    name: 'Collapse',
    description: 'When the system is overwhelmed. Crisis states, burnout, acute distress. The priority is safety and stabilization—not growth.',
    focus: 'Safety, stabilization, immediate support',
    notFor: 'Optimization techniques, productivity systems, "just think positive" approaches',
    color: 'bg-red-900/30 border-red-800',
  },
  {
    name: 'Regulation',
    description: 'Learning to manage your nervous system. Building capacity for emotional regulation. Creating a foundation of stability.',
    focus: 'Nervous system work, grounding practices, building safety',
    notFor: 'Deep shadow work, intense processing, major life changes',
    color: 'bg-orange-900/30 border-orange-800',
  },
  {
    name: 'Integration',
    description: 'The core work of personal development. Processing experiences, understanding patterns, healing wounds, building new capacities.',
    focus: 'Shadow work, pattern recognition, emotional processing, relationship repair',
    notFor: 'Skipping regulation work, forcing breakthroughs',
    color: 'bg-yellow-900/30 border-yellow-700',
  },
  {
    name: 'Embodiment',
    description: 'When insights become lived reality. Not just understanding but being. Wisdom settling into the body and daily life.',
    focus: 'Practice, consistency, living your values, sustainable change',
    notFor: 'Rushing past integration, spiritual bypassing',
    color: 'bg-green-900/30 border-green-700',
  },
  {
    name: 'Optimization',
    description: 'Fine-tuning a healthy system. Performance, flow states, peak experiences. Only relevant when the foundation is solid.',
    focus: 'Peak performance, flow, mastery, contribution',
    notFor: 'People in earlier stages—this becomes toxic productivity',
    color: 'bg-blue-900/30 border-blue-700',
  },
];

export default function MethodologyPage() {
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
              Our Methodology
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              The Development Spectrum framework—understanding where you are
              and meeting you there.
            </p>

            {/* Core Philosophy */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-lg text-gray-300 italic">
                "Personal development culture often treats everyone the same—pushing
                optimization techniques on people who are barely surviving. We believe
                the right approach depends entirely on where you are right now."
              </p>
            </div>

            {/* The Problem */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">The Problem with One-Size-Fits-All</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  Most personal development content assumes you're in a stable place,
                  ready to optimize. It pushes morning routines, productivity systems,
                  and "10x your life" thinking without asking a crucial question:
                </p>
                <p className="text-white font-medium">
                  What if you're not there yet?
                </p>
                <p>
                  Telling someone in crisis to "just be grateful" doesn't help—it shames.
                  Pushing someone in burnout to "hustle harder" doesn't motivate—it breaks.
                  The right intervention at the wrong time can do real harm.
                </p>
              </div>
            </div>

            {/* The Spectrum Visual */}
            <div className="mb-16 p-8 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <h2 className="font-serif text-2xl text-white mb-8 text-center">The Development Spectrum</h2>
              <SpectrumVisual variant="full" />
            </div>

            {/* The Spectrum Details */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Each Stage in Detail</h2>
              <p className="text-gray-400 mb-8">
                We organize human development into five stages. These aren't linear—you might
                be in different stages for different aspects of your life. The goal isn't to
                rush to "optimization." The goal is to meet yourself where you are.
              </p>

              <div className="space-y-6">
                {spectrumStages.map((stage, index) => (
                  <div
                    key={stage.name}
                    className={`p-6 border ${stage.color}`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-gray-500 font-mono text-sm">{index + 1}</span>
                      <h3 className="font-serif text-xl text-white">{stage.name}</h3>
                    </div>
                    <p className="text-gray-300 mb-4">{stage.description}</p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide text-xs">Focus</span>
                        <p className="text-gray-400 mt-1">{stage.focus}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide text-xs">Not for this stage</span>
                        <p className="text-gray-400 mt-1">{stage.notFor}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How We Apply This */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">How We Apply This</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Content Is Tagged</h3>
                  <p className="text-gray-400 text-sm">
                    Every course and article is labeled with which spectrum stage(s) it's
                    designed for. You can filter content based on where you are.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Recommendations Are Personalized</h3>
                  <p className="text-gray-400 text-sm">
                    Based on your profile, we recommend content that matches your current
                    needs—not content that assumes you're already thriving.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">We Acknowledge Limitations</h3>
                  <p className="text-gray-400 text-sm">
                    Our content is currently strongest in the middle stages (Regulation,
                    Integration, Embodiment). We're honest about where our expertise ends.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Crisis Support Is Separate</h3>
                  <p className="text-gray-400 text-sm">
                    We're not a crisis service. For collapse states, we point to appropriate
                    resources rather than pretending our courses can address acute needs.
                  </p>
                </div>
              </div>
            </div>

            {/* A Note on Different Parts */}
            <div className="mb-16 p-8 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">A Note on Complexity</h2>
              <p className="text-gray-400">
                You're not a single point on this spectrum. Different parts of your life—work,
                relationships, family, health, creativity—might be in different stages.
                Your emotional development might be at Integration while your career is in
                Optimization. That's normal. The framework is a tool for understanding, not
                a box to fit into.
              </p>
            </div>

            {/* CTA */}
            <div className="border-t border-zinc-800 pt-12">
              <p className="text-gray-500 mb-4">
                Learn more about our standards
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/transparency/standards"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Quality Standards →
                </Link>
                <Link
                  href="/transparency/certificates"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Certificate Standards →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
