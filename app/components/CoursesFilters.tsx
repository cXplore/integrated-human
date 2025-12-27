'use client';

import { useState } from 'react';

interface FilterCounts {
  categories: Record<string, number>;
  tiers: Record<string, number>;
  spectrum: Record<string, number>;
  levels: Record<string, number>;
}

interface CoursesFiltersProps {
  filters: FilterCounts;
  selectedCategory: string | null;
  selectedTier: string | null;
  selectedSpectrum: string | null;
  selectedLevel: string | null;
  onFilterChange: (key: string, value: string | null) => void;
  onClearAll: () => void;
  resultCount: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  mind: '🧠',
  body: '💪',
  soul: '✨',
  relationships: '💞',
};

const TIER_LABELS: Record<string, string> = {
  intro: 'Intro',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  flagship: 'Flagship',
};

const SPECTRUM_LABELS: Record<string, string> = {
  collapse: 'Collapse',
  regulation: 'Regulation',
  integration: 'Integration',
  embodiment: 'Embodiment',
  optimization: 'Optimization',
};

export default function CoursesFilters({
  filters,
  selectedCategory,
  selectedTier,
  selectedSpectrum,
  selectedLevel,
  onFilterChange,
  onClearAll,
  resultCount,
}: CoursesFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('category');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const hasActiveFilters = selectedCategory || selectedTier || selectedSpectrum || selectedLevel;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const FilterSection = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        {title}
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
        <span className={`ml-1.5 ${active ? 'text-gray-600' : 'text-gray-500'}`}>
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
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {CATEGORY_ICONS[selectedCategory]} {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                <button
                  onClick={() => onFilterChange('category', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedTier && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {TIER_LABELS[selectedTier] || selectedTier}
                <button
                  onClick={() => onFilterChange('tier', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedSpectrum && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {SPECTRUM_LABELS[selectedSpectrum] || selectedSpectrum}
                <button
                  onClick={() => onFilterChange('spectrum', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedLevel && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-sm text-gray-300 rounded">
                {selectedLevel}
                <button
                  onClick={() => onFilterChange('level', null)}
                  className="ml-1 text-gray-500 hover:text-white"
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <FilterSection title="Category" sectionKey="category">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters.categories).map(([category, count]) => (
            <FilterButton
              key={category}
              active={selectedCategory === category}
              onClick={() => onFilterChange('category', selectedCategory === category ? null : category)}
              count={count}
            >
              {CATEGORY_ICONS[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
            </FilterButton>
          ))}
        </div>
      </FilterSection>

      {/* Tier Filter */}
      <FilterSection title="Tier" sectionKey="tier">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters.tiers).map(([tier, count]) => (
            <FilterButton
              key={tier}
              active={selectedTier === tier}
              onClick={() => onFilterChange('tier', selectedTier === tier ? null : tier)}
              count={count}
            >
              {TIER_LABELS[tier] || tier}
            </FilterButton>
          ))}
        </div>
      </FilterSection>

      {/* Spectrum Filter */}
      <FilterSection title="Spectrum Stage" sectionKey="spectrum">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters.spectrum).map(([stage, count]) => (
            <FilterButton
              key={stage}
              active={selectedSpectrum === stage}
              onClick={() => onFilterChange('spectrum', selectedSpectrum === stage ? null : stage)}
              count={count}
            >
              {SPECTRUM_LABELS[stage] || stage}
            </FilterButton>
          ))}
        </div>
      </FilterSection>

      {/* Level Filter */}
      <FilterSection title="Level" sectionKey="level">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters.levels).map(([level, count]) => (
            <FilterButton
              key={level}
              active={selectedLevel === level}
              onClick={() => onFilterChange('level', selectedLevel === level ? null : level)}
              count={count}
            >
              {level}
            </FilterButton>
          ))}
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
          <span className="text-gray-500">{resultCount} courses</span>
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
            <span className="text-sm text-gray-500">{resultCount} courses</span>
          </div>
          {filtersContent}
        </div>
      </aside>
    </>
  );
}
