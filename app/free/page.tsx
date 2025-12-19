import Navigation from '../components/Navigation';
import Link from 'next/link';
import { getAllLeadMagnets } from '@/lib/lead-magnets';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Resources | Integrated Human',
  description: 'Free guides, checklists, and tools for your integration journey. Download shadow work prompts, nervous system reset guides, and more.',
};

export default function FreeResourcesPage() {
  const leadMagnets = getAllLeadMagnets();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs uppercase tracking-wide text-gray-500 mb-4 block">
              Free Resources
            </span>
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Tools for Your Journey
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Practical guides and exercises to support your integration work.
              Enter your email to access—we'll also send you our best content.
            </p>
          </div>
        </section>

        {/* Lead Magnets Grid */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {leadMagnets.map((lm) => (
                <Link
                  key={lm.slug}
                  href={`/free/${lm.slug}`}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {lm.category}
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-green-500 font-medium">
                      Free Download
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl text-white mb-3 group-hover:text-gray-300 transition-colors">
                    {lm.title}
                  </h2>

                  <p className="text-gray-500 mb-6 leading-relaxed">
                    {lm.description}
                  </p>

                  <div className="flex items-center text-white group-hover:text-gray-300 transition-colors">
                    <span className="text-sm font-medium">Get Free Access</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-6 bg-zinc-900/50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl text-white mb-4">
              Looking for deeper work?
            </h2>
            <p className="text-gray-400 mb-8">
              Our courses offer structured paths for real transformation—not just information, but embodied change.
            </p>
            <Link
              href="/courses"
              className="inline-block px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
            >
              Explore Courses
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
