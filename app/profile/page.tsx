import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '../components/Navigation';
import Image from 'next/image';
import NewsletterToggle from './NewsletterToggle';
import ReadingStats from './ReadingStats';
import CourseProgress from './CourseProgress';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Integrated Human',
  description: 'Your personal dashboard for tracking reading progress, course completions, and integration journey.',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name: string | null | undefined): string {
  if (!name) return 'there';
  return name.split(' ')[0];
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  // Fetch user's createdAt from database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { createdAt: true },
  });

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)]">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-b from-zinc-900 to-[var(--background)] pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Profile'}
                  width={100}
                  height={100}
                  className="rounded-full ring-4 ring-zinc-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center ring-4 ring-zinc-800">
                  <span className="text-3xl text-gray-300 font-serif">
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="text-center md:text-left">
                <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
                  {getGreeting()}, {getFirstName(user.name)}
                </h1>
                <p className="text-gray-400 text-lg">
                  Welcome back to your integration journey
                </p>
                {dbUser?.createdAt && (
                  <p className="text-gray-500 text-sm mt-3">
                    On this path since {new Date(dbUser.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column - Progress */}
              <div className="md:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="/courses"
                    className="group bg-[var(--card-bg)] border border-[var(--border-color)] p-5 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-white font-medium">Courses</span>
                    </div>
                    <p className="text-gray-500 text-sm">Continue learning</p>
                  </a>
                  <a
                    href="/reading-list"
                    className="group bg-[var(--card-bg)] border border-[var(--border-color)] p-5 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="text-white font-medium">Reading List</span>
                    </div>
                    <p className="text-gray-500 text-sm">Saved for later</p>
                  </a>
                </div>

                {/* Course Progress Card */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
                  <CourseProgress />
                </div>

                {/* Reading Stats Card */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
                  <ReadingStats />
                </div>
              </div>

              {/* Right Column - Account */}
              <div className="space-y-6">
                {/* Account Settings */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
                  <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
                    Account
                  </h2>
                  <div className="space-y-4">
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
                  </div>
                </div>

                {/* Explore More */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
                  <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
                    Explore
                  </h2>
                  <div className="space-y-3">
                    <a href="/archetypes" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Take the Archetype Quiz
                    </a>
                    <a href="/learning-paths" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Browse Learning Paths
                    </a>
                    <a href="/library" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm py-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Explore the Library
                    </a>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full px-4 py-2 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
