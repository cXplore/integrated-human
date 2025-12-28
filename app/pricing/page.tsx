import Navigation from '../components/Navigation';
import Link from 'next/link';
import { SUBSCRIPTION_TIERS, FREE_TIER, tokensToCredits } from '@/lib/subscriptions';
import TierCard from './TierCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Integrated Human',
  description: 'Start free with 50 articles and intro courses. Become a member for $19/month or go Pro for $49/month with more AI credits.',
};

export default function PricingPage() {
  const memberTier = SUBSCRIPTION_TIERS.member;
  const proTier = SUBSCRIPTION_TIERS.pro;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Simple Pricing
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Start free. Unlock everything with Member or Pro.
            </p>
          </div>
        </section>

        {/* Three Options */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-zinc-900 border border-zinc-800 p-8">
              <h2 className="font-serif text-2xl text-white mb-2">Free</h2>
              <p className="text-gray-500 mb-6">Explore and get started</p>

              <div className="text-4xl font-light text-white mb-6">$0</div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="text-green-500">✓</span>
                  {FREE_TIER.articleLimit} articles
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="text-green-500">✓</span>
                  {FREE_TIER.courseLimit} intro courses
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="text-green-500">✓</span>
                  Free resources & PDFs
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <span>—</span>
                  No AI features
                </li>
              </ul>

              <Link
                href="/library"
                className="block w-full text-center px-6 py-3 border border-zinc-600 text-gray-300 hover:text-white hover:border-zinc-400 transition-colors"
              >
                Start Exploring
              </Link>
            </div>

            {/* Member */}
            <div className="bg-zinc-900 border-2 border-white p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-zinc-900 text-xs uppercase tracking-wide font-medium">
                Most Popular
              </div>

              <h2 className="font-serif text-2xl text-white mb-2">Member</h2>
              <p className="text-gray-500 mb-6">Everything unlocked</p>

              <div className="mb-6">
                <span className="text-4xl font-light text-white">${memberTier.monthlyPrice}</span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {memberTier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <TierCard tier={memberTier} compact />
            </div>

            {/* Pro */}
            <div className="bg-zinc-900 border border-zinc-700 p-8 relative">
              <h2 className="font-serif text-2xl text-white mb-2">Pro</h2>
              <p className="text-gray-500 mb-6">{proTier.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-light text-white">${proTier.monthlyPrice}</span>
                <span className="text-gray-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {proTier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <TierCard tier={proTier} compact />
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-16 px-6 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-white mb-12 text-center">
              What's Included
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 text-gray-400 font-normal"></th>
                    <th className="text-center py-4 text-gray-400 font-normal">Free</th>
                    <th className="text-center py-4 text-white font-medium">Member</th>
                    <th className="text-center py-4 text-white font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">Articles</td>
                    <td className="py-4 text-center text-gray-400">{FREE_TIER.articleLimit}</td>
                    <td className="py-4 text-center text-green-500">All</td>
                    <td className="py-4 text-center text-green-500">All</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">Intro Courses</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">All Courses (incl. Flagship)</td>
                    <td className="py-4 text-center text-gray-600">—</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">Certificates</td>
                    <td className="py-4 text-center text-gray-600">—</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">Learning Paths</td>
                    <td className="py-4 text-center text-gray-600">—</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                    <td className="py-4 text-center text-green-500">✓</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">PDFs & Resources</td>
                    <td className="py-4 text-center text-gray-400">Some</td>
                    <td className="py-4 text-center text-green-500">All</td>
                    <td className="py-4 text-center text-green-500">All</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 text-gray-300">AI Credits/month</td>
                    <td className="py-4 text-center text-gray-600">—</td>
                    <td className="py-4 text-center text-gray-300">{tokensToCredits(memberTier.monthlyTokens).toLocaleString()}</td>
                    <td className="py-4 text-center text-gray-300">{tokensToCredits(proTier.monthlyTokens).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* AI Credits Note */}
        <section className="py-12 px-6 border-t border-zinc-800">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-400 leading-relaxed">
              Need more AI credits? Upgrade to Pro for 2.5x the credits,
              or top up anytime—purchased credits never expire.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-white mb-8 text-center">
              Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-400 text-sm">
                  Yes. Cancel anytime and keep access until the end of your billing period.
                  No contracts, no fees, no games.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">What about Flagship courses?</h3>
                <p className="text-gray-400 text-sm">
                  All included. Flagship courses are our most comprehensive programs with
                  challenging assessments and certificates. Members get full access.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">What if I run out of AI credits?</h3>
                <p className="text-gray-400 text-sm">
                  You can still access all content—courses, articles, resources. You just won't
                  be able to use AI features until you add credits or your monthly credits refresh.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">Do unused credits roll over?</h3>
                <p className="text-gray-400 text-sm">
                  Monthly included credits reset each billing cycle. Purchased credits never expire.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className="py-12 px-6 border-t border-zinc-800 bg-zinc-900/20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-500 text-sm">
              Want to know how we create our courses?{' '}
              <Link
                href="/transparency"
                className="text-gray-400 hover:text-white transition-colors underline underline-offset-2"
              >
                See our methodology and standards
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
