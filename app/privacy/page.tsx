import Navigation from '../components/Navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Integrated Human',
  description: 'How we handle your data and protect your privacy.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-5xl font-light text-white mb-8">
              Privacy Policy
            </h1>
            <p className="text-gray-400 mb-12">
              Last updated: December 2025
            </p>

            <div className="prose prose-invert prose-gray max-w-none space-y-8">
              <section>
                <h2 className="font-serif text-2xl text-white mb-4">The Short Version</h2>
                <p className="text-gray-300 leading-relaxed">
                  We collect only what we need to provide you with a good experience. We don't sell your data.
                  We don't share it with advertisers. We use it to improve the site and personalize your journey.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">What We Collect</h2>
                <ul className="text-gray-300 space-y-2">
                  <li><strong className="text-white">Account information:</strong> Email, name, and profile picture if you sign in with Google.</li>
                  <li><strong className="text-white">Usage data:</strong> Which articles you read, courses you take, and how far you progress.</li>
                  <li><strong className="text-white">Journal entries:</strong> Your private reflections, stored encrypted and accessible only to you.</li>
                  <li><strong className="text-white">Assessment results:</strong> Your archetype quiz results and other self-discovery data.</li>
                  <li><strong className="text-white">AI interactions:</strong> Conversations with our AI companion to provide personalized guidance.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">How We Use It</h2>
                <ul className="text-gray-300 space-y-2">
                  <li>To personalize content recommendations based on your interests and progress.</li>
                  <li>To save your reading position so you can continue where you left off.</li>
                  <li>To provide AI-powered features like dream interpretation and stuck guidance.</li>
                  <li>To send you newsletter updates (only if you opt in).</li>
                  <li>To improve the platform based on aggregate usage patterns.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">What We Don't Do</h2>
                <ul className="text-gray-300 space-y-2">
                  <li>Sell your personal data to third parties.</li>
                  <li>Share your data with advertisers.</li>
                  <li>Use your journal entries for training AI models.</li>
                  <li>Track you across other websites.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Third-Party Services</h2>
                <p className="text-gray-300 leading-relaxed">
                  We use the following services that may process your data:
                </p>
                <ul className="text-gray-300 space-y-2 mt-4">
                  <li><strong className="text-white">Google OAuth:</strong> For authentication.</li>
                  <li><strong className="text-white">Stripe:</strong> For payment processing (we don't store your card details).</li>
                  <li><strong className="text-white">Vercel:</strong> For hosting and analytics.</li>
                  <li><strong className="text-white">Supabase:</strong> For database storage.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Your Rights</h2>
                <p className="text-gray-300 leading-relaxed">
                  You can request a copy of your data, ask us to delete it, or update your preferences at any time.
                  Contact us at the email below.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-2xl text-white mb-4">Contact</h2>
                <p className="text-gray-300 leading-relaxed">
                  Questions about privacy? Reach out through our{' '}
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
