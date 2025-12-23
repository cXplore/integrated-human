import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navigation from '../components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | Integrated Human',
  description: 'Welcome to your integration journey. Let us personalize your experience.',
};

export default async function WelcomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has already completed onboarding
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompleted: true },
  });

  // If already onboarded, go to profile
  if (userProfile?.onboardingCompleted) {
    redirect('/profile');
  }

  const firstName = session.user.name?.split(' ')[0] || 'there';

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* Welcome message */}
          <div className="mb-12">
            <p className="text-amber-500 text-sm uppercase tracking-wide mb-4">
              Welcome to Integrated Human
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
              Hello, {firstName}
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
              You&apos;ve taken the first step on a meaningful journey.
              Let&apos;s take a few minutes to understand where you are,
              so we can guide you to what matters most.
            </p>
          </div>

          {/* What to expect */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 mb-8 text-left">
            <h2 className="text-white font-medium mb-6 text-center">
              What to expect
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-500 font-medium">1</span>
                </div>
                <h3 className="text-gray-300 text-sm font-medium mb-1">A Few Questions</h3>
                <p className="text-gray-500 text-xs">
                  About where you are in life and what you&apos;re seeking
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-500 font-medium">2</span>
                </div>
                <h3 className="text-gray-300 text-sm font-medium mb-1">Personalized Path</h3>
                <p className="text-gray-500 text-xs">
                  We&apos;ll recommend content that meets you where you are
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-500 font-medium">3</span>
                </div>
                <h3 className="text-gray-300 text-sm font-medium mb-1">Your Dashboard</h3>
                <p className="text-gray-500 text-xs">
                  Track your progress and continue your journey
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-medium hover:bg-gray-100 transition-colors"
            >
              Begin Your Journey
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="text-gray-600 text-sm">
              Takes about 3 minutes
            </p>
          </div>

          {/* Skip option */}
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <Link
              href="/profile"
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Skip for now and explore on my own →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
