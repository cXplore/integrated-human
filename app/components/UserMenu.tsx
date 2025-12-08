'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-700 animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="text-gray-400 hover:text-white transition-colors text-sm"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        aria-label="User menu"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'Profile'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-sm text-gray-300">
              {session.user.name?.charAt(0) || session.user.email?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 shadow-xl z-50">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-white text-sm font-medium truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {session.user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
            >
              Profile
            </Link>
            <Link
              href="/reading-list"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
            >
              Reading List
            </Link>
          </div>

          <div className="border-t border-zinc-800 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="w-full text-left px-4 py-2 text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
