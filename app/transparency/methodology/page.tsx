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
    withPresence: 'Surrender—allowing the breakdown, accepting help, letting go of what cannot be held',
    withoutPresence: 'Drowning—thrashing, isolation, refusing support, fighting the inevitable',
    color: 'bg-zinc-900/60 border-zinc-700/50',
  },
  {
    name: 'Regulation',
    description: 'Learning to manage your nervous system. Building capacity for emotional regulation. Creating a foundation of stability.',
    focus: 'Nervous system work, grounding practices, building safety',
    notFor: 'Deep shadow work, intense processing, major life changes',
    withPresence: 'Safety—grounding, finding stability, building capacity to feel',
    withoutPresence: 'Numbing—avoiding sensation, substances, dissociation, endless distraction',
    color: 'bg-zinc-900/50 border-zinc-700/50',
  },
  {
    name: 'Integration',
    description: 'The core work of personal development. Processing experiences, understanding patterns, healing wounds, building new capacities.',
    focus: 'Shadow work, pattern recognition, emotional processing, relationship repair',
    notFor: 'Skipping regulation work, forcing breakthroughs',
    withPresence: 'Understanding—feeling through experiences, genuine processing, pattern recognition',
    withoutPresence: 'Rumination—endless analysis without feeling, intellectualizing pain, therapy as avoidance',
    color: 'bg-zinc-900/40 border-zinc-700/50',
  },
  {
    name: 'Embodiment',
    description: 'When insights become lived reality. Not just understanding but being. Wisdom settling into the body and daily life.',
    focus: 'Practice, consistency, living your values, sustainable change',
    notFor: 'Rushing past integration, spiritual bypassing',
    withPresence: 'Aliveness—practice infused with awareness, sustainable change, living truth',
    withoutPresence: 'Empty ritual—mechanical practice, spiritual bypassing, performance without presence',
    color: 'bg-zinc-900/30 border-zinc-700/50',
  },
  {
    name: 'Optimization',
    description: 'Fine-tuning a healthy system. Performance, flow states, peak experiences. Only relevant when the foundation is solid.',
    focus: 'Peak performance, flow, mastery, contribution',
    notFor: 'People in earlier stages—this becomes toxic productivity',
    withPresence: 'Flow—peak states, effortless action, mastery in service of meaning',
    withoutPresence: 'Burnout—grinding, pushing beyond limits, achievement as avoidance, collapse pending',
    color: 'bg-zinc-900/20 border-zinc-700/50',
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
                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide text-xs">Focus</span>
                        <p className="text-gray-400 mt-1">{stage.focus}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide text-xs">Not for this stage</span>
                        <p className="text-gray-400 mt-1">{stage.notFor}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm pt-4 border-t border-zinc-700/50">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide text-xs">With Presence</span>
                        <p className="text-gray-400 mt-1">{stage.withPresence}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 uppercase tracking-wide text-xs">Without Presence</span>
                        <p className="text-gray-500 mt-1">{stage.withoutPresence}</p>
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

            {/* The Role of Presence */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">The Role of Presence</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  Each stage of the spectrum has two versions: one with presence, one without.
                  Presence—awareness, attention, being with what is—isn't a destination at the
                  end of the journey. It's available at every stage. It's the key that moves
                  you forward.
                </p>
                <p>
                  With presence, you progress. You feel what needs to be felt, process what
                  needs to be processed, and naturally move toward greater integration.
                  Without presence—when you avoid what's actually happening—you get stuck
                  or slide backward.
                </p>
                <p>
                  Collapse with avoidance becomes drowning. Regulation with avoidance becomes
                  numbing. Integration with avoidance becomes rumination. Embodiment with
                  avoidance becomes empty ritual. Optimization with avoidance becomes burnout—
                  which eventually returns you to collapse.
                </p>
                <p>
                  Presence moves you up the spectrum. Avoidance pulls you down. This isn't
                  about being perfect—it's about noticing when you've slipped into avoiding
                  what's actually here.
                </p>
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

            {/* Research Foundations */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Research Foundations</h2>
              <p className="text-gray-400 mb-6">
                This framework synthesizes established therapeutic and developmental models.
                We stand on the shoulders of researchers and clinicians who've done rigorous
                work in this space.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 bg-zinc-900/50 border border-zinc-800">
                  <h3 className="text-white font-medium mb-2">Polyvagal Theory</h3>
                  <p className="text-gray-500 text-sm mb-2">Stephen Porges</p>
                  <p className="text-gray-400 text-sm">
                    The nervous system as a hierarchy of states (safety, fight/flight, shutdown).
                    Informs our understanding of collapse and regulation.
                  </p>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800">
                  <h3 className="text-white font-medium mb-2">Window of Tolerance</h3>
                  <p className="text-gray-500 text-sm mb-2">Dan Siegel</p>
                  <p className="text-gray-400 text-sm">
                    The zone where we can process experience without hyper- or hypo-arousal.
                    Foundational to our regulation stage.
                  </p>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800">
                  <h3 className="text-white font-medium mb-2">Internal Family Systems</h3>
                  <p className="text-gray-500 text-sm mb-2">Richard Schwartz</p>
                  <p className="text-gray-400 text-sm">
                    Parts work—understanding how "managers" protect us from "exiles."
                    The shadow versions of each stage often involve protective parts taking over.
                  </p>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800">
                  <h3 className="text-white font-medium mb-2">Spiritual Bypassing</h3>
                  <p className="text-gray-500 text-sm mb-2">John Welwood</p>
                  <p className="text-gray-400 text-sm">
                    Using spiritual practice to avoid psychological work.
                    The shadow of embodiment—empty ritual without real integration.
                  </p>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800">
                  <h3 className="text-white font-medium mb-2">Developmental Models</h3>
                  <p className="text-gray-500 text-sm mb-2">Ken Wilber, Spiral Dynamics</p>
                  <p className="text-gray-400 text-sm">
                    Stage models of human development. We borrow the insight that different
                    stages have different needs—what helps at one stage can harm at another.
                  </p>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800">
                  <h3 className="text-white font-medium mb-2">Contemplative Traditions</h3>
                  <p className="text-gray-500 text-sm mb-2">Buddhist, Taoist, and others</p>
                  <p className="text-gray-400 text-sm">
                    The insight that presence is available at every moment—not a destination.
                    "Hold on to the center" (Lao Tzu) applies at every stage.
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-6 italic">
                Our synthesis—particularly the presence/avoidance dimension across stages—is our
                own integration of these established frameworks. It's informed by research but
                hasn't been independently validated as a model.
              </p>
            </div>

            {/* Beyond the Spectrum */}
            <div className="mb-16 p-8 bg-zinc-900/30 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">Beyond the Spectrum</h2>
              <p className="text-gray-400 mb-4">
                This framework is useful. And it's not the whole picture. There's a
                dimension that meditation, psychedelics, and contemplative traditions
                point toward—something that doesn't fit neatly into stages of development.
                We offer content in that territory too.
              </p>
              <Link
                href="/transparency/deeper-work"
                className="text-gray-300 hover:text-white transition-colors"
              >
                The deeper work &rarr;
              </Link>
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
                  Quality Standards &rarr;
                </Link>
                <Link
                  href="/transparency/certificates"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Certificate Standards &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
