'use client';

import { useState } from 'react';

interface FilterCounts {
  pillars: {
    mind: number;
    body: number;
    soul: number;
    relationships: number;
  };
  types: {
    article: number;
    guide: number;
  };
  readingTime: {
    quick: number;
    medium: number;
    deep: number;
  };
}

interface Dimension {
  id: string;
  name: string;
  pillar: string;
}

interface TagCount {
  tag: string;
  count: number;
}

interface LibraryFiltersProps {
  filters: FilterCounts;
  dimensions: Dimension[];
  tags: TagCount[];
  selectedPillar: string | null;
  selectedDimension: string | null;
  selectedType: string | null;
  selectedReadingTime: string | null;
  selectedTag: string | null;
  onFilterChange: (key: string, value: string | null) => void;
  onClearAll: () => void;
  resultCount: number;
}

const PILLAR_CONFIG: Record<string, { icon: string; color: string }> = {
  mind: { icon: '🧠', color: 'blue' },
  body: { icon: '💪', color: 'emerald' },
  soul: { icon: '✨', color: 'purple' },
  relationships: { icon: '💞', color: 'rose' },
};

export default function LibraryFilters({
  filters,
  dimensions,
  tags,
  selectedPillar,
  selectedDimension,
  selectedType,
  selectedReadingTime,
  selectedTag,
  onFilterChange,
  onClearAll,
  resultCount,
}: LibraryFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('pillar');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dimensionSearch, setDimensionSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const hasActiveFilters = selectedPillar || selectedDimension || selectedType || selectedReadingTime || selectedTag;

  // Filter dimensions based on selected pillar and search
  const filteredDimensions = dimensions.filter(d => {
    const matchesPillar = !selectedPillar || d.pillar === selectedPillar;
    const matchesSearch = !dimensionSearch ||
      d.name.toLowerCase().includes(dimensionSearch.toLowerCase());
    return matchesPillar && matchesSearch;
  });

  // Filter tags based on search
  const filteredTags = tags.filter(t =>
    !tagSearch || t.tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Group dimensions by pillar for display
  const dimensionsByPillar = filteredDimensions.reduce((acc, dim) => {
    if (!acc[dim.pillar]) acc[dim.pillar] = [];
    acc[dim.pillar].push(dim);
    return acc;
  }, {} as Record<string, Dimension[]>);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const FilterSection = ({
    title,
    sectionKey,
    children,
    badge,
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
    badge?: string | number;
  }) => (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {badge !== undefined && (
            <span className="text-xs text-gray-500">({badge})</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${expandedSection === sectionKey ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandedSection === sectionKey && <div className="pb-4">{children}</div>}
    </div>
  );

  const FilterButton = ({
    active,
    onClick,
    children,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active
          ? 'bg-white text-black'
          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-1.5 ${active ? 'opacity-70' : 'text-gray-500'}`}>
          ({count})
        </span>
      )}
    </button>
  );

  const filtersContent = (
    <div className="space-y-1">
      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pb-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Active Filters</span>
            <button
              onClick={onClearAll}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPillar && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {PILLAR_CONFIG[selectedPillar]?.icon} {selectedPillar}
                <button
                  onClick={() => onFilterChange('pillar', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedDimension && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {dimensions.find(d => d.id === selectedDimension)?.name || selectedDimension}
                <button
                  onClick={() => onFilterChange('dimension', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/30 text-sm text-amber-300 rounded">
                #{selectedTag}
                <button
                  onClick={() => onFilterChange('tag', null)}
                  className="ml-1 text-amber-400 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {selectedType === 'guide' ? 'Guides' : 'Articles'}
                <button
                  onClick={() => onFilterChange('type', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedReadingTime && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {selectedReadingTime === 'quick' ? 'Quick' : selectedReadingTime === 'medium' ? 'Medium' : 'Deep'}
                <button
                  onClick={() => onFilterChange('readingTime', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pillar Filter */}
      <FilterSection title="Pillar" sectionKey="pillar">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters.pillars).map(([pillar, count]) => (
            <FilterButton
              key={pillar}
              active={selectedPillar === pillar}
              onClick={() => {
                onFilterChange('pillar', selectedPillar === pillar ? null : pillar);
                // Clear dimension if changing pillar
                if (selectedDimension) onFilterChange('dimension', null);
              }}
              count={count}
            >
              {PILLAR_CONFIG[pillar]?.icon} {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
            </FilterButton>
          ))}
        </div>
      </FilterSection>

      {/* Topics/Tags Filter */}
      <FilterSection title="Topics" sectionKey="topics" badge={tags.length}>
        <div className="space-y-3">
          {/* Tag search */}
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
          />

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {filteredTags.slice(0, 15).map(({ tag, count }) => (
              <FilterButton
                key={tag}
                active={selectedTag === tag}
                onClick={() => onFilterChange('tag', selectedTag === tag ? null : tag)}
                count={count}
              >
                #{tag}
              </FilterButton>
            ))}
            {filteredTags.length === 0 && tagSearch && (
              <p className="text-gray-500 text-sm">No topics match "{tagSearch}"</p>
            )}
          </div>
        </div>
      </FilterSection>

      {/* Dimension Filter - Improved */}
      <FilterSection title="Dimensions" sectionKey="dimension" badge={dimensions.length}>
        <div className="space-y-3">
          {/* Dimension search */}
          <input
            type="text"
            value={dimensionSearch}
            onChange={(e) => setDimensionSearch(e.target.value)}
            placeholder="Search dimensions..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-zinc-600"
          />

          <div className="max-h-64 overflow-y-auto space-y-3">
            {selectedPillar ? (
              /* Show flat list when pillar is selected */
              <div className="flex flex-wrap gap-2">
                {filteredDimensions.map(dim => (
                  <FilterButton
                    key={dim.id}
                    active={selectedDimension === dim.id}
                    onClick={() => onFilterChange('dimension', selectedDimension === dim.id ? null : dim.id)}
                  >
                    {dim.name}
                  </FilterButton>
                ))}
                {filteredDimensions.length === 0 && (
                  <p className="text-gray-500 text-sm">No dimensions match your search</p>
                )}
              </div>
            ) : (
              /* Show grouped by pillar when no pillar selected */
              Object.entries(dimensionsByPillar).map(([pillar, dims]) => (
                <div key={pillar}>
                  <button
                    onClick={() => {
                      onFilterChange('pillar', pillar);
                    }}
                    className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1 hover:text-gray-300 transition-colors"
                  >
                    {PILLAR_CONFIG[pillar]?.icon} {pillar}
                    <span className="text-gray-600">({dims.length})</span>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {dims.slice(0, 4).map(dim => (
                      <FilterButton
                        key={dim.id}
                        active={selectedDimension === dim.id}
                        onClick={() => onFilterChange('dimension', selectedDimension === dim.id ? null : dim.id)}
                      >
                        {dim.name}
                      </FilterButton>
                    ))}
                    {dims.length > 4 && (
                      <span className="text-xs text-gray-500 self-center">+{dims.length - 4} more</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FilterSection>

      {/* Type Filter */}
      <FilterSection title="Type" sectionKey="type">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={selectedType === 'article'}
            onClick={() => onFilterChange('type', selectedType === 'article' ? null : 'article')}
            count={filters.types.article}
          >
            Articles
          </FilterButton>
          <FilterButton
            active={selectedType === 'guide'}
            onClick={() => onFilterChange('type', selectedType === 'guide' ? null : 'guide')}
            count={filters.types.guide}
          >
            Guides
          </FilterButton>
        </div>
      </FilterSection>

      {/* Reading Time Filter */}
      <FilterSection title="Reading Time" sectionKey="readingTime">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={selectedReadingTime === 'quick'}
            onClick={() => onFilterChange('readingTime', selectedReadingTime === 'quick' ? null : 'quick')}
            count={filters.readingTime.quick}
          >
            Quick (&le;5 min)
          </FilterButton>
          <FilterButton
            active={selectedReadingTime === 'medium'}
            onClick={() => onFilterChange('readingTime', selectedReadingTime === 'medium' ? null : 'medium')}
            count={filters.readingTime.medium}
          >
            Medium (6-10 min)
          </FilterButton>
          <FilterButton
            active={selectedReadingTime === 'deep'}
            onClick={() => onFilterChange('readingTime', selectedReadingTime === 'deep' ? null : 'deep')}
            count={filters.readingTime.deep}
          >
            Deep (&gt;10 min)
          </FilterButton>
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-300"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-white text-black text-xs rounded-full">
                Active
              </span>
            )}
          </span>
          <span className="text-gray-500">{resultCount} results</span>
        </button>

        {/* Mobile Filter Panel */}
        {isMobileOpen && (
          <div className="mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            {filtersContent}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Filters</h3>
            <span className="text-sm text-gray-500">{resultCount} results</span>
          </div>
          {filtersContent}
        </div>
      </aside>
    </>
  );
}
