import Navigation from '../components/Navigation';
import { SUBSCRIPTION_TIERS, CREDIT_PACKAGES } from '@/lib/subscriptions';
import PricingCard from './PricingCard';
import CreditPackages from './CreditPackages';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Integrated Human',
  description: 'Choose your path. Access courses, articles, and AI companion at the level that fits your journey.',
};

export default function PricingPage() {
  const tiers = Object.values(SUBSCRIPTION_TIERS);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Choose Your Path
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Access the depth of content that matches where you are in your journey.
              All plans include unlimited articles and AI companion credits.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map((tier, index) => (
                <PricingCard
                  key={tier.id}
                  tier={tier}
                  featured={index === 1} // Practitioner is featured
                />
              ))}
            </div>
          </div>
        </section>

        {/* AI Credits Section */}
        <section className="py-16 px-6 border-t border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl text-white mb-4">
                Need More AI Credits?
              </h2>
              <p className="text-gray-400">
                Your subscription includes monthly credits. Purchase additional credits anytime.
                Purchased credits never expire.
              </p>
            </div>

            <CreditPackages packages={CREDIT_PACKAGES} />
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 px-6 border-t border-zinc-800 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl text-white mb-8 text-center">
              Compare Plans
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 px-4 text-gray-400 font-normal">Feature</th>
                    {tiers.map((tier) => (
                      <th key={tier.id} className="text-center py-4 px-4 text-white font-medium">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">All Articles</td>
                    {tiers.map((tier) => (
                      <td key={tier.id} className="text-center py-4 px-4">
                        <CheckIcon />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Intro Courses</td>
                    {tiers.map((tier) => (
                      <td key={tier.id} className="text-center py-4 px-4">
                        <CheckIcon />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Beginner Courses</td>
                    {tiers.map((tier) => (
                      <td key={tier.id} className="text-center py-4 px-4">
                        <CheckIcon />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Intermediate Courses</td>
                    <td className="text-center py-4 px-4 text-amber-500">30% off</td>
                    <td className="text-center py-4 px-4"><CheckIcon /></td>
                    <td className="text-center py-4 px-4"><CheckIcon /></td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Advanced Courses</td>
                    <td className="text-center py-4 px-4 text-amber-500">40% off</td>
                    <td className="text-center py-4 px-4 text-amber-500">50% off</td>
                    <td className="text-center py-4 px-4"><CheckIcon /></td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Flagship Courses</td>
                    <td className="text-center py-4 px-4 text-amber-500">30% off</td>
                    <td className="text-center py-4 px-4 text-amber-500">50% off</td>
                    <td className="text-center py-4 px-4"><CheckIcon /></td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Bundle Discount</td>
                    <td className="text-center py-4 px-4 text-amber-500">30% off</td>
                    <td className="text-center py-4 px-4 text-amber-500">50% off</td>
                    <td className="text-center py-4 px-4"><CheckIcon /></td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">Monthly AI Credits</td>
                    <td className="text-center py-4 px-4 text-white">50</td>
                    <td className="text-center py-4 px-4 text-white">100</td>
                    <td className="text-center py-4 px-4 text-white">500</td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-gray-400">PDFs & Resources</td>
                    <td className="text-center py-4 px-4 text-gray-500">Beginner</td>
                    <td className="text-center py-4 px-4 text-gray-500">+ Intermediate</td>
                    <td className="text-center py-4 px-4"><CheckIcon /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl text-white mb-8 text-center">
              Questions?
            </h2>

            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-400 text-sm">
                  Yes. Cancel anytime and you'll keep access until the end of your billing period.
                  No long-term contracts, no hidden fees.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">What happens to courses I bought before subscribing?</h3>
                <p className="text-gray-400 text-sm">
                  They're yours forever. Direct purchases give you lifetime access regardless of subscription status.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">Do unused AI credits roll over?</h3>
                <p className="text-gray-400 text-sm">
                  Monthly included credits reset each billing cycle. However, any credits you purchase
                  separately never expire and roll over indefinitely.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h3 className="text-white font-medium mb-2">Can I upgrade or downgrade my plan?</h3>
                <p className="text-gray-400 text-sm">
                  Yes. Upgrade anytime and pay the prorated difference. Downgrade takes effect at
                  your next billing cycle.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
