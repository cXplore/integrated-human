'use client';

import { useEffect, useRef } from 'react';
import type { Stance } from '@/lib/presence';

interface GuideAvatarProps {
  stance: Stance;
  isSpeaking: boolean;
  imageSrc?: string;
}

/**
 * Animated Guide Avatar
 *
 * Simple, elegant avatar with CSS animations:
 * - Breathing animation (subtle scale pulse)
 * - Speaking glow effect
 * - Stance-based color theming
 */
export default function GuideAvatar({
  stance,
  isSpeaking,
  imageSrc = '/images/guide-avatar-front.png',
}: GuideAvatarProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Stance colors
  const stanceColors = {
    mirror: { glow: 'rgba(168, 85, 247, 0.4)', accent: '#a855f7' },
    companion: { glow: 'rgba(59, 130, 246, 0.4)', accent: '#3b82f6' },
    guide: { glow: 'rgba(245, 158, 11, 0.4)', accent: '#f59e0b' },
    anchor: { glow: 'rgba(16, 185, 129, 0.4)', accent: '#10b981' },
  };

  const colors = stanceColors[stance];

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow behind avatar */}
      <div
        className="absolute inset-0 blur-3xl opacity-50 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${colors.glow} 0%, transparent 70%)`,
          opacity: isSpeaking ? 0.7 : 0.4,
        }}
      />

      {/* Avatar container */}
      <div
        className="relative w-[70vw] h-[50vh] sm:w-[50vw] sm:h-[55vh] max-w-md overflow-hidden"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 60%, transparent 100%)',
        }}
      >
        {/* Avatar image with animations */}
        <img
          src={imageSrc}
          alt="Guide Avatar"
          className="w-full h-full object-cover object-top transition-all duration-300"
          style={{
            animation: isSpeaking
              ? 'speaking 0.15s ease-in-out infinite alternate'
              : 'breathing 4s ease-in-out infinite',
            filter: `brightness(${isSpeaking ? 1.05 : 1}) saturate(${isSpeaking ? 1.1 : 1})`,
          }}
        />

        {/* Speaking pulse overlay */}
        {isSpeaking && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${colors.glow} 0%, transparent 50%)`,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Floating particles when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: colors.accent,
                left: `${30 + i * 12}%`,
                bottom: '20%',
                animation: `float ${2 + i * 0.5}s ease-out infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }

        @keyframes speaking {
          0% { transform: scale(1) translateY(0); }
          100% { transform: scale(1.005) translateY(-1px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        @keyframes float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% {
            transform: translateY(-60px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
