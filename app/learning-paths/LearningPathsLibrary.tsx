'use client';

import { useState, useMemo } from 'react';
import { LEARNING_PATHS } from '@/lib/learning-paths';
import LearningPathCard from '../components/LearningPathCard';

const PILLARS = [
  { value: 'all', label: 'All Paths', icon: null },
  { value: 'mind', label: 'Mind', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )},
  { value: 'body', label: 'Body', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )},
  { value: 'soul', label: 'Soul', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )},
  { value: 'relationships', label: 'Relationships', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )},
];

const STAGES = [
  { value: 'all', label: 'Any Stage' },
  { value: 'collapse', label: 'Crisis / Collapse' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'integration', label: 'Integration' },
  { value: 'embodiment', label: 'Embodiment' },
  { value: 'optimization', label: 'Optimization' },
];

type ViewMode = 'grid' | 'list' | 'compact';

export default function LearningPathsLibrary() {
  const [search, setSearch] = useState('');
  const [pillar, setPillar] = useState('all');
  const [stage, setStage] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSteps, setShowSteps] = useState(false);

  const filteredPaths = useMemo(() => {
    let paths = [...LEARNING_PATHS];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      paths = paths.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.subtitle.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.outcomes.some((o) => o.toLowerCase().includes(searchLower))
      );
    }

    // Filter by pillar
    if (pillar !== 'all') {
      paths = paths.filter((p) => p.pillar === pillar);
    }

    // Filter by stage
    if (stage !== 'all') {
      paths = paths.filter((p) => p.stages.includes(stage as any));
    }

    return paths;
  }, [search, pillar, stage]);

  // Featured paths (first 3 when no filters)
  const showFeatured = !search && pillar === 'all' && stage === 'all' && viewMode === 'grid';
  const featuredPaths = showFeatured ? filteredPaths.slice(0, 3) : [];
  const regularPaths = showFeatured ? filteredPaths.slice(3) : filteredPaths;

  return (
    <div className="space-y-8">
      {/* Pillar Pills */}
      <div className="flex flex-wrap gap-2">
        {PILLARS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPillar(p.value)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-all ${
              pillar === p.value
                ? 'bg-white text-black'
                : 'bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            {p.icon}
            <span>{p.label}</span>
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
            placeholder="Search learning paths by title, description, or outcomes..."
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
          {/* Stage Filter */}
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 focus:outline-none focus:border-zinc-600"
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Show Steps Toggle */}
          <button
            onClick={() => setShowSteps(!showSteps)}
            className={`px-4 py-2 border transition-colors ${
              showSteps
                ? 'bg-amber-600/20 border-amber-600 text-amber-400'
                : 'border-zinc-800 text-gray-500 hover:text-gray-300 hover:border-zinc-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Show Steps
            </span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-zinc-800 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-white'}`}
              title="Featured view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
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
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 ${viewMode === 'compact' ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-white'}`}
              title="Compact view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          </div>

          {/* Results count */}
          <span className="text-gray-500 text-sm">
            {filteredPaths.length} path{filteredPaths.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Results */}
      {filteredPaths.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800">
          <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-400 mb-2">No learning paths found</p>
          <p className="text-gray-600 text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : viewMode === 'compact' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPaths.map((path) => (
            <LearningPathCard key={path.id} path={path} variant="compact" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <>
          {/* Featured Section */}
          {featuredPaths.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Featured Paths
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredPaths.map((path) => (
                  <LearningPathCard key={path.id} path={path} variant="featured" />
                ))}
              </div>
            </div>
          )}

          {/* Regular paths in list format when grid mode but after featured */}
          {regularPaths.length > 0 && (
            <div className="space-y-4">
              {featuredPaths.length > 0 && (
                <h2 className="text-lg font-medium text-white">All Paths</h2>
              )}
              <div className="grid gap-6">
                {regularPaths.map((path) => (
                  <LearningPathCard key={path.id} path={path} showSteps={showSteps} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-6">
          {filteredPaths.map((path) => (
            <LearningPathCard key={path.id} path={path} showSteps={showSteps} />
          ))}
        </div>
      )}
    </div>
  );
}
