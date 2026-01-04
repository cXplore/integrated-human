import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPathById } from '@/lib/learning-paths';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'From Attachment Wounds to Relationship Mastery | Integrated Human',
  description: 'The complete journey to secure, conscious relating. Understand your patterns, heal the wounds, build the skills, transform how you love.',
  openGraph: {
    title: 'From Attachment Wounds to Relationship Mastery',
    description: 'The complete journey to secure, conscious relating. 8-12 weeks of deep work that actually changes how you love.',
  },
};

export default async function AttachmentMasteryPage() {
  const path = getPathById('attachment-to-mastery');
  const session = await auth();

  // Get progress if logged in
  let completedSteps = 0;
  if (session?.user?.id && path) {
    for (const step of path.steps) {
      if (step.type === 'milestone') continue;

      let completed = false;
      if (step.type === 'course') {
        const progress = await prisma.courseProgress.findMany({
          where: { userId: session.user.id, courseSlug: step.slug },
          select: { completed: true },
        });
        completed = progress.length > 0 && progress.every((p) => p.completed);
      } else if (step.type === 'article') {
        const progress = await prisma.articleProgress.findFirst({
          where: { userId: session.user.id, slug: step.slug, completed: true },
        });
        completed = !!progress;
      } else if (step.type === 'assessment') {
        const result = await prisma.assessmentResult.findFirst({
          where: { userId: session.user.id, type: step.slug },
        });
        completed = !!result;
      }

      if (completed) completedSteps++;
    }
  }

  const totalSteps = path?.steps.filter(s => s.type !== 'milestone').length || 0;
  const hasStarted = completedSteps > 0;

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 px-6 border-b border-zinc-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-400 uppercase tracking-wide text-sm mb-4">
            The Definitive Learning Path
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">
            From Attachment Wounds<br />to Relationship Mastery
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed mb-8 max-w-2xl mx-auto">
            The complete journey to secure, conscious relating. Not a quick fix — a complete rewiring of how you love.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
            <span>8-12 weeks</span>
            <span className="text-gray-700">·</span>
            <span>6 phases</span>
            <span className="text-gray-700">·</span>
            <span>30+ resources</span>
          </div>

          <Link
            href="/posts/why-you-love-the-way-you-do"
            className="inline-block px-8 py-4 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
          >
            {hasStarted ? 'Continue the Journey' : 'Begin the Journey'}
          </Link>

          {hasStarted && (
            <p className="mt-4 text-sm text-gray-500">
              {completedSteps} of {totalSteps} steps completed
            </p>
          )}
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 border-b border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-8">
            You know the pattern.
          </h2>
          <div className="space-y-6 text-gray-400 leading-relaxed">
            <p>
              Something shifts in the relationship — a tone, a delay, a glance that lands wrong —
              and before you can think, you're gone. Reaching desperately. Or pulling away.
              Or both, somehow, at the same time.
            </p>
            <p>
              Later, you wonder: <span className="text-gray-300 italic">what was that?</span>
            </p>
            <p>
              You've read about attachment. Maybe you've even identified your "style."
              But knowing you're anxious or avoidant hasn't changed much.
              The pattern still runs. The relationships still struggle.
            </p>
            <p className="text-gray-300">
              That's because attachment isn't an information problem.
              It's a nervous system problem. And it requires a different kind of work.
            </p>
          </div>
        </div>
      </section>

      {/* What This Path Is */}
      <section className="py-20 px-6 border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-8">
            What this path actually is.
          </h2>
          <div className="space-y-6 text-gray-400 leading-relaxed">
            <p>
              This isn't "5 tips for secure attachment." This is the complete curriculum
              for transforming how you relate — from understanding your patterns at the deepest level,
              to healing the nervous system responses that hijack you, to building the skills
              that secure people have.
            </p>
            <p>
              It's 8-12 weeks of real work. Articles that make you recognize yourself.
              Courses that teach what you never learned. Practices that rewire your body.
              A sequence designed to build on itself.
            </p>
            <p className="text-gray-300">
              By the end, you won't just understand attachment.
              You'll have become someone who can create and sustain real intimacy.
            </p>
          </div>
        </div>
      </section>

      {/* The 6 Phases */}
      <section className="py-20 px-6 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-12 text-center">
            The Six Phases
          </h2>

          <div className="space-y-8">
            {/* Phase 1 */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-medium">
                  1
                </div>
                <h3 className="font-serif text-xl text-white">Recognition</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Understand the pattern that's been running your relationships.
                Not just "which style am I" but <span className="text-gray-300">why you became this way</span> and
                what it's actually cost you.
              </p>
              <div className="text-sm text-gray-500">
                The definitive article + assessment + deep dives for each style
              </div>
            </div>

            {/* Phase 2 */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400 font-medium">
                  2
                </div>
                <h3 className="font-serif text-xl text-white">Nervous System Foundation</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Attachment is a body pattern. You can't think your way to secure —
                you have to <span className="text-gray-300">regulate your way there</span>.
                This phase builds the capacity to stay present when triggered.
              </p>
              <div className="text-sm text-gray-500">
                Nervous system course + grounding practices + regulation tools
              </div>
            </div>

            {/* Phase 3 */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-medium">
                  3
                </div>
                <h3 className="font-serif text-xl text-white">Healing the Wound</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Go to the source. Where did you learn that love was dangerous?
                This is the deep work — <span className="text-gray-300">understanding and transforming the original patterns</span>.
              </p>
              <div className="text-sm text-gray-500">
                Attachment repair course + shadow work + wound exploration
              </div>
            </div>

            {/* Phase 4 */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-medium">
                  4
                </div>
                <h3 className="font-serif text-xl text-white">Building Skills</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Secure attachment isn't just healing — it's learning new capacities.
                <span className="text-gray-300">Boundaries. Communication. Repair.</span> The things secure people do naturally, that you can learn deliberately.
              </p>
              <div className="text-sm text-gray-500">
                Boundaries course + communication course + repair practice
              </div>
            </div>

            {/* Phase 5 */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 font-medium">
                  5
                </div>
                <h3 className="font-serif text-xl text-white">Real Relationships</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Apply everything to actual relating. Whether you're dating or deepening an existing relationship,
                this phase is about <span className="text-gray-300">practice in the real world</span>.
              </p>
              <div className="text-sm text-gray-500">
                Conscious dating OR conscious relationship + polarity + intimacy
              </div>
            </div>

            {/* Phase 6 */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/50 flex items-center justify-center text-white font-medium">
                  6
                </div>
                <h3 className="font-serif text-xl text-white">Mastery</h3>
              </div>
              <p className="text-gray-400 mb-4">
                The complete integration. The flagship course ties everything together —
                <span className="text-gray-300">with assessment and certification</span>.
                You've done something most people never do.
              </p>
              <div className="text-sm text-gray-500">
                Relationship Mastery flagship course + final integration
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-20 px-6 border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-8 text-center">
            What you'll gain.
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Understand your pattern at the deepest level',
              'Regulate your nervous system when triggered',
              'Heal the original wounds that created the pattern',
              'Communicate needs directly without drama',
              'Set boundaries that protect without isolating',
              'Choose partners who are actually good for you',
              'Repair ruptures instead of running or clinging',
              'Experience secure love — calm, present, real',
            ].map((outcome, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-zinc-900 border border-zinc-800">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20 px-6 border-b border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl text-white mb-8">
            This path is for you if:
          </h2>

          <div className="space-y-4 text-gray-400">
            <p className="flex items-start gap-3">
              <span className="text-gray-500 mt-1">→</span>
              You recognize your attachment pattern but <span className="text-gray-300">knowing hasn't changed it</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-gray-500 mt-1">→</span>
              You keep choosing partners who aren't good for you — <span className="text-gray-300">or pushing away the ones who are</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-gray-500 mt-1">→</span>
              You've done "the work" but still get <span className="text-gray-300">hijacked by old patterns</span> when it matters
            </p>
            <p className="flex items-start gap-3">
              <span className="text-gray-500 mt-1">→</span>
              You want to stop reading about relationships and <span className="text-gray-300">actually transform how you relate</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-gray-500 mt-1">→</span>
              You're ready for 8-12 weeks of real work — <span className="text-gray-300">not a quick fix</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-white mb-6">
            Ready to begin?
          </h2>
          <p className="text-gray-400 mb-8">
            Start with the foundational article. It will change how you understand yourself —
            and everything else builds from there.
          </p>

          <Link
            href="/posts/why-you-love-the-way-you-do"
            className="inline-block px-8 py-4 bg-white text-black font-medium hover:bg-gray-200 transition-colors mb-6"
          >
            Read: Why You Love The Way You Do
          </Link>

          <p className="text-sm text-gray-500">
            Or <Link href="/learn/paths/attachment-to-mastery" className="text-gray-400 hover:text-white underline">view the complete path structure</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
