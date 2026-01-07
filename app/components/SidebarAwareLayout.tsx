'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SidebarAwareLayoutProps {
  children: ReactNode;
}

export default function SidebarAwareLayout({ children }: SidebarAwareLayoutProps) {
  const pathname = usePathname();

  // Hide sidebar padding on specific pages (onboarding, login, signup)
  const hideSidebar = pathname?.startsWith('/onboarding') ||
                      pathname?.startsWith('/login') ||
                      pathname?.startsWith('/signup');

  // Both sidebars start collapsed (64px / 4rem each), expand on hover
  // Add margin for both left and right sidebars, plus bottom padding for chat bar
  return (
    <div className={`min-h-screen pb-20 ${hideSidebar ? '' : 'lg:ml-16 lg:mr-16'}`}>
      {children}
    </div>
  );
}
