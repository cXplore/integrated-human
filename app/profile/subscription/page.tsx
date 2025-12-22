import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import Link from 'next/link';
import SubscriptionManager from './SubscriptionManager';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Subscription | Integrated Human',
  description: 'View and manage your subscription, billing, and membership details.',
};

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/profile/subscription');
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
          {/* Back link */}
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </Link>

          <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
            Subscription
          </h1>
          <p className="text-gray-400 mb-8">
            Manage your membership and billing details
          </p>

          <SubscriptionManager />
        </div>
      </main>
    </>
  );
}
