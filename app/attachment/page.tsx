import Navigation from '../components/Navigation';
import AttachmentStyleQuiz from '../components/AttachmentStyleQuiz';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Attachment Style Exploration | Integrated Human',
  description: 'Explore your attachment style and understand how you relate to closeness and independence in relationships.',
  openGraph: {
    title: 'Attachment Style Exploration | Integrated Human',
    description: 'Understand how you attach in relationships.',
  },
};

export default function AttachmentPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              href="/relationships"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Relationships
            </Link>

            <AttachmentStyleQuiz />

            {/* Context Section */}
            <div className="mt-16 pt-8 border-t border-zinc-800">
              <h2 className="font-serif text-2xl text-white mb-6">About Attachment Style</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Attachment theory originated with John Bowlby and Mary Ainsworth's research
                  on infant-caregiver bonds. Later researchers, particularly Kim Bartholomew
                  and Cindy Hazan, extended the framework to adult romantic relationships.
                </p>
                <p>
                  The four adult attachment styles emerge from combinations of two dimensions:
                </p>
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <span className="text-amber-400 font-medium">Anxiety</span>
                    <span>— Fear of abandonment, need for reassurance, hypervigilance to partner's cues</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 font-medium">Avoidance</span>
                    <span>— Discomfort with dependence, need for space, emotional distancing</span>
                  </li>
                </ul>
                <p>
                  Low on both = Secure. High anxiety = Anxious-Preoccupied. High avoidance = Dismissive-Avoidant.
                  High on both = Fearful-Avoidant (disorganized).
                </p>
                <p>
                  While attachment patterns are shaped by early experience, they're not fixed.
                  "Earned security" is possible through consistent, responsive relationships
                  and intentional inner work.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
