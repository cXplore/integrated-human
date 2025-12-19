'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface BlendshapeFrame {
  time: number;
  blendshapes: Record<string, number>;
}

interface Avatar2DProps {
  imageSrc: string;
  blendshapes?: BlendshapeFrame[];
  isPlaying?: boolean;
  stance?: 'mentor' | 'challenger' | 'companion';
}

// Viseme shapes - maps Rhubarb output to mouth shapes
// We'll use CSS to morph the mouth area
const VISEME_SHAPES = {
  X: { scaleX: 1.0, scaleY: 0.3, translateY: 0 },      // Silence/closed
  A: { scaleX: 0.6, scaleY: 0.4, translateY: 0 },      // M, B, P
  B: { scaleX: 0.8, scaleY: 0.5, translateY: 1 },      // Eh sounds
  C: { scaleX: 0.9, scaleY: 0.7, translateY: 2 },      // Ah sounds (wide open)
  D: { scaleX: 0.7, scaleY: 0.6, translateY: 1 },      // Oh sounds (rounded)
  E: { scaleX: 0.5, scaleY: 0.5, translateY: 0 },      // Oo sounds (pursed)
  F: { scaleX: 0.8, scaleY: 0.3, translateY: -1 },     // F, V
  G: { scaleX: 0.7, scaleY: 0.5, translateY: 1 },      // Ee sounds
  H: { scaleX: 0.6, scaleY: 0.4, translateY: 0 },      // L sound
};

export default function Avatar2D({
  imageSrc,
  blendshapes = [],
  isPlaying = false,
  stance = 'mentor',
}: Avatar2DProps) {
  const [currentViseme, setCurrentViseme] = useState<keyof typeof VISEME_SHAPES>('X');
  const [jawOpen, setJawOpen] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [breathOffset, setBreathOffset] = useState(0);
  const animationStartRef = useRef<number>(0);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stance colors for glow effect
  const stanceColors = {
    mentor: { glow: 'rgba(59, 130, 246, 0.5)', border: 'rgba(59, 130, 246, 0.3)' },
    challenger: { glow: 'rgba(245, 158, 11, 0.5)', border: 'rgba(245, 158, 11, 0.3)' },
    companion: { glow: 'rgba(16, 185, 129, 0.5)', border: 'rgba(16, 185, 129, 0.3)' },
  };

  const color = stanceColors[stance];

  // Convert jawOpen (0-1) to viseme
  const jawOpenToViseme = useCallback((jawValue: number): keyof typeof VISEME_SHAPES => {
    if (jawValue < 0.1) return 'X';
    if (jawValue < 0.25) return 'A';
    if (jawValue < 0.4) return 'B';
    if (jawValue < 0.55) return 'G';
    if (jawValue < 0.7) return 'C';
    return 'C';
  }, []);

  // Animate blendshapes
  useEffect(() => {
    if (!isPlaying || blendshapes.length === 0) {
      setCurrentViseme('X');
      setJawOpen(0);
      return;
    }

    animationStartRef.current = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = (Date.now() - animationStartRef.current) / 1000;

      // Find current frame
      let currentJaw = 0;
      for (let i = 0; i < blendshapes.length; i++) {
        const frame = blendshapes[i];
        const nextFrame = blendshapes[i + 1];

        if (elapsed >= frame.time && (!nextFrame || elapsed < nextFrame.time)) {
          if (nextFrame) {
            // Interpolate
            const t = (elapsed - frame.time) / (nextFrame.time - frame.time);
            const curJaw = frame.blendshapes.jawOpen || 0;
            const nextJaw = nextFrame.blendshapes.jawOpen || 0;
            currentJaw = curJaw + (nextJaw - curJaw) * t;
          } else {
            currentJaw = frame.blendshapes.jawOpen || 0;
          }
          break;
        }
      }

      setJawOpen(currentJaw);
      setCurrentViseme(jawOpenToViseme(currentJaw));

      // Check if animation is complete
      const lastFrame = blendshapes[blendshapes.length - 1];
      if (elapsed < lastFrame.time + 0.1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCurrentViseme('X');
        setJawOpen(0);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [blendshapes, isPlaying, jawOpenToViseme]);

  // Random blinking
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000; // 2-6 seconds
      blinkIntervalRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkIntervalRef.current) {
        clearTimeout(blinkIntervalRef.current);
      }
    };
  }, []);

  // Breathing animation
  useEffect(() => {
    let frame: number;
    const animateBreath = () => {
      const time = Date.now() / 1000;
      setBreathOffset(Math.sin(time * 0.8) * 2);
      frame = requestAnimationFrame(animateBreath);
    };
    frame = requestAnimationFrame(animateBreath);
    return () => cancelAnimationFrame(frame);
  }, []);

  const visemeShape = VISEME_SHAPES[currentViseme];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Glow effect behind avatar */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-30 transition-colors duration-500"
        style={{
          background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Avatar container with breathing animation */}
      <div
        className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px]"
        style={{
          transform: `translateY(${breathOffset}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Main avatar image */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/10">
          <Image
            src={imageSrc}
            alt="AI Guide Avatar"
            fill
            className="object-cover object-top"
            priority
          />

          {/* Eye blink overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-75"
            style={{
              opacity: isBlinking ? 1 : 0,
              background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 45%, transparent 55%)',
            }}
          />

          {/* Mouth animation overlay - subtle darkening for open mouth */}
          <div
            className="absolute pointer-events-none transition-all duration-75"
            style={{
              left: '35%',
              right: '35%',
              top: '62%',
              height: '8%',
              background: `radial-gradient(ellipse, rgba(0,0,0,${jawOpen * 0.4}) 0%, transparent 70%)`,
              transform: `scaleX(${visemeShape.scaleX}) scaleY(${visemeShape.scaleY + jawOpen * 0.5})`,
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Subtle glow ring when speaking */}
        {isPlaying && (
          <div
            className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
            style={{
              boxShadow: `0 0 30px ${color.glow}, 0 0 60px ${color.glow}`,
              opacity: 0.3 + jawOpen * 0.3,
            }}
          />
        )}
      </div>

      {/* Speaking indicator */}
      {isPlaying && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
              style={{
                animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                transform: `scaleY(${0.5 + jawOpen * 1.5})`,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scaleY(0.5); }
          50% { opacity: 1; transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
}
