import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navigation from '../components/Navigation';
import AssessmentFlow from './AssessmentFlow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integration Assessment | Integrated Human',
  description: 'Discover where you are on the development spectrum and across the four pillars of integration.',
};

export default async function AssessmentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/assessment');
  }

  // Check for existing progress
  const progress = await prisma.assessmentProgress.findUnique({
    where: { userId: session.user.id },
  });

  // Check for existing completed assessment
  const existingResult = await prisma.assessmentResult.findFirst({
    where: {
      userId: session.user.id,
      type: 'integration',
    },
    orderBy: { createdAt: 'desc' },
  });

  // Parse progress if exists
  const existingProgress = progress
    ? {
        phase: progress.currentPhase,
        answers: JSON.parse(progress.answers || '{}'),
        startedAt: progress.startedAt.toISOString(),
      }
    : null;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-2xl mx-auto">
            {existingResult && !progress && (
              <div className="mb-8 p-4 border border-zinc-700 rounded-lg">
                <p className="text-gray-400 text-sm">
                  You completed this assessment on{' '}
                  {new Date(existingResult.createdAt).toLocaleDateString()}.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Taking it again will update your results.
                </p>
              </div>
            )}
            <AssessmentFlow existingProgress={existingProgress} />
          </div>
        </div>
      </main>
    </>
  );
}
