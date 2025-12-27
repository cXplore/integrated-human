import Navigation from '../../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Tracking Transparency | Integrated Human',
  description: 'How we track your integration health—verified scores, estimated scores, and why your data belongs to you.',
  openGraph: {
    title: 'Health Tracking Transparency | Integrated Human',
    description: 'Understanding our two-layer health tracking system.',
  },
};

export default function HealthTrackingPage() {
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
              Health Tracking
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              How we measure your development—and why we built a system that respects
              how real growth works.
            </p>

            {/* Core Philosophy */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-lg text-gray-300 italic">
                "Personal development isn't linear. You might grow through therapy,
                life experience, or a single conversation—not just our courses.
                Your health tracking should reflect that reality."
              </p>
            </div>

            {/* The Two-Layer System */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">The Two-Layer System</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  We track your integration health across 30 dimensions within the four
                  pillars (Mind, Body, Soul, Relationships). But we recognize that
                  measuring human development is complex—so we use two complementary approaches:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 bg-green-500/5 border border-green-500/30 rounded-lg">
                  <h3 className="text-green-400 font-medium mb-3">Verified Scores</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    From assessments you complete. These are the most accurate snapshot
                    of where you are—but they're only as current as your last assessment.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Updated only through assessment/reassessment</li>
                    <li>• Decay over time (we note when scores are aging)</li>
                    <li>• You control when to reassess—no gates</li>
                  </ul>
                </div>

                <div className="p-6 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                  <h3 className="text-amber-400 font-medium mb-3">Estimated Scores</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Based on your activity—courses completed, articles read, practices done.
                    These suggest where you might be, with a confidence indicator.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2">
                    <li>• Updated automatically as you engage</li>
                    <li>• Shows growth direction, not certainty</li>
                    <li>• Prompts reassessment when significantly different</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Score Freshness */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Score Freshness</h2>
              <p className="text-gray-400 mb-6">
                We don't pretend a score from 6 months ago is still accurate. Verified
                scores have freshness indicators:
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded">Fresh</span>
                  <div>
                    <span className="text-white">Less than 30 days</span>
                    <span className="text-gray-500 ml-2">— Full confidence</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded">Aging</span>
                  <div>
                    <span className="text-white">30-90 days</span>
                    <span className="text-gray-500 ml-2">— Still relevant, consider checking in</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded">Stale</span>
                  <div>
                    <span className="text-white">90-180 days</span>
                    <span className="text-gray-500 ml-2">— Reassessment recommended</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <span className="px-3 py-1 bg-red-500/30 text-red-400 text-sm rounded">Expired</span>
                  <div>
                    <span className="text-white">Over 180 days</span>
                    <span className="text-gray-500 ml-2">— No longer shown as verified</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-sm mt-6">
                Inactive users don't have stale scores haunt them. Old assessments fade
                away—you can start fresh whenever you return.
              </p>
            </div>

            {/* What Contributes to Estimates */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">What Contributes to Estimates</h2>
              <p className="text-gray-400 mb-6">
                When you engage with content, we track which dimensions it addresses
                and add points to your estimated score:
              </p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-2xl text-white mb-2">8</div>
                  <div className="text-sm text-gray-500">Course Module</div>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-2xl text-white mb-2">3</div>
                  <div className="text-sm text-gray-500">Article Read</div>
                </div>
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-2xl text-white mb-2">2</div>
                  <div className="text-sm text-gray-500">Practice Done</div>
                </div>
              </div>

              <p className="text-gray-500 text-sm mt-6">
                Points have diminishing returns—you can't just spam articles to inflate
                your score. After 40 points, additional activity has less impact.
                This prevents gaming while still rewarding genuine engagement.
              </p>
            </div>

            {/* Reassessment Philosophy */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Reassessment: When You're Ready</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  We don't gate reassessment behind content completion. Why? Because
                  real growth happens everywhere—through therapy, relationships, life
                  experience, crisis, and insight.
                </p>
                <p>
                  If you feel different than your last assessment, reassess. It's that simple.
                </p>
                <p>
                  We'll suggest reassessment when:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your verified score is stale (90+ days old)</li>
                  <li>Your estimated score is significantly higher than verified (15+ points)</li>
                  <li>You've been very active in a dimension area</li>
                </ul>
                <p className="mt-4">
                  But these are suggestions—you're always in control.
                </p>
              </div>
            </div>

            {/* 30 Dimensions */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">The 30 Dimensions</h2>
              <p className="text-gray-400 mb-6">
                We moved from a simplified 12-dimension model to a research-grounded
                30-dimension framework across the four pillars. Each dimension has
                facets for nuanced measurement.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-white font-medium mb-3">Mind (8 dimensions)</h3>
                  <ul className="text-gray-500 text-sm space-y-1">
                    <li>Emotional Regulation</li>
                    <li>Cognitive Flexibility</li>
                    <li>Self-Awareness</li>
                    <li>Present Moment Awareness</li>
                    <li>Thought Patterns</li>
                    <li>Psychological Safety</li>
                    <li>Self-Relationship</li>
                    <li>Meaning & Purpose</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Body (7 dimensions)</h3>
                  <ul className="text-gray-500 text-sm space-y-1">
                    <li>Interoception</li>
                    <li>Stress Physiology</li>
                    <li>Sleep & Restoration</li>
                    <li>Energy & Vitality</li>
                    <li>Movement Capacity</li>
                    <li>Nourishment</li>
                    <li>Embodied Presence</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Soul (8 dimensions)</h3>
                  <ul className="text-gray-500 text-sm space-y-1">
                    <li>Authenticity</li>
                    <li>Existential Grounding</li>
                    <li>Transcendence</li>
                    <li>Shadow Integration</li>
                    <li>Creative Expression</li>
                    <li>Life Engagement</li>
                    <li>Inner Wisdom</li>
                    <li>Spiritual Practice</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Relationships (9 dimensions)</h3>
                  <ul className="text-gray-500 text-sm space-y-1">
                    <li>Attachment Patterns</li>
                    <li>Communication</li>
                    <li>Boundaries</li>
                    <li>Conflict & Repair</li>
                    <li>Trust & Vulnerability</li>
                    <li>Empathy & Attunement</li>
                    <li>Intimacy Depth</li>
                    <li>Social Connection</li>
                    <li>Relational Patterns</li>
                  </ul>
                </div>
              </div>

              <p className="text-gray-500 text-sm mt-6 italic">
                Research foundations: ACT, DBT, Polyvagal Theory, Attachment Theory,
                IFS, Somatic Psychology, Existential Psychology, Contemplative traditions.
              </p>
            </div>

            {/* Your Data */}
            <div className="mb-16 p-8 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">Your Data, Your Control</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  All health data is tied to your account and never shared. You can:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>View all scores and their sources in your health dashboard</li>
                  <li>See exactly what activities contributed to estimates</li>
                  <li>Reassess any dimension at any time</li>
                  <li>Export or delete your data</li>
                </ul>
                <p className="mt-4">
                  We're not building a profile to sell. We're building a mirror to
                  help you see yourself more clearly.
                </p>
              </div>
            </div>

            {/* Limitations */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Honest Limitations</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  No self-assessment system is perfect. Here's what ours cannot do:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Replace professional psychological assessment</li>
                  <li>Capture changes that happen outside our platform</li>
                  <li>Account for how you feel on any given day</li>
                  <li>Measure dimensions you don't engage with</li>
                </ul>
                <p className="mt-4">
                  Our scores are a tool for self-reflection, not a clinical diagnosis.
                  They're most useful as a way to track patterns over time and identify
                  areas you might want to focus on.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-zinc-800 pt-12">
              <p className="text-gray-500 mb-4">
                Learn more about our approach
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/transparency/methodology"
                  className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Development Spectrum &rarr;
                </Link>
                <Link
                  href="/assessment"
                  className="inline-block px-6 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
                >
                  Take Assessment &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
