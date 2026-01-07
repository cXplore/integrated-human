'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserProfile {
  primaryIntention?: string;
  lifeSituation?: string;
  currentChallenges?: string[];
  depthPreference?: string;
}

interface ContentRecommendation {
  type: 'article' | 'course' | 'practice';
  slug: string;
  title: string;
  description: string;
  duration: string;
  href: string;
  reason: string;
}

// Map onboarding answers to specific starter content
const INTENTION_CONTENT: Record<string, ContentRecommendation[]> = {
  healing: [
    {
      type: 'article',
      slug: 'shadow-work-beginners-guide',
      title: 'Shadow Work: A Beginner\'s Guide',
      description: 'Understanding the parts of yourself you\'ve hidden away',
      duration: '12 min read',
      href: '/posts/shadow-work-beginners-guide',
      reason: 'Foundation for healing work',
    },
    {
      type: 'practice',
      slug: 'self-compassion-break',
      title: 'Self-Compassion Break',
      description: 'A gentle 3-minute practice for difficult moments',
      duration: '3 min',
      href: '/practices/self-compassion-break',
      reason: 'Immediate relief',
    },
  ],
  growth: [
    {
      type: 'article',
      slug: 'individuality-vs-personality',
      title: 'Individuality vs Personality',
      description: 'Understanding who you really are beneath the surface',
      duration: '10 min read',
      href: '/posts/individuality-vs-personality',
      reason: 'Deepens self-understanding',
    },
    {
      type: 'course',
      slug: 'shadow-work-foundations',
      title: 'Shadow Work Foundations',
      description: 'The essential starting point for inner work',
      duration: '4 hours',
      href: '/courses/shadow-work-foundations',
      reason: 'Structured growth path',
    },
  ],
  understanding: [
    {
      type: 'article',
      slug: 'understanding-your-nervous-system',
      title: 'Understanding Your Nervous System',
      description: 'Why you react the way you do',
      duration: '14 min read',
      href: '/posts/understanding-your-nervous-system',
      reason: 'Core knowledge',
    },
    {
      type: 'article',
      slug: 'anxious-attachment-signs-and-healing',
      title: 'Anxious Attachment: Signs and Healing',
      description: 'Understanding your relationship patterns',
      duration: '11 min read',
      href: '/posts/anxious-attachment-signs-and-healing',
      reason: 'Self-discovery',
    },
  ],
  crisis: [
    {
      type: 'practice',
      slug: 'physiological-sigh',
      title: 'Physiological Sigh',
      description: 'Fastest way to calm your nervous system',
      duration: '1 min',
      href: '/practices/physiological-sigh',
      reason: 'Immediate regulation',
    },
    {
      type: 'practice',
      slug: 'grounding-5-4-3-2-1',
      title: '5-4-3-2-1 Grounding',
      description: 'Come back to the present moment',
      duration: '3 min',
      href: '/practices/grounding-5-4-3-2-1',
      reason: 'Anchoring technique',
    },
    {
      type: 'course',
      slug: 'surviving-emotional-overwhelm',
      title: 'Surviving Emotional Overwhelm',
      description: 'When feelings become too much to bear',
      duration: '1.5 hours',
      href: '/courses/surviving-emotional-overwhelm',
      reason: 'Crisis support (free)',
    },
  ],
  curiosity: [
    {
      type: 'article',
      slug: 'how-to-actually-feel-your-emotions',
      title: 'How to Actually Feel Your Emotions',
      description: 'A practical guide to emotional awareness',
      duration: '9 min read',
      href: '/posts/how-to-actually-feel-your-emotions',
      reason: 'Great starting point',
    },
    {
      type: 'practice',
      slug: 'body-scan',
      title: 'Body Scan',
      description: 'Tune into what your body is telling you',
      duration: '10 min',
      href: '/practices/body-scan',
      reason: 'Foundational practice',
    },
  ],
};

// Challenge-specific recommendations
const CHALLENGE_CONTENT: Record<string, ContentRecommendation> = {
  anxiety: {
    type: 'article',
    slug: 'somatic-exercises-for-anxiety',
    title: 'Somatic Exercises for Anxiety',
    description: 'Body-based techniques that actually work',
    duration: '8 min read',
    href: '/posts/somatic-exercises-for-anxiety',
    reason: 'Addresses your anxiety',
  },
  depression: {
    type: 'course',
    slug: 'depression-a-different-approach',
    title: 'Depression: A Different Approach',
    description: 'Beyond the usual advice',
    duration: '3 hours',
    href: '/courses/depression-a-different-approach',
    reason: 'Tailored for depression',
  },
  trauma: {
    type: 'article',
    slug: 'dating-after-trauma',
    title: 'Dating After Trauma',
    description: 'Navigating relationships with a wounded past',
    duration: '12 min read',
    href: '/posts/dating-after-trauma',
    reason: 'Trauma-informed content',
  },
  relationships: {
    type: 'article',
    slug: 'why-you-choose-unavailable-partners',
    title: 'Why You Choose Unavailable Partners',
    description: 'Understanding your relationship patterns',
    duration: '10 min read',
    href: '/posts/why-you-choose-unavailable-partners',
    reason: 'Relationship insight',
  },
  'self-worth': {
    type: 'course',
    slug: 'self-worth-foundations',
    title: 'Self-Worth Foundations',
    description: 'Rebuilding your relationship with yourself',
    duration: '3 hours',
    href: '/courses/self-worth-foundations',
    reason: 'Core self-worth work',
  },
  boundaries: {
    type: 'course',
    slug: 'boundaries',
    title: 'Boundaries',
    description: 'Learning to protect your energy',
    duration: '4 hours',
    href: '/courses/boundaries',
    reason: 'Addresses boundaries',
  },
  attachment: {
    type: 'article',
    slug: 'attachment-repair-anxious-to-secure',
    title: 'Attachment Repair: Anxious to Secure',
    description: 'The path to secure attachment',
    duration: '14 min read',
    href: '/posts/attachment-repair-anxious-to-secure',
    reason: 'Attachment healing',
  },
  grief: {
    type: 'article',
    slug: 'the-shape-of-grief',
    title: 'The Shape of Grief',
    description: 'Understanding the landscape of loss',
    duration: '11 min read',
    href: '/posts/the-shape-of-grief',
    reason: 'Grief support',
  },
  loneliness: {
    type: 'course',
    slug: 'loneliness',
    title: 'Loneliness',
    description: 'From isolation to connection',
    duration: '2 hours',
    href: '/courses/loneliness',
    reason: 'Addresses loneliness',
  },
  stress: {
    type: 'practice',
    slug: 'box-breathing',
    title: 'Box Breathing',
    description: 'Simple technique for stress relief',
    duration: '4 min',
    href: '/practices/box-breathing',
    reason: 'Stress relief',
  },
  burnout: {
    type: 'article',
    slug: 'career-burnout-to-purpose',
    title: 'From Burnout to Purpose',
    description: 'Rebuilding after burning out',
    duration: '12 min read',
    href: '/posts/career-burnout-to-purpose',
    reason: 'Burnout recovery',
  },
};

export default function FirstTimeJourney() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);

          // Build personalized recommendations
          const recs: ContentRecommendation[] = [];

          // Add intention-based content (primary)
          const intention = data.primaryIntention?.toLowerCase() || 'curiosity';
          const intentionContent = INTENTION_CONTENT[intention] || INTENTION_CONTENT.curiosity;
          recs.push(...intentionContent);

          // Add challenge-based content (if they selected challenges)
          if (data.currentChallenges?.length > 0) {
            // Pick first 2 challenges
            data.currentChallenges.slice(0, 2).forEach((challenge: string) => {
              const challengeContent = CHALLENGE_CONTENT[challenge.toLowerCase()];
              if (challengeContent && !recs.find(r => r.slug === challengeContent.slug)) {
                recs.push(challengeContent);
              }
            });
          }

          // Limit to 4 recommendations
          setRecommendations(recs.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-zinc-800 rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-32 bg-zinc-800 rounded"></div>
            <div className="h-32 bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // If no recommendations (shouldn't happen), fall back to defaults
  if (recommendations.length === 0) {
    return null;
  }

  const intentionLabel = profile?.primaryIntention
    ? profile.primaryIntention.charAt(0).toUpperCase() + profile.primaryIntention.slice(1)
    : 'Your';

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-serif text-white mb-2">
          Your Starting Point
        </h2>
        <p className="text-gray-400 text-sm">
          Based on what you shared, here&apos;s where we recommend beginning your journey.
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {recommendations.map((rec, index) => (
          <Link
            key={rec.slug}
            href={rec.href}
            className="group block"
          >
            <div className={`p-4 rounded-lg border transition-all duration-200 ${
              index === 0
                ? 'bg-amber-900/20 border-amber-800/50 hover:border-amber-600/50'
                : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
            }`}>
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  rec.type === 'practice'
                    ? 'bg-emerald-900/50 text-emerald-400'
                    : rec.type === 'course'
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'bg-amber-900/50 text-amber-400'
                }`}>
                  {rec.type === 'practice' ? 'Practice' : rec.type === 'course' ? 'Course' : 'Article'}
                </span>
                <span className="text-xs text-gray-500">{rec.duration}</span>
                {index === 0 && (
                  <span className="text-xs text-amber-400 ml-auto">Recommended first</span>
                )}
              </div>

              {/* Content */}
              <h3 className="text-white font-medium mb-1 group-hover:text-gray-300 transition-colors">
                {rec.title}
              </h3>
              <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                {rec.description}
              </p>

              {/* Reason */}
              <p className="text-xs text-gray-600 italic">
                {rec.reason}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Assessment CTA */}
      <div className="pt-4 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">
              Want more personalized recommendations?
            </p>
            <p className="text-gray-500 text-xs">
              Complete the Integration Assessment for a full development profile.
            </p>
          </div>
          <Link
            href="/assessment"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm transition-colors whitespace-nowrap"
          >
            Take Assessment →
          </Link>
        </div>
      </div>
    </div>
  );
}
