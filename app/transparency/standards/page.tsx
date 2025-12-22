import Navigation from '../../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quality Standards | Integrated Human',
  description: 'How our courses are developed, what makes them valuable, and our commitment to evidence-informed content.',
  openGraph: {
    title: 'Quality Standards | Integrated Human',
    description: 'Our approach to quality in personal development content.',
  },
};

const qualityPillars = [
  {
    title: 'Evidence-Informed',
    description: 'We draw from psychology, neuroscience, contemplative traditions, and therapeutic modalities. We cite sources and acknowledge when we\'re sharing theoretical frameworks vs. empirically validated approaches.',
    details: [
      'Referenced sources where applicable',
      'Clear distinction between research-backed and experiential knowledge',
      'Acknowledgment of limitations and contraindications',
      'Regular review as new research emerges',
    ],
  },
  {
    title: 'Practically Applicable',
    description: 'Theory without practice is just entertainment. Every course includes exercises, reflections, and concrete tools you can apply immediately.',
    details: [
      'Journaling prompts and reflection exercises',
      'Step-by-step practices',
      'Real-world application guidance',
      'Integration checkpoints',
    ],
  },
  {
    title: 'Developmentally Appropriate',
    description: 'Content is tagged with which Development Spectrum stage it serves. We don\'t push advanced concepts on people who need foundational support.',
    details: [
      'Clear prerequisites when relevant',
      'Spectrum tagging on all content',
      'Personalized recommendations',
      'No toxic positivity or premature optimization',
    ],
  },
  {
    title: 'Honest About Limitations',
    description: 'We\'re not therapists. We\'re not crisis counselors. We\'re clear about what this platform is for—and what requires professional support.',
    details: [
      'Clear scope boundaries',
      'Referrals to professional resources when appropriate',
      'No promises of transformation or cure',
      'Acknowledgment that experiences vary',
    ],
  },
];

const contentTypes = [
  {
    type: 'Courses',
    description: 'Structured learning experiences with multiple modules, exercises, and assessments.',
    standards: [
      'Clear learning objectives per module',
      'Progressive skill building',
      'Mix of theory and practice',
      'Completion or certification upon finishing',
    ],
  },
  {
    type: 'Articles',
    description: 'In-depth explorations of single topics, readable in one sitting.',
    standards: [
      'Well-researched and referenced',
      'Practical takeaways',
      'Readable in 10-20 minutes',
      'Links to related courses and content',
    ],
  },
  {
    type: 'Assessments',
    description: 'Self-discovery tools that help you understand yourself better.',
    standards: [
      'Based on established frameworks',
      'Clear explanations of methodology',
      'Actionable insights, not just labels',
      'Privacy-first design',
    ],
  },
];

export default function StandardsPage() {
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
              Quality Standards
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              How we develop content, what makes it valuable, and our commitment
              to evidence-informed personal development.
            </p>

            {/* Core Commitment */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-lg text-gray-300 italic">
                "The personal development industry is full of unsubstantiated claims
                and magic-bullet promises. We take a different approach: grounded,
                practical, honest about what we know and don't know."
              </p>
            </div>

            {/* Quality Pillars */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-8">Our Quality Pillars</h2>
              <div className="space-y-8">
                {qualityPillars.map((pillar) => (
                  <div key={pillar.title} className="border border-zinc-800 p-6">
                    <h3 className="font-serif text-xl text-white mb-3">{pillar.title}</h3>
                    <p className="text-gray-400 mb-4">{pillar.description}</p>
                    <ul className="space-y-2">
                      {pillar.details.map((detail) => (
                        <li key={detail} className="text-gray-500 text-sm flex items-start gap-2">
                          <span className="text-gray-600">◇</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-8">Content Standards by Type</h2>
              <div className="space-y-6">
                {contentTypes.map((content) => (
                  <div key={content.type} className="p-6 bg-zinc-900 border border-zinc-800">
                    <h3 className="text-white font-medium mb-2">{content.type}</h3>
                    <p className="text-gray-400 text-sm mb-4">{content.description}</p>
                    <div className="grid md:grid-cols-2 gap-2">
                      {content.standards.map((standard) => (
                        <div key={standard} className="text-gray-500 text-sm flex items-start gap-2">
                          <span className="text-gray-600">✓</span>
                          {standard}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What We're Not */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">What We're Not</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Not Therapy</h3>
                  <p className="text-gray-400 text-sm">
                    Our content is educational and reflective, not therapeutic. We don't
                    diagnose, treat, or provide clinical interventions. If you need
                    professional mental health support, please seek a qualified therapist.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Not Crisis Support</h3>
                  <p className="text-gray-400 text-sm">
                    We're not equipped to handle mental health emergencies. If you're in
                    crisis, please contact appropriate crisis services in your area.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Not Quick Fixes</h3>
                  <p className="text-gray-400 text-sm">
                    Personal development takes time. We don't promise overnight
                    transformation, and we're skeptical of anyone who does.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Not One-Size-Fits-All</h3>
                  <p className="text-gray-400 text-sm">
                    What works for one person may not work for another. We share frameworks
                    and tools, but you're the expert on your own experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Sources and Influences */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Our Sources and Influences</h2>
              <p className="text-gray-400 mb-6">
                Our content draws from multiple traditions and disciplines:
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">Psychology</h4>
                  <p className="text-gray-500">
                    Attachment theory, developmental psychology, trauma research, positive psychology
                  </p>
                </div>
                <div className="p-4 border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">Neuroscience</h4>
                  <p className="text-gray-500">
                    Nervous system regulation, neuroplasticity, polyvagal theory, embodiment research
                  </p>
                </div>
                <div className="p-4 border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">Contemplative Traditions</h4>
                  <p className="text-gray-500">
                    Mindfulness practices, meditation research, wisdom traditions
                  </p>
                </div>
                <div className="p-4 border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">Therapeutic Modalities</h4>
                  <p className="text-gray-500">
                    Somatic approaches, parts work, narrative therapy, acceptance-based approaches
                  </p>
                </div>
                <div className="p-4 border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">Philosophy</h4>
                  <p className="text-gray-500">
                    Existentialism, phenomenology, ethics, meaning-making frameworks
                  </p>
                </div>
                <div className="p-4 border border-zinc-800">
                  <h4 className="text-white font-medium mb-2">Lived Experience</h4>
                  <p className="text-gray-500">
                    Real practice, honest reflection, learning from mistakes
                  </p>
                </div>
              </div>
            </div>

            {/* Continuous Improvement */}
            <div className="mb-16 p-8 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">Continuous Improvement</h2>
              <p className="text-gray-400">
                Quality isn't a destination—it's a practice. We regularly review and update
                our content based on new research, user feedback, and our own learning.
                If you find something that seems off, outdated, or could be improved,
                we genuinely want to hear from you.
              </p>
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
                  Our Methodology →
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
