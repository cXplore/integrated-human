'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import SearchBox from './SearchBox';
import { useReadingList } from './ReadingListContext';
import ThemeToggle from './ThemeToggle';

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
      { label: 'Mind', href: '/mind', description: 'Shadow work, emotions, nervous system, patterns' },
      { label: 'Body', href: '/body', description: 'Strength, yoga, breathwork, sleep, recovery' },
      { label: 'Soul', href: '/soul', description: 'Meditation, psychedelics, meaning, presence' },
      { label: 'Relationships', href: '/relationships', description: 'Attachment, polarity, conflict, intimacy' },
      { label: 'Learning Paths', href: '/learning-paths', description: 'Structured series to read in order' },
    ],
  },
  { label: 'Topics', href: '/tags' },
  { label: 'Library', href: '/library' },
  { label: 'Books', href: '/shop' },
  { label: 'Community', href: '/community' },
  { label: 'About', href: '/about' },
];

function DropdownMenu({ items, isOpen, onClose }: { items: DropdownItem[]; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 shadow-xl z-50">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="block px-5 py-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0"
        >
          <span className="text-white font-medium">{item.label}</span>
          {item.description && (
            <span className="block text-sm text-gray-500 mt-1">{item.description}</span>
          )}
        </Link>
      ))}
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
                  <DropdownMenu
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
        </div>

        {/* Mobile Search & Menu Buttons */}
        <div className="flex items-center gap-1 md:hidden">
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
