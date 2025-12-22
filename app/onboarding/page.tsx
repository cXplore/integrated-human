import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
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

  // Parse existing profile data if any, converting null to undefined for TypeScript
  const existingProfile = profile ? {
    primaryIntention: profile.primaryIntention ?? undefined,
    lifeSituation: profile.lifeSituation ?? undefined,
    experienceLevels: safeJsonParse(profile.experienceLevels, undefined),
    hasAwakeningExperience: profile.hasAwakeningExperience,
    awakeningDescription: profile.awakeningDescription ?? undefined,
    currentChallenges: safeJsonParse(profile.currentChallenges, undefined),
    interests: safeJsonParse(profile.interests, undefined),
    depthPreference: profile.depthPreference ?? undefined,
    learningStyle: profile.learningStyle ?? undefined,
    timeAvailable: profile.timeAvailable ?? undefined,
    sensitivities: safeJsonParse(profile.sensitivities, undefined),
    onboardingCompleted: profile.onboardingCompleted,
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
