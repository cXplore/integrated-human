import Navigation from '../components/Navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Integrated Human',
  description: 'Terms and conditions for using Integrated Human.',
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-5xl font-light text-white mb-8">
              Terms of Service
            </h1>
            <p className="text-gray-400 mb-12">
              Last updated: December 2025
            </p>

            <div className="prose prose-invert prose-gray max-w-none space-y-8">
              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Agreement</h2>
                <p className="text-gray-300 leading-relaxed">
                  By using Integrated Human, you agree to these terms. If you don't agree, please don't use the site.
                  We may update these terms occasionally — continued use means you accept the updates.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">What We Provide</h2>
                <p className="text-gray-300 leading-relaxed">
                  Integrated Human offers educational content about psychology, personal development, embodiment,
                  and relationships. This includes articles, courses, guided practices, and AI-powered tools.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  <strong className="text-white">This is not therapy.</strong> Our content is educational and for
                  personal growth purposes only. It's not a substitute for professional mental health treatment.
                  If you're in crisis, please seek help from a qualified professional.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Your Account</h2>
                <ul className="text-gray-300 space-y-2">
                  <li>You're responsible for keeping your account secure.</li>
                  <li>You must provide accurate information when signing up.</li>
                  <li>You may not share your account with others.</li>
                  <li>You may not use the platform for illegal purposes.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Subscriptions & Payments</h2>
                <ul className="text-gray-300 space-y-2">
                  <li>Subscriptions renew automatically unless cancelled.</li>
                  <li>You can cancel anytime through your profile settings.</li>
                  <li>Refunds are handled on a case-by-case basis — contact us if you have concerns.</li>
                  <li>Prices may change; we'll notify you before your next billing cycle.</li>
                  <li>Courses purchased individually are yours forever, regardless of subscription status.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Content & Intellectual Property</h2>
                <p className="text-gray-300 leading-relaxed">
                  All content on Integrated Human — articles, courses, images, and code — is our intellectual property
                  or used with permission. You may not copy, redistribute, or sell our content without written permission.
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Your personal data (journal entries, assessments, etc.) belongs to you. We just store it for you.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">AI Features</h2>
                <p className="text-gray-300 leading-relaxed">
                  Our AI companion and other AI-powered features use language models to provide personalized guidance.
                  These are tools for reflection, not professional advice. AI responses may not always be accurate —
                  use your judgment.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Limitation of Liability</h2>
                <p className="text-gray-300 leading-relaxed">
                  We provide this platform "as is." We're not liable for any damages arising from your use of the site,
                  including but not limited to personal growth outcomes, emotional experiences, or decisions made based
                  on our content.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Contact</h2>
                <p className="text-gray-300 leading-relaxed">
                  Questions about these terms? Reach out through our{' '}
                  <a href="/connect" className="text-white underline hover:text-gray-300">contact page</a>.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
