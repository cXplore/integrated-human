import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navigation from '../components/Navigation';
import OnboardingFlow from './OnboardingFlow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Begin Your Journey | Integrated Human',
  description: 'Help us understand where you are so we can guide you better.',
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/onboarding');
  }

  // Check if user already completed onboarding
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  // Parse existing profile data if any
  const existingProfile = profile ? {
    ...profile,
    experienceLevels: profile.experienceLevels ? JSON.parse(profile.experienceLevels) : null,
    currentChallenges: profile.currentChallenges ? JSON.parse(profile.currentChallenges) : null,
    interests: profile.interests ? JSON.parse(profile.interests) : null,
    sensitivities: profile.sensitivities ? JSON.parse(profile.sensitivities) : null,
  } : null;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-2xl mx-auto">
            <OnboardingFlow
              existingProfile={existingProfile}
              userName={session.user.name || undefined}
            />
          </div>
        </div>
      </main>
    </>
  );
}
