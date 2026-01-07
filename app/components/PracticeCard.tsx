'use client';

import Link from 'next/link';
import Image from 'next/image';

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

interface PracticeCardProps {
  practice: Practice;
  variant?: 'default' | 'compact' | 'featured';
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  breathwork: 'from-sky-900/60 via-sky-800/40 to-transparent',
  grounding: 'from-emerald-900/60 via-emerald-800/40 to-transparent',
  meditation: 'from-violet-900/60 via-violet-800/40 to-transparent',
  somatic: 'from-rose-900/60 via-rose-800/40 to-transparent',
  'shadow-work': 'from-slate-900/70 via-slate-800/50 to-transparent',
  'emotional-release': 'from-orange-900/60 via-orange-800/40 to-transparent',
};

const CATEGORY_PATTERNS: Record<string, React.ReactNode> = {
  breathwork: (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="breathwork-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#breathwork-pattern)" />
    </svg>
  ),
  grounding: (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grounding-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 20 L10 0 L20 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grounding-pattern)" />
    </svg>
  ),
  meditation: (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="meditation-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="15" cy="15" r="6" fill="currentColor" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#meditation-pattern)" />
    </svg>
  ),
  somatic: (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="somatic-pattern" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M12.5 0 Q25 12.5 12.5 25 Q0 12.5 12.5 0" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#somatic-pattern)" />
    </svg>
  ),
  'shadow-work': (
    <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="shadow-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="8" fill="currentColor" opacity="0.3" />
          <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#shadow-pattern)" />
    </svg>
  ),
  'emotional-release': (
    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="release-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#release-pattern)" />
    </svg>
  ),
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  breathwork: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  grounding: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  ),
  meditation: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  somatic: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'shadow-work': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  'emotional-release': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

const INTENSITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  gentle: { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-400' },
  moderate: { bg: 'bg-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-400' },
  activating: { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' },
  intense: { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-400' },
};

export default function PracticeCard({ practice, variant = 'default' }: PracticeCardProps) {
  const category = practice.metadata.category || 'meditation';
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.meditation;
  const pattern = CATEGORY_PATTERNS[category];
  const icon = CATEGORY_ICONS[category];
  const intensity = practice.metadata.intensity || 'gentle';
  const intensityStyle = INTENSITY_COLORS[intensity] || INTENSITY_COLORS.gentle;

  if (variant === 'compact') {
    return (
      <Link
        href={`/practices/${practice.slug}`}
        className="group flex items-center gap-4 p-3 bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-all"
      >
        {/* Small image placeholder */}
        <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
          <div className="text-white/60">{icon}</div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate group-hover:text-amber-400 transition-colors">
            {practice.metadata.title}
          </h4>
          <p className="text-gray-500 text-xs">{practice.metadata.durationMinutes || '?'} min</p>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/practices/${practice.slug}`}
        className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all overflow-hidden"
      >
        {/* Large hero image area */}
        <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {/* Pattern background */}
          <div className="absolute inset-0 text-white">{pattern}</div>

          {/* If practice has an image, show it */}
          {practice.metadata.image ? (
            <Image
              src={practice.metadata.image}
              alt={practice.metadata.title}
              fill
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            /* Placeholder icon */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/30 scale-[3]">{icon}</div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-sm text-white/80 text-xs uppercase tracking-wide">
              {category.replace('-', ' ')}
            </span>
          </div>

          {/* Duration */}
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-black/40 backdrop-blur-sm text-white/80 text-xs">
              {practice.metadata.durationMinutes || '?'} min
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-white text-xl font-medium mb-2 group-hover:text-amber-400 transition-colors">
            {practice.metadata.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
            {practice.metadata.description}
          </p>

          {/* Tags & Intensity */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(practice.metadata.helpssWith || practice.metadata.tags || []).slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500 rounded">
                  {tag}
                </span>
              ))}
            </div>
            {intensity && (
              <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1.5 ${intensityStyle.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${intensityStyle.dot}`} />
                <span className={intensityStyle.text}>{intensity}</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/practices/${practice.slug}`}
      className="group block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all overflow-hidden"
    >
      <div className="flex">
        {/* Image placeholder area */}
        <div className={`relative w-32 sm:w-40 shrink-0 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {/* Pattern */}
          <div className="absolute inset-0 text-white">{pattern}</div>

          {/* Image or icon placeholder */}
          {practice.metadata.image ? (
            <Image
              src={practice.metadata.image}
              alt={practice.metadata.title}
              fill
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/30 scale-150">{icon}</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5">
          {/* Category & Duration */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              {category.replace('-', ' ')}
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-500 text-xs">
              {practice.metadata.durationMinutes || '?'} min
            </span>
          </div>

          {/* Title */}
          <h3 className="text-white font-medium text-lg mb-1.5 group-hover:text-amber-400 transition-colors">
            {practice.metadata.title}
          </h3>

          {/* Description */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">
            {practice.metadata.description}
          </p>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(practice.metadata.helpssWith || practice.metadata.tags || []).slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500 rounded">
                  {tag}
                </span>
              ))}
            </div>
            {intensity && (
              <span className={`text-xs ${intensityStyle.text} hidden sm:block`}>
                {intensity}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
