'use client';

import Link from 'next/link';

const stages = [
  { name: 'Collapse', color: 'bg-red-500', description: 'Crisis & stabilization' },
  { name: 'Regulation', color: 'bg-orange-500', description: 'Nervous system work' },
  { name: 'Integration', color: 'bg-yellow-500', description: 'Shadow & pattern work' },
  { name: 'Embodiment', color: 'bg-green-500', description: 'Living the insights' },
  { name: 'Optimization', color: 'bg-blue-500', description: 'Peak performance' },
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
    <div className="space-y-8">
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
                <span className={`text-white font-medium text-sm md:text-base ${
                  isActive ? 'opacity-100' : 'opacity-50'
                }`}>
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Arrow underneath */}
        <div className="flex items-center justify-center mt-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          <span className="px-4 text-gray-500 text-sm">Development Journey</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
        </div>
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
