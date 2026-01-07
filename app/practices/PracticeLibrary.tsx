'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PracticeCard from '../components/PracticeCard';

interface PracticeMetadata {
  slug: string;
  title: string;
  description: string;
  category?: string;
  pillar?: string;
  duration: string;
  durationMinutes?: number;
  intensity?: string;
  difficulty?: string;
  tags: string[];
  helpssWith?: string[];
  image?: string;
}

interface Practice {
  slug: string;
  metadata: PracticeMetadata;
}

const CATEGORIES = [
  { value: 'all', label: 'All Practices', icon: null },
  { value: 'breathwork', label: 'Breathwork', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )},
  { value: 'grounding', label: 'Grounding', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  )},
  { value: 'meditation', label: 'Meditation', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )},
  { value: 'somatic', label: 'Somatic', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )},
  { value: 'shadow-work', label: 'Shadow Work', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )},
  { value: 'emotional-release', label: 'Emotional Release', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )},
];

const DURATIONS = [
  { value: 'all', label: 'Any Duration' },
  { value: 'quick', label: '1-3 min' },
  { value: 'short', label: '5-10 min' },
  { value: 'medium', label: '15-20 min' },
  { value: 'long', label: '30+ min' },
];

const INTENSITY_OPTIONS = [
  { value: 'all', label: 'Any Intensity' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'activating', label: 'Activating' },
  { value: 'intense', label: 'Intense' },
];

type ViewMode = 'grid' | 'list';

export default function PracticeLibrary() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [duration, setDuration] = useState('all');
  const [intensity, setIntensity] = useState('all');
  const [search, setSearch] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    async function fetchPractices() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);
        if (duration !== 'all') params.set('duration', duration);
        if (search) params.set('search', search);
        if (showRecommended) params.set('recommended', 'true');

        const res = await fetch(`/api/practices?${params.toString()}`);
        const data = await res.json();
        if (data.practices) {
          let filteredPractices = data.practices;

          // Client-side intensity filter (if API doesn't support it)
          if (intensity !== 'all') {
            filteredPractices = filteredPractices.filter(
              (p: Practice) => p.metadata.intensity === intensity
            );
          }

          setPractices(filteredPractices);
        }
      } catch (error) {
        console.error('Failed to fetch practices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPractices();
  }, [category, duration, intensity, search, showRecommended]);

  // Featured practices (first 3 when no filters applied)
  const showFeatured = !search && category === 'all' && duration === 'all' && intensity === 'all' && !showRecommended;
  const featuredPractices = showFeatured ? practices.slice(0, 3) : [];
  const regularPractices = showFeatured ? practices.slice(3) : practices;

  return (
    <div className="space-y-8">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-all ${
              category === cat.value
                ? 'bg-white text-black'
                : 'bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search practices by name, description, or what they help with..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 pl-10 focus:outline-none focus:border-zinc-600 placeholder-gray-600"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Duration Filter */}
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-zinc-600"
          >
            {DURATIONS.map((dur) => (
              <option key={dur.value} value={dur.value}>
                {dur.label}
              </option>
            ))}
          </select>

          {/* Intensity Filter */}
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-zinc-600"
          >
            {INTENSITY_OPTIONS.map((int) => (
              <option key={int.value} value={int.value}>
                {int.label}
              </option>
            ))}
          </select>

          {/* Recommended Toggle */}
          <button
            onClick={() => setShowRecommended(!showRecommended)}
            className={`px-4 py-2 border transition-colors ${
              showRecommended
                ? 'bg-amber-600/20 border-amber-600 text-amber-400'
                : 'border-zinc-800 text-gray-500 hover:text-gray-300 hover:border-zinc-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              For You
            </span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-zinc-800 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-white'}`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-white'}`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Results count */}
          <span className="text-gray-500 text-sm">
            {practices.length} practice{practices.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="flex">
                <div className="w-32 sm:w-40 h-32 bg-zinc-800" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-3 bg-zinc-800 rounded w-1/4" />
                  <div className="h-5 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-full" />
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : practices.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800">
          <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400 mb-2">No practices found</p>
          <p className="text-gray-600 text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <>
          {/* Featured Section */}
          {featuredPractices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Featured Practices
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {featuredPractices.map((practice) => (
                  <PracticeCard key={practice.slug} practice={practice} variant="featured" />
                ))}
              </div>
            </div>
          )}

          {/* Regular Grid/List */}
          {regularPractices.length > 0 && (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-3'}>
              {regularPractices.map((practice) => (
                <PracticeCard
                  key={practice.slug}
                  practice={practice}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty Recommended State */}
      {showRecommended && practices.length === 0 && !loading && (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800">
          <svg className="w-12 h-12 mx-auto text-amber-500/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-400 mb-2">Complete your assessments to get personalized recommendations</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/archetypes" className="text-amber-500 hover:text-amber-400 text-sm">
              Archetype Quiz →
            </Link>
            <Link href="/attachment" className="text-amber-500 hover:text-amber-400 text-sm">
              Attachment Style →
            </Link>
            <Link href="/nervous-system" className="text-amber-500 hover:text-amber-400 text-sm">
              Nervous System Check →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
