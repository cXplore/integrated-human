import Navigation from '../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparency | Integrated Human',
  description: 'How we approach personal development, our methodology, quality standards, and what our credentials mean.',
  openGraph: {
    title: 'Transparency | Integrated Human',
    description: 'Our methodology, standards, and commitment to quality.',
  },
};

const sections = [
  {
    title: 'Our Methodology',
    href: '/transparency/methodology',
    description: 'The Development Spectrum framework—understanding where you are and meeting you there. From collapse to optimization.',
    icon: '◈',
  },
  {
    title: 'Sources & Influences',
    href: '/transparency/sources',
    description: 'The traditions, researchers, and thinkers that inform our approach. Psychology, neuroscience, contemplative practices, and more.',
    icon: '○',
  },
  {
    title: 'Quality Standards',
    href: '/transparency/standards',
    description: 'How our courses are developed, what makes them valuable, and our commitment to evidence-informed content.',
    icon: '◇',
  },
  {
    title: 'Certificates & Credentials',
    href: '/transparency/certificates',
    description: 'What our certificates mean, the difference between completion records and full certificates, and verification.',
    icon: '◆',
  },
  {
    title: 'Course Audits',
    href: '/transparency/audits',
    description: 'Detailed audit documents for each course: curriculum, methodology, sources, and what the credential represents.',
    icon: '◊',
  },
];

export default function TransparencyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Transparency
            </h1>

            <p className="text-xl text-gray-400 mb-16 max-w-2xl">
              We believe you deserve to understand exactly how we approach your development,
              what our credentials mean, and why our content is structured the way it is.
            </p>

            {/* Core Commitment */}
            <div className="border-l-2 border-zinc-700 pl-6 mb-16">
              <p className="text-lg text-gray-300 italic">
                "Most platforms just sell you content. We want you to understand the thinking
                behind every course, every recommendation, every certificate. If we can't
                explain why something matters, we shouldn't be offering it."
              </p>
            </div>

            {/* Sections Grid */}
            <div className="grid gap-6 mb-16">
              {sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="block p-8 border border-zinc-800 hover:border-zinc-600 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl text-gray-500 group-hover:text-white transition-colors">
                      {section.icon}
                    </span>
                    <div>
                      <h2 className="font-serif text-2xl text-white mb-2 group-hover:text-gray-100">
                        {section.title}
                      </h2>
                      <p className="text-gray-400">
                        {section.description}
                      </p>
                      <span className="inline-block mt-4 text-gray-500 group-hover:text-gray-300 transition-colors">
                        Learn more →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* What This Means in Practice */}
            <div className="space-y-8">
              <h2 className="font-serif text-2xl text-white">What This Means in Practice</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-white font-medium">We Don't Push Optimization on People in Crisis</h3>
                  <p className="text-gray-400 text-sm">
                    Our Development Spectrum framework ensures recommendations match where you
                    actually are—not where you think you should be.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Tiered Credentials</h3>
                  <p className="text-gray-400 text-sm">
                    We differentiate between completion records and full certificates,
                    reflecting the depth and assessment requirements of each course.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Evidence-Informed Content</h3>
                  <p className="text-gray-400 text-sm">
                    We draw from psychology, neuroscience, contemplative traditions, and
                    lived experience. We cite sources and acknowledge limitations.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-white font-medium">Honest About Limitations</h3>
                  <p className="text-gray-400 text-sm">
                    Personal development is not a solved problem. We share what we've found
                    useful while acknowledging that your experience may differ.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-zinc-800 pt-12 mt-16">
              <p className="text-gray-500 mb-4">
                Questions about our approach?
              </p>
              <Link
                href="/connect"
                className="inline-block px-6 py-3 border border-zinc-700 text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
