import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Navigation from '../components/Navigation';
import Image from 'next/image';
import NewsletterToggle from './NewsletterToggle';
import ReadingStats from './ReadingStats';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-8">
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[var(--border-color)]">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'Profile'}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                  <span className="text-2xl text-gray-300">
                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="font-serif text-2xl font-light text-white">
                  {user.name || 'Anonymous'}
                </h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
                  Account
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                    <span className="text-gray-400">Sign-in Method</span>
                    <span className="text-white flex items-center gap-2">
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

              {/* Reading Stats */}
              <ReadingStats />
            </div>

            {/* Sign Out */}
            <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button
                  type="submit"
                  className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
