'use client';

import Link from 'next/link';

interface MembershipCTAProps {
  variant?: 'primary' | 'sidebar' | 'inline';
}

export default function MembershipCTA({ variant = 'primary' }: MembershipCTAProps) {
  if (variant === 'sidebar') {
    return (
      <div className="space-y-3">
        <Link
          href="/pricing"
          className="w-full py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors text-center block"
        >
          Become a Member
        </Link>
        <p className="text-center text-xs text-gray-500">
          $19/month · All content included
        </p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Link
        href="/pricing"
        className="text-gray-300 hover:text-white underline underline-offset-2"
      >
        Get membership for full access →
      </Link>
    );
  }

  // Primary variant
  return (
    <Link
      href="/pricing"
      className="px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
    >
      Become a Member — $19/mo
    </Link>
  );
}
