'use client';

import Link from 'next/link';

const stages = [
  { name: 'Collapse', color: 'bg-zinc-800/80', description: 'Crisis & stabilization' },
  { name: 'Regulation', color: 'bg-zinc-700/70', description: 'Nervous system work' },
  { name: 'Integration', color: 'bg-zinc-600/60', description: 'Shadow & pattern work' },
  { name: 'Embodiment', color: 'bg-zinc-500/50', description: 'Living the insights' },
  { name: 'Optimization', color: 'bg-zinc-400/40', description: 'Peak performance' },
];

interface SpectrumVisualProps {
  variant?: 'full' | 'compact';
  activeStages?: string[];
  showLabels?: boolean;
  showLink?: boolean;
}

export default function SpectrumVisual({
  variant = 'full',
  activeStages,
  showLabels = true,
  showLink = false
}: SpectrumVisualProps) {
  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        {/* Compact bar visualization */}
        <div className="flex items-center gap-1">
          {stages.map((stage, index) => {
            const isActive = activeStages ? activeStages.includes(stage.name.toLowerCase()) : true;
            return (
              <div
                key={stage.name}
                className={`h-2 flex-1 rounded-full transition-all ${stage.color} ${
                  isActive ? 'opacity-100' : 'opacity-20'
                }`}
                title={stage.name}
              />
            );
          })}
        </div>
        {showLabels && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Crisis</span>
            <span>Growth</span>
            <span>Mastery</span>
          </div>
        )}
        {showLink && (
          <Link
            href="/transparency/methodology"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Learn about our Development Spectrum →
          </Link>
        )}
      </div>
    );
  }

  // Full visualization
  return (
    <div className="space-y-6">
      {/* Acceptance label above */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-zinc-700/50" />
        <span className="text-gray-500 text-xs uppercase tracking-wider">Acceptance</span>
        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-zinc-700/50" />
      </div>

      {/* Main spectrum bar */}
      <div className="relative">
        <div className="flex items-stretch gap-1 h-16 md:h-20">
          {stages.map((stage, index) => {
            const isActive = activeStages ? activeStages.includes(stage.name.toLowerCase()) : true;
            return (
              <div
                key={stage.name}
                className={`flex-1 rounded-lg ${stage.color} ${
                  isActive ? 'opacity-100' : 'opacity-30'
                } transition-all flex items-center justify-center group relative`}
              >
                <span className={`font-medium text-sm md:text-base text-gray-300 ${
                  isActive ? 'opacity-100' : 'opacity-50'
                }`}>
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avoidance label below */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-zinc-700/50" />
        <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-gray-600 text-xs uppercase tracking-wider">Avoidance</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-zinc-700/50" />
      </div>

      {/* Journey label */}
      <div className="flex items-center justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        <span className="px-4 text-gray-600 text-xs">Development Journey</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      {/* Stage descriptions */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {stages.map((stage) => {
          const isActive = activeStages ? activeStages.includes(stage.name.toLowerCase()) : true;
          return (
            <div
              key={stage.name}
              className={`text-xs ${isActive ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {stage.description}
            </div>
          );
        })}
      </div>

      {/* Key insight */}
      <div className="text-center">
        <p className="text-gray-500 text-sm italic">
          We meet you where you are—not where you think you should be.
        </p>
      </div>

      {showLink && (
        <div className="text-center">
          <Link
            href="/transparency/methodology"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Learn more about the Development Spectrum →
          </Link>
        </div>
      )}
    </div>
  );
}
