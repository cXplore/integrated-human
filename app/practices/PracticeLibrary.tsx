'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PracticeMetadata {
  slug: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  durationMinutes: number;
  intensity: string;
  tags: string[];
  helpssWith: string[];
}

interface Practice {
  slug: string;
  metadata: PracticeMetadata;
}

const CATEGORIES = [
  { value: 'all', label: 'All Practices' },
  { value: 'breathwork', label: 'Breathwork' },
  { value: 'grounding', label: 'Grounding' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'somatic', label: 'Somatic' },
  { value: 'shadow-work', label: 'Shadow Work' },
  { value: 'emotional-release', label: 'Emotional Release' },
];

const DURATIONS = [
  { value: 'all', label: 'Any Duration' },
  { value: 'quick', label: '1-3 min' },
  { value: 'short', label: '5-10 min' },
  { value: 'medium', label: '15-20 min' },
  { value: 'long', label: '30+ min' },
];

const INTENSITY_COLORS: Record<string, string> = {
  gentle: 'text-blue-400',
  moderate: 'text-amber-400',
  activating: 'text-orange-400',
  intense: 'text-red-400',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  breathwork: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  grounding: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  ),
  meditation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  somatic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'shadow-work': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  'emotional-release': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

export default function PracticeLibrary() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [duration, setDuration] = useState('all');
  const [search, setSearch] = useState('');
  const [showRecommended, setShowRecommended] = useState(false);

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
          setPractices(data.practices);
        }
      } catch (error) {
        console.error('Failed to fetch practices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPractices();
  }, [category, duration, search, showRecommended]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search practices..."
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
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-zinc-600"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

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

          {/* Recommended Toggle */}
          <button
            onClick={() => setShowRecommended(!showRecommended)}
            className={`px-4 py-2 border transition-colors ${
              showRecommended
                ? 'bg-amber-600/20 border-amber-600 text-amber-400'
                : 'border-zinc-800 text-gray-500 hover:text-gray-300 hover:border-zinc-600'
            }`}
          >
            For You
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-zinc-900 border border-zinc-800 p-6">
              <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3"></div>
              <div className="h-6 bg-zinc-800 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-zinc-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : practices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No practices found</p>
          <p className="text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {practices.map((practice) => (
            <Link
              key={practice.slug}
              href={`/practices/${practice.slug}`}
              className="group bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Category & Duration */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      {CATEGORY_ICONS[practice.metadata.category] || (
                        <span className="w-5 h-5"></span>
                      )}
                      <span className="text-xs uppercase tracking-wide">
                        {practice.metadata.category.replace('-', ' ')}
                      </span>
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-gray-500 text-xs">
                      {practice.metadata.durationMinutes} min
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-medium text-lg mb-2 group-hover:text-amber-400 transition-colors">
                    {practice.metadata.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                    {practice.metadata.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {practice.metadata.helpssWith.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Intensity Indicator */}
                <div className="text-right">
                  <span className={`text-xs ${INTENSITY_COLORS[practice.metadata.intensity] || 'text-gray-500'}`}>
                    {practice.metadata.intensity}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty Recommended State */}
      {showRecommended && practices.length === 0 && !loading && (
        <div className="text-center py-8 bg-zinc-900 border border-zinc-800">
          <p className="text-gray-400 mb-2">Complete your assessments to get personalized practice recommendations</p>
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
