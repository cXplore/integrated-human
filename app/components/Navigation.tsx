'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import SearchBox from './SearchBox';
import { useReadingList } from './ReadingListContext';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

const navItems: NavItem[] = [
  { label: 'Start Here', href: '/start-here' },
  {
    label: 'Explore',
    dropdown: [
      { label: 'Mind', href: '/mind', description: 'Shadow work, emotions, patterns' },
      { label: 'Body', href: '/body', description: 'Strength, breath, nervous system' },
      { label: 'Soul', href: '/soul', description: 'Meditation, meaning, presence' },
      { label: 'Relationships', href: '/relationships', description: 'Attachment, intimacy, conflict' },
      { label: 'All Articles', href: '/library', description: 'Browse the full collection' },
      { label: 'Archetype Quiz', href: '/archetypes', description: 'Discover your profile' },
      { label: 'Learning Paths', href: '/learning-paths', description: 'Structured journeys' },
      { label: 'Practices', href: '/practices', description: 'Breathwork, grounding, meditation' },
    ],
  },
  {
    label: 'Courses',
    dropdown: [
      { label: 'All Courses', href: '/courses', description: 'Browse all courses' },
      { label: 'Free Courses', href: '/free', description: 'Start without commitment' },
      { label: 'Bundles', href: '/bundles', description: 'Save with course bundles' },
    ],
  },
  { label: 'Membership', href: '/pricing' },
  {
    label: 'About',
    dropdown: [
      { label: 'About Us', href: '/about', description: 'Who we are and why we exist' },
      { label: 'Transparency', href: '/transparency', description: 'Our methodology and standards' },
    ],
  },
];

function MegaMenu({ items, isOpen, onClose }: { items: DropdownItem[]; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  // Separate pillars from tools
  const pillars = items.filter(item => ['Mind', 'Body', 'Soul', 'Relationships'].includes(item.label));
  const tools = items.filter(item => !['Mind', 'Body', 'Soul', 'Relationships'].includes(item.label));

  // Use mega menu for Explore (has pillars), simple dropdown for others
  const isMegaMenu = pillars.length > 0;

  if (!isMegaMenu) {
    // Simple dropdown for Courses and other nav items
    return (
      <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 shadow-xl z-50 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="block px-4 py-2.5 hover:bg-zinc-800 transition-colors"
          >
            <span className="text-white text-sm">{item.label}</span>
            {item.description && (
              <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
            )}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[700px] bg-zinc-900 border border-zinc-800 shadow-xl z-50 p-6">
      {/* Four Pillars Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {pillars.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="group p-4 rounded-lg hover:bg-zinc-800 transition-colors text-center"
          >
            <span className="block text-white font-medium group-hover:text-gray-200 mb-1">{item.label}</span>
            {item.description && (
              <span className="block text-xs text-gray-500 group-hover:text-gray-400">{item.description}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Tools Section */}
      {tools.length > 0 && (
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex justify-center gap-6">
            {tools.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="group flex items-center gap-2 px-4 py-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <span className="text-gray-400 group-hover:text-white text-sm">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-gray-600 group-hover:text-gray-500">— {item.description}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { savedSlugs } = useReadingList();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <nav className="py-6 px-6 bg-black border-b border-zinc-800 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-light text-white hover:text-gray-400 transition-colors">
          Integrated Human
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8" ref={dropdownRef}>
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                    <svg
                      className={`w-4 h-4 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <MegaMenu
                    items={item.dropdown}
                    isOpen={activeDropdown === item.label}
                    onClose={() => setActiveDropdown(null)}
                  />
                </>
              ) : (
                <Link href={item.href!} className="text-gray-400 hover:text-white transition-colors">
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          {/* Reading List Button */}
          <Link
            href="/reading-list"
            className="text-gray-400 hover:text-white transition-colors p-1 relative"
            aria-label="Reading list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {savedSlugs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-xs rounded-full flex items-center justify-center font-medium">
                {savedSlugs.length > 9 ? '9+' : savedSlugs.length}
              </span>
            )}
          </Link>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>

        {/* Mobile Search & Menu Buttons */}
        <div className="flex items-center gap-1 md:hidden">
          <UserMenu />
          <ThemeToggle />
          <Link
            href="/reading-list"
            className="p-2 text-gray-400 hover:text-white relative"
            aria-label="Reading list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {savedSlugs.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-white text-black text-xs rounded-full flex items-center justify-center font-medium">
                {savedSlugs.length > 9 ? '9+' : savedSlugs.length}
              </span>
            )}
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Toggle menu"
          >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-800">
          <div className="flex flex-col">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.dropdown ? (
                  <>
                    <button
                      onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                      className="flex items-center justify-between w-full text-gray-400 hover:text-white transition-colors py-3"
                    >
                      {item.label}
                      <svg
                        className={`w-4 h-4 transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileExpanded === item.label && (
                      <div className="pl-4 pb-2">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-2 text-gray-500 hover:text-white transition-colors"
                          >
                            {subItem.label}
                            {subItem.description && (
                              <span className="block text-xs text-gray-600">{subItem.description}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    className="block text-gray-400 hover:text-white transition-colors py-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-2xl">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 hover:text-white p-2"
                aria-label="Close search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SearchBox onClose={() => setSearchOpen(false)} />
            <p className="text-gray-500 text-sm mt-4 text-center">
              Press ESC to close
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}
