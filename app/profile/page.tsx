import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '../components/Navigation';
import Image from 'next/image';
import NewsletterToggle from './NewsletterToggle';
import ReadingStats from './ReadingStats';
import CourseProgress from './CourseProgress';
import Certificates from './Certificates';
import PurchasedCourses from './PurchasedCourses';
import Recommendations from './Recommendations';
import OnboardingPrompt from './OnboardingPrompt';
import ReassessmentPrompt from './ReassessmentPrompt';
import StreakTracker from './StreakTracker';
import SelfDiscovery from './SelfDiscovery';
import AICredits from './AICredits';
import WhereImStuck from '../components/WhereImStuck';
import IntegrationCheckIn from './IntegrationCheckIn';
import ContinueJourney from './ContinueJourney';
import FirstTimeJourney from './FirstTimeJourney';
import IntegrationHealth from './IntegrationHealth';
import QuickCheckIn from '../components/QuickCheckIn';
import WeeklyCheckIn from '../components/WeeklyCheckIn';
import TodaysFocus from '../components/TodaysFocus';
import DataExport from './DataExport';
import CollapsibleSection from './CollapsibleSection';
import HealthNudges from './HealthNudges';
import ActiveLearningPath from './ActiveLearningPath';
import PracticeFinder from './PracticeFinder';
import ProgressTimeline from './ProgressTimeline';
import GrowthEdges from './GrowthEdges';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Integrated Human',
  description: 'Your personal dashboard for tracking reading progress, course completions, and integration journey.',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  // Fetch user context data for conditional rendering
  const [dbUser, userProfile, assessmentCount, articleProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true },
    }),
    prisma.assessmentResult.count({
      where: { userId: session.user.id },
    }),
    prisma.articleProgress.count({
      where: { userId: session.user.id, completed: true },
    }),
  ]);

  const isNewUser = !userProfile?.onboardingCompleted;
  const hasCompletedAllAssessments = assessmentCount >= 3;
  const hasReadArticles = articleProgress > 0;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        {/* Today's Focus - Dynamic hero for returning users */}
        <TodaysFocus />

        {/* Compact Welcome Header */}
        <div className="bg-gradient-to-b from-zinc-900 to-[var(--background)] pt-20 pb-8 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Profile'}
                  width={64}
                  height={64}
                  className="rounded-full ring-2 ring-zinc-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center ring-2 ring-zinc-800">
                  <span className="text-2xl text-gray-300 font-serif">
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h1 className="font-serif text-2xl md:text-3xl font-light text-white">
                  {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Dashboard'}
                </h1>
                {dbUser?.createdAt && (
                  <p className="text-gray-500 text-sm mt-1">
                    On this path since {new Date(dbUser.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              {/* Quick Actions in Header */}
              <div className="flex gap-2">
                <a
                  href="/profile/journal"
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Journal"
                >
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </a>
                <a
                  href="/practices"
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Practices"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Reorganized with clear sections */}
        <div className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">

            {/* Priority Section: Onboarding for new users */}
            {isNewUser && (
              <div className="mb-8">
                <OnboardingPrompt />
              </div>
            )}

            {/* Reassessment prompts for returning users with stale/changed scores */}
            {!isNewUser && (
              <div className="mb-8">
                <ReassessmentPrompt />
              </div>
            )}

            {/* Proactive Health Nudges */}
            {!isNewUser && (
              <div className="mb-8">
                <HealthNudges />
              </div>
            )}

            {/* Section 1: Daily Actions - Always visible, compact */}
            <section className="mb-8" id="check-in">
              <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Daily Check-in
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <QuickCheckIn />
                <PracticeFinder />
              </div>
            </section>

            {/* Section 2: Active Learning Path */}
            {!isNewUser && (
              <section className="mb-8">
                <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Your Learning Path
                </h2>
                <ActiveLearningPath />
              </section>
            )}

            {/* Section 3: Your Journey - Personalized for new vs returning users */}
            <section className="mb-8">
              <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                {!hasReadArticles ? 'Your Starting Point' : 'Continue Your Journey'}
              </h2>
              {!hasReadArticles ? (
                <FirstTimeJourney />
              ) : (
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <ContinueJourney />
                  </div>
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
                    <StreakTracker />
                  </div>
                </div>
              )}
            </section>

            {/* Main Grid: Two columns on desktop */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Left Column: Main content */}
              <div className="lg:col-span-2 space-y-6">

                {/* Section 3: Self-Discovery - Collapsible if all complete */}
                <CollapsibleSection
                  title="Self-Discovery"
                  defaultOpen={!hasCompletedAllAssessments}
                  badge={hasCompletedAllAssessments ? 'Complete' : undefined}
                >
                  <SelfDiscovery />
                </CollapsibleSection>

                {/* Section 4: Integration Health */}
                <IntegrationHealth />

                {/* Section 4.5: Growth Edges */}
                <GrowthEdges />

                {/* Section 5: Reflection - Collapsible */}
                <CollapsibleSection title="Weekly Reflection" defaultOpen={true}>
                  <IntegrationCheckIn />
                </CollapsibleSection>

                {/* Section 6: Recommendations */}
                <CollapsibleSection title="Recommended For You" defaultOpen={true}>
                  <Recommendations />
                </CollapsibleSection>

                {/* Section 7: Need Help - Where I'm Stuck */}
                <WhereImStuck />

                {/* Section 8: Learning Progress - Collapsible */}
                <CollapsibleSection title="Learning Progress" defaultOpen={hasReadArticles}>
                  <div className="space-y-6">
                    <PurchasedCourses />
                    <div className="border-t border-zinc-800 pt-6">
                      <CourseProgress />
                    </div>
                    <div className="border-t border-zinc-800 pt-6">
                      <ReadingStats />
                    </div>
                    <div className="border-t border-zinc-800 pt-6">
                      <Certificates />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Section 9: Progress Timeline */}
                <ProgressTimeline />
              </div>

              {/* Right Column: Account & Tools */}
              <div className="space-y-6">

                {/* AI Credits - Always visible */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
                  <AICredits />
                </div>

                {/* Quick Navigation */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
                  <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
                    Quick Access
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="/courses"
                      className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-center"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-gray-300 text-xs">Courses</span>
                    </a>
                    <a
                      href="/library"
                      className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-center"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-gray-300 text-xs">Library</span>
                    </a>
                    <a
                      href="/profile/dreams"
                      className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-center"
                    >
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="text-gray-300 text-xs">Dreams</span>
                    </a>
                    <a
                      href="/reading-list"
                      className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-center"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="text-gray-300 text-xs">Saved</span>
                    </a>
                    <a
                      href="/profile/ai-insights"
                      className="flex flex-col items-center gap-1 p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-center col-span-2"
                    >
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-gray-300 text-xs">AI Insights</span>
                    </a>
                  </div>
                </div>

                {/* Explore More */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5">
                  <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
                    Explore
                  </h2>
                  <div className="space-y-2">
                    <a href="/archetypes" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2 px-2 rounded hover:bg-zinc-800/50">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Archetype Quiz
                    </a>
                    <a href="/attachment" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2 px-2 rounded hover:bg-zinc-800/50">
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Attachment Style
                    </a>
                    <a href="/nervous-system" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2 px-2 rounded hover:bg-zinc-800/50">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Nervous System
                    </a>
                    <a href="/learning-paths" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2 px-2 rounded hover:bg-zinc-800/50">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Learning Paths
                    </a>
                  </div>
                </div>

                {/* Account Settings - Collapsed by default */}
                <details className="bg-[var(--card-bg)] border border-[var(--border-color)] group">
                  <summary className="p-5 cursor-pointer list-none flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <h2 className="text-sm uppercase tracking-wide text-gray-500">
                      Account Settings
                    </h2>
                    <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 space-y-4">
                    <div className="py-3 border-b border-zinc-800">
                      <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">Email</span>
                      <span className="text-white text-sm">{user.email}</span>
                    </div>
                    <div className="py-3 border-b border-zinc-800">
                      <span className="block text-gray-500 text-xs uppercase tracking-wide mb-1">Sign-in</span>
                      <span className="text-white text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                      </span>
                    </div>
                    <NewsletterToggle />
                    <a
                      href="/profile/subscription"
                      className="flex items-center justify-between py-3 text-gray-400 hover:text-white transition-colors group/link"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-sm">Manage Subscription</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-600 group-hover/link:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                    <div className="pt-2">
                      <DataExport />
                    </div>
                  </div>
                </details>

                {/* Sign Out */}
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/' });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full px-4 py-3 border border-zinc-800 text-gray-500 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
