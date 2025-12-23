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
  badge?: string;
  icon?: string;
}

interface DropdownSection {
  title?: string;
  items: DropdownItem[];
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
  megaMenu?: {
    sections: DropdownSection[];
    featured?: {
      title: string;
      description: string;
      href: string;
      badge?: string;
    };
  };
}

const navItems: NavItem[] = [
  { label: 'Start Here', href: '/start-here' },
  {
    label: 'Explore',
    megaMenu: {
      sections: [
        {
          title: 'Four Pillars',
          items: [
            { label: 'Mind', href: '/mind', description: 'Shadow work, emotions, patterns', icon: '🧠' },
            { label: 'Body', href: '/body', description: 'Nervous system, embodiment, vitality', icon: '💪' },
            { label: 'Soul', href: '/soul', description: 'Meditation, meaning, presence', icon: '✨' },
            { label: 'Relationships', href: '/relationships', description: 'Attachment, intimacy, boundaries', icon: '💚' },
          ],
        },
        {
          title: 'Content Library',
          items: [
            { label: 'All Articles', href: '/library', description: '200+ in-depth essays' },
            { label: 'All Courses', href: '/courses', description: '100+ structured programs' },
            { label: 'Practices', href: '/practices', description: 'Guided exercises & techniques' },
            { label: 'Books', href: '/books', description: 'Recommended reading' },
            { label: 'Free Resources', href: '/free', description: 'Start without commitment' },
          ],
        },
        {
          title: 'Assessments',
          items: [
            { label: 'Archetype Quiz', href: '/archetypes', description: 'Discover your shadow profile' },
            { label: 'Attachment Style', href: '/attachment', description: 'Understand your patterns' },
            { label: 'Nervous System', href: '/nervous-system', description: 'Check your regulation state' },
            { label: 'Shadow Profile', href: '/shadow-profile', description: 'Your integration map' },
          ],
        },
        {
          title: 'Learning Journeys',
          items: [
            { label: 'Learning Paths', href: '/learn/paths', description: 'AI-curated journeys', badge: 'New' },
            { label: 'Course Bundles', href: '/bundles', description: 'Curated course collections' },
            { label: 'Legacy Paths', href: '/learning-paths', description: 'Original structured guides' },
            { label: 'Where to Start', href: '/start-here', description: 'New? Begin here' },
          ],
        },
        {
          title: 'Interactive & AI',
          items: [
            { label: 'AI Companion', href: '/chat', description: 'Personal growth chat', badge: 'New' },
            { label: 'Archetype Exploration', href: '/archetype-exploration', description: 'Guided discovery' },
            { label: 'Where I\'m Stuck', href: '/stuck', description: 'AI-guided help' },
          ],
        },
        {
          title: 'Your Tools',
          items: [
            { label: 'Dashboard', href: '/profile', description: 'Your integration health' },
            { label: 'Journal', href: '/profile/journal', description: 'Reflection & processing' },
            { label: 'Dream Journal', href: '/profile/dreams', description: 'Dream analysis & symbols' },
            { label: 'Reading List', href: '/reading-list', description: 'Saved articles' },
          ],
        },
        {
          title: 'About & Community',
          items: [
            { label: 'About Us', href: '/about', description: 'Who we are' },
            { label: 'Community', href: '/community', description: 'Connect with others' },
            { label: 'Pricing', href: '/pricing', description: 'Membership options' },
            { label: 'Shop', href: '/shop', description: 'Merchandise & products' },
            { label: 'Contact', href: '/connect', description: 'Get in touch' },
          ],
        },
      ],
    },
  },
  {
    label: 'Learn',
    megaMenu: {
      sections: [
        {
          title: 'Courses',
          items: [
            { label: 'All Courses', href: '/courses', description: 'Browse 90+ courses' },
            { label: 'Free Courses', href: '/free', description: 'Start without commitment' },
            { label: 'Course Bundles', href: '/bundles', description: 'Save with curated paths' },
          ],
        },
        {
          title: 'Structured Learning',
          items: [
            { label: 'Learning Paths', href: '/learn/paths', description: 'AI-curated journeys', badge: 'New' },
            { label: 'Legacy Paths', href: '/learning-paths', description: 'Original structured guides' },
          ],
        },
        {
          title: 'Interactive',
          items: [
            { label: 'AI Companion', href: '/chat', description: 'Personal growth chat', badge: 'New' },
            { label: 'Archetype Exploration', href: '/archetype-exploration', description: 'Guided discovery' },
          ],
        },
      ],
    },
  },
  {
    label: 'Tools',
    megaMenu: {
      sections: [
        {
          title: 'Daily Practice',
          items: [
            { label: 'Journal', href: '/profile/journal', description: 'Reflection & processing' },
            { label: 'Dream Journal', href: '/profile/dreams', description: 'Dream analysis & symbols' },
            { label: 'Quick Check-in', href: '/profile#check-in', description: 'Mood & energy tracking' },
          ],
        },
        {
          title: 'AI Features',
          items: [
            { label: 'AI Chat', href: '/chat', description: 'Personal companion', badge: 'New' },
            { label: 'Stuck?', href: '/stuck', description: "When you don't know where to start" },
          ],
        },
        {
          title: 'Progress',
          items: [
            { label: 'Integration Health', href: '/profile', description: 'Your development dashboard' },
            { label: 'Reading List', href: '/reading-list', description: 'Saved articles' },
          ],
        },
      ],
    },
  },
  {
    label: 'Community',
    dropdown: [
      { label: 'Community Hub', href: '/community', description: 'Connect with others' },
      { label: 'Contact', href: '/connect', description: 'Get in touch' },
      { label: 'Shop', href: '/shop', description: 'Merchandise & products' },
    ],
  },
  {
    label: 'About',
    dropdown: [
      { label: 'About Us', href: '/about', description: 'Who we are and why we exist' },
      { label: 'Our Values', href: '/values', description: 'What guides our work' },
      { label: 'Transparency', href: '/transparency', description: 'Methodology & standards' },
      { label: 'Pricing', href: '/pricing', description: 'Membership options' },
      { label: 'Terms of Service', href: '/terms', description: 'Legal terms' },
      { label: 'Privacy Policy', href: '/privacy', description: 'How we handle data' },
    ],
  },
];

function MegaMenu({
  megaMenu,
  isOpen,
  onClose
}: {
  megaMenu: NavItem['megaMenu'];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !megaMenu) return null;

  const { sections, featured } = megaMenu;
  const columnCount = sections.length + (featured ? 1 : 0);

  // For large mega menus (5+ sections), use a grid layout with smaller columns
  const isLargeMega = sections.length >= 5;
  const menuWidth = isLargeMega
    ? Math.min(sections.length * 180, 1260)  // Narrower columns for large menus
    : Math.min(columnCount * 240, 960);

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-zinc-900 border border-zinc-800 shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
      style={{ width: `${menuWidth}px` }}
    >
      <div className={`flex ${isLargeMega ? 'flex-wrap' : ''}`}>
        {/* Sections */}
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`p-4 border-r border-zinc-800 last:border-r-0 ${
              isLargeMega ? 'w-[180px] flex-shrink-0' : 'flex-1'
            }`}
          >
            {section.title && (
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="group block px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {item.icon && <span className="text-sm">{item.icon}</span>}
                    <span className={`text-white font-medium group-hover:text-gray-200 ${isLargeMega ? 'text-xs' : 'text-sm'}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-1 py-0.5 bg-purple-600/30 text-purple-300 text-[9px] font-medium rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && !isLargeMega && (
                    <span className="block text-xs text-gray-500 mt-0.5 ml-6 group-hover:text-gray-400">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Featured */}
        {featured && (
          <div className="w-56 p-5 bg-zinc-800/50">
            <Link
              href={featured.href}
              onClick={onClose}
              className="block group"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-medium group-hover:text-purple-300 transition-colors">
                  {featured.title}
                </h3>
                {featured.badge && (
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-medium rounded">
                    {featured.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 mb-3">
                {featured.description}
              </p>
              <span className="text-xs text-purple-400 group-hover:text-purple-300">
                Explore →
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleDropdown({
  items,
  isOpen,
  onClose
}: {
  items: DropdownItem[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 shadow-xl z-50 py-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="block px-4 py-2.5 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 bg-purple-600/30 text-purple-300 text-[10px] font-medium rounded">
                {item.badge}
              </span>
            )}
          </div>
          {item.description && (
            <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
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

  // Get all dropdown items for mobile (flatten megaMenu sections)
  const getMobileItems = (item: NavItem): DropdownItem[] => {
    if (item.dropdown) return item.dropdown;
    if (item.megaMenu) {
      const items: DropdownItem[] = [];
      item.megaMenu.sections.forEach(section => {
        items.push(...section.items);
      });
      if (item.megaMenu.featured) {
        items.push({
          label: item.megaMenu.featured.title,
          href: item.megaMenu.featured.href,
          description: item.megaMenu.featured.description,
          badge: item.megaMenu.featured.badge,
        });
      }
      return items;
    }
    return [];
  };

  return (
    <nav className="py-4 px-6 bg-black border-b border-zinc-800 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-light text-white hover:text-gray-400 transition-colors">
          Integrated Human
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6" ref={dropdownRef}>
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.megaMenu || item.dropdown ? (
                <>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      activeDropdown === item.label ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {item.megaMenu ? (
                    <MegaMenu
                      megaMenu={item.megaMenu}
                      isOpen={activeDropdown === item.label}
                      onClose={() => setActiveDropdown(null)}
                    />
                  ) : (
                    <SimpleDropdown
                      items={item.dropdown!}
                      isOpen={activeDropdown === item.label}
                      onClose={() => setActiveDropdown(null)}
                    />
                  )}
                </>
              ) : (
                <Link href={item.href!} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="h-5 w-px bg-zinc-700" />

          {/* Reading List Button */}
          <Link
            href="/reading-list"
            className="text-gray-400 hover:text-white transition-colors p-1 relative"
            aria-label="Reading list"
            title="Reading list"
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
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {savedSlugs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                {savedSlugs.length > 9 ? '9+' : savedSlugs.length}
              </span>
            )}
          </Link>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1 flex items-center gap-2"
            aria-label="Search"
            title="Search (Ctrl+K)"
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
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-500 bg-zinc-800 border border-zinc-700 rounded">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>

        {/* Mobile/Tablet Actions */}
        <div className="flex items-center gap-1 lg:hidden">
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
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {savedSlugs.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
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
                strokeWidth={1.5}
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
              strokeWidth="1.5"
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
        <div className="lg:hidden mt-4 pt-4 border-t border-zinc-800 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col">
            {navItems.map((item) => {
              const hasSubmenu = item.dropdown || item.megaMenu;
              const mobileItems = getMobileItems(item);

              return (
                <div key={item.label} className="border-b border-zinc-800/50 last:border-b-0">
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className="flex items-center justify-between w-full text-gray-300 hover:text-white transition-colors py-3"
                      >
                        <span className="font-medium">{item.label}</span>
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
                        <div className="pl-4 pb-3 space-y-1">
                          {mobileItems.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-2 text-gray-500 hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span>{subItem.label}</span>
                                {subItem.badge && (
                                  <span className="px-1.5 py-0.5 bg-purple-600/30 text-purple-300 text-[10px] font-medium rounded">
                                    {subItem.badge}
                                  </span>
                                )}
                              </div>
                              {subItem.description && (
                                <span className="block text-xs text-gray-600 mt-0.5">{subItem.description}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      className="block text-gray-300 hover:text-white transition-colors py-3 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}

            {/* Quick Links in Mobile */}
            <div className="pt-4 mt-2 border-t border-zinc-800">
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Quick Links</p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm">AI Chat</span>
                </Link>
                <Link
                  href="/profile/journal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm">Journal</span>
                </Link>
                <Link
                  href="/profile/dreams"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm">Dreams</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm">Dashboard</span>
                </Link>
              </div>
            </div>
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
