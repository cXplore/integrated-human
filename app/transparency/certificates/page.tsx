import Navigation from '../../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certificates & Credentials | Integrated Human',
  description: 'What our certificates mean, the difference between completion records and full certificates, and verification.',
  openGraph: {
    title: 'Certificates & Credentials | Integrated Human',
    description: 'Understanding our certificate and credential system.',
  },
};

const credentialTypes = [
  {
    type: 'Completion Record',
    levels: ['Introductory', 'Foundation', 'Intermediate'],
    description: 'A record that you completed a course. Acknowledges your effort and engagement without implying mastery.',
    meaning: 'You completed all modules and exercises in this course.',
    design: 'Clean, modern design in neutral tones',
    includes: [
      'Your name and course title',
      'Date of completion',
      'Course level designation',
      'Unique verification ID',
    ],
  },
  {
    type: 'Certificate of Achievement',
    levels: ['Advanced', 'Mastery'],
    description: 'A full certificate recognizing significant learning, demonstrated through completion plus assessment.',
    meaning: 'You completed the course and demonstrated understanding through assessment (80%+ score required).',
    design: 'Formal design with decorative elements, premium finish',
    includes: [
      'Your name and course title',
      'Date of achievement',
      'Assessment score',
      'Course tier designation',
      'Unique verification ID',
      'Link to course audit document',
    ],
  },
];

const tiers = [
  {
    name: 'Introductory',
    code: 'intro',
    credential: 'Completion Record',
    description: 'Entry-level content introducing key concepts. No prerequisites.',
    duration: '1-2 hours',
  },
  {
    name: 'Foundation',
    code: 'beginner',
    credential: 'Completion Record',
    description: 'Foundational courses building core understanding. Practical exercises included.',
    duration: '2-4 hours',
  },
  {
    name: 'Intermediate',
    code: 'intermediate',
    credential: 'Completion Record',
    description: 'Deeper exploration with more nuanced concepts. Builds on foundation.',
    duration: '4-6 hours',
  },
  {
    name: 'Advanced',
    code: 'advanced',
    credential: 'Certificate',
    description: 'Comprehensive courses with assessment. Requires demonstrated understanding.',
    duration: '6-10 hours',
  },
  {
    name: 'Mastery',
    code: 'flagship',
    credential: 'Certificate',
    description: 'Our most in-depth courses. Significant investment, significant credential.',
    duration: '10+ hours',
  },
];

export default function CertificatesPage() {
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
              Certificates & Credentials
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl">
              What our credentials mean, how they differ by course tier, and how
              verification works.
            </p>

            {/* Our Approach */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-lg text-gray-300 italic">
                "We believe credentials should mean something. A certificate from a
                2-hour introductory course shouldn't carry the same weight as one from
                a 10-hour mastery program with assessment."
              </p>
            </div>

            {/* Two Credential Types */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-8">Two Types of Credentials</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {credentialTypes.map((cred) => (
                  <div
                    key={cred.type}
                    className={`p-6 border ${
                      cred.type === 'Certificate of Achievement'
                        ? 'border-amber-800/50 bg-amber-950/10'
                        : 'border-zinc-700 bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium tracking-wider uppercase ${
                        cred.type === 'Certificate of Achievement' ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {cred.levels.join(' • ')}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl text-white mb-3">{cred.type}</h3>
                    <p className="text-gray-400 text-sm mb-4">{cred.description}</p>

                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">What it means</span>
                        <p className="text-gray-300 text-sm mt-1">{cred.meaning}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Design</span>
                        <p className="text-gray-400 text-sm mt-1">{cred.design}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Includes</span>
                        <ul className="mt-1 space-y-1">
                          {cred.includes.map((item) => (
                            <li key={item} className="text-gray-400 text-sm flex items-start gap-2">
                              <span className="text-gray-600">◇</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Tiers */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Course Tiers Explained</h2>
              <p className="text-gray-400 mb-8">
                Every course is assigned a tier based on depth, duration, and assessment requirements.
                The tier determines what type of credential you receive.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Tier</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Duration</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Credential</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier) => (
                      <tr key={tier.code} className="border-b border-zinc-800/50">
                        <td className="py-4 px-4 text-white font-medium">{tier.name}</td>
                        <td className="py-4 px-4 text-gray-400">{tier.duration}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 ${
                            tier.credential === 'Certificate'
                              ? 'bg-amber-900/30 text-amber-500'
                              : 'bg-zinc-800 text-gray-400'
                          }`}>
                            {tier.credential}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-500">{tier.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">Verification</h2>
              <div className="p-6 bg-zinc-900 border border-zinc-800">
                <p className="text-gray-400 mb-4">
                  Every credential includes a unique verification ID. Anyone can verify
                  your credential is authentic by visiting:
                </p>
                <code className="block bg-zinc-800 p-4 text-gray-300 text-sm mb-4">
                  integratedhuman.co/certificate/[your-verification-id]
                </code>
                <p className="text-gray-500 text-sm">
                  This page displays the credential details: recipient name, course completed,
                  date issued, and credential type. This allows employers, institutions, or
                  anyone else to verify authenticity.
                </p>
              </div>
            </div>

            {/* What Our Credentials Are NOT */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">What Our Credentials Are Not</h2>
              <div className="space-y-4 text-gray-400">
                <p>
                  We believe in transparency about what our credentials represent:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-gray-600">×</span>
                    <span>
                      <strong className="text-white">Not accredited degrees.</strong> We are not
                      an accredited educational institution. Our credentials are self-issued
                      certificates of completion/achievement.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-600">×</span>
                    <span>
                      <strong className="text-white">Not professional licenses.</strong> Completing
                      our courses doesn't license you to practice therapy, coaching, or any
                      regulated profession.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-600">×</span>
                    <span>
                      <strong className="text-white">Not industry certifications.</strong> These
                      are not equivalent to certifications from professional bodies or industry
                      associations.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* What They ARE */}
            <div className="mb-16">
              <h2 className="font-serif text-2xl text-white mb-6">What Our Credentials Are</h2>
              <div className="space-y-4 text-gray-400">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong className="text-white">Verified records of learning.</strong> Evidence
                      that you completed structured personal development content.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong className="text-white">Demonstrations of commitment.</strong> Proof
                      that you invested time and effort in your growth.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong className="text-white">Portfolio pieces.</strong> Credentials you
                      can include in portfolios, resumes, or LinkedIn to demonstrate
                      ongoing learning.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600">✓</span>
                    <span>
                      <strong className="text-white">Personal milestones.</strong> Markers of
                      your personal development journey that you can be proud of.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Audit Documents */}
            <div className="mb-16 p-8 bg-zinc-900 border border-zinc-800">
              <h2 className="font-serif text-xl text-white mb-4">Course Audit Documents</h2>
              <p className="text-gray-400 mb-4">
                For full Certificates (Advanced and Mastery courses), we provide audit
                documents that explain:
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-600">◇</span>
                  The curriculum structure and learning objectives
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600">◇</span>
                  Sources and frameworks the content draws from
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600">◇</span>
                  Assessment methodology and passing criteria
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600">◇</span>
                  What competencies the certificate represents
                </li>
              </ul>
              <p className="text-gray-500 text-sm mt-4">
                These documents are linked from the certificate verification page, allowing
                anyone to understand what the credential represents.
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
