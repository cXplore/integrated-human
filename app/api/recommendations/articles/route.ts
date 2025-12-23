/**
 * Article Recommendations API
 * Returns personalized article recommendations based on health, interests, and reading history
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import { getAllPosts, type Post } from '@/lib/posts';
import { getOrCreateHealth, type Pillar, type SpectrumStage } from '@/lib/integration-health';

// Map pillars to article categories/tags
const PILLAR_TO_CATEGORIES: Record<Pillar, string[]> = {
  mind: ['Psychology', 'Shadow', 'Emotions', 'Patterns', 'Inner Work', 'Mind'],
  body: ['Body', 'Nervous System', 'Embodiment', 'Somatic', 'Health', 'Movement'],
  soul: ['Soul', 'Spirituality', 'Meaning', 'Meditation', 'Presence', 'Consciousness'],
  relationships: ['Relationships', 'Attachment', 'Intimacy', 'Boundaries', 'Connection', 'Love'],
};

// Heavy topics - de-prioritize for struggling users
const HEAVY_TAGS = ['death', 'grief', 'trauma', 'suicide', 'addiction', 'abuse'];

// Stabilizing topics - prioritize for struggling users
const STABILIZING_TAGS = ['grounding', 'safety', 'regulation', 'self-compassion', 'basics', 'foundation'];

// Map interests to tags
const INTEREST_TO_TAGS: Record<string, string[]> = {
  'shadow work': ['shadow', 'shadow work', 'darkness', 'integration'],
  'nervous system': ['nervous system', 'regulation', 'vagal', 'somatic'],
  'meditation': ['meditation', 'mindfulness', 'presence', 'stillness'],
  'embodiment': ['embodiment', 'body', 'somatic', 'movement'],
  'relationships': ['relationships', 'attachment', 'intimacy', 'connection'],
  'meaning & purpose': ['meaning', 'purpose', 'calling', 'direction'],
  'archetypes': ['archetypes', 'masculine', 'feminine', 'king', 'queen', 'warrior'],
  'emotions': ['emotions', 'feelings', 'emotional intelligence', 'anger', 'grief'],
  'spirituality': ['spirituality', 'soul', 'transcendence', 'awakening'],
  'trauma healing': ['trauma', 'healing', 'ptsd', 'recovery'],
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user data
    const [profile, articleProgress] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          interests: true,
          currentChallenges: true,
          depthPreference: true,
        },
      }),
      prisma.articleProgress.findMany({
        where: { userId: session.user.id },
        select: { slug: true, completed: true, scrollProgress: true },
      }),
    ]);

    // Get health data
    let health: Awaited<ReturnType<typeof getOrCreateHealth>> | null = null;
    try {
      health = await getOrCreateHealth(session.user.id);
    } catch {
      // Continue without health data
    }

    // Parse profile
    const interests: string[] = safeJsonParse(profile?.interests, []);
    const challenges: string[] = safeJsonParse(profile?.currentChallenges, []);

    // Get reading history
    const readSlugs = new Set(articleProgress.filter(p => p.completed).map(p => p.slug));
    const inProgressSlugs = new Set(
      articleProgress.filter(p => !p.completed && p.scrollProgress > 10).map(p => p.slug)
    );

    // Get all posts
    const allPosts = getAllPosts();

    // Find lowest pillar for targeting
    let lowestPillar: Pillar | null = null;
    let inCollapse = false;
    if (health) {
      const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
      let lowestScore = 100;
      for (const pillar of pillars) {
        if (health.pillars[pillar].score < lowestScore) {
          lowestScore = health.pillars[pillar].score;
          lowestPillar = pillar;
        }
        if (health.pillars[pillar].stage === 'collapse') {
          inCollapse = true;
        }
      }
    }

    // Score each article
    const scoredArticles: Array<{
      slug: string;
      post: Post;
      score: number;
      reasons: string[];
    }> = [];

    for (const post of allPosts) {
      // Skip already completed articles
      if (readSlugs.has(post.slug)) continue;

      let score = 0;
      const reasons: string[] = [];

      const categories = post.metadata.categories || [];
      const tags = post.metadata.tags || [];
      const allTags = [...categories.map(c => c.toLowerCase()), ...tags.map(t => t.toLowerCase())];

      // Boost in-progress articles
      if (inProgressSlugs.has(post.slug)) {
        score += 30;
        reasons.push('Continue reading');
      }

      // Match interests to tags
      for (const interest of interests) {
        const relevantTags = INTEREST_TO_TAGS[interest] || [];
        if (relevantTags.some(t => allTags.includes(t.toLowerCase()))) {
          score += 15;
          if (!reasons.some(r => r.includes('interest'))) {
            reasons.push(`Matches your interests`);
          }
        }
      }

      // Health-based: boost articles for lowest pillar
      if (lowestPillar) {
        const pillarCategories = PILLAR_TO_CATEGORIES[lowestPillar].map(c => c.toLowerCase());
        if (pillarCategories.some(c => allTags.includes(c))) {
          score += 25;
          const pillarNames: Record<Pillar, string> = {
            mind: 'inner work',
            body: 'body wisdom',
            soul: 'soul connection',
            relationships: 'relationships',
          };
          reasons.push(`Supports your ${pillarNames[lowestPillar]}`);
        }
      }

      // Sensitivity filtering
      const hasHeavyContent = HEAVY_TAGS.some(t => allTags.includes(t));
      const hasStabilizingContent = STABILIZING_TAGS.some(t => allTags.includes(t));
      const hasLivedExperience = challenges.some(c =>
        ['trauma', 'grief', 'addiction', 'depression'].includes(c)
      );

      if (inCollapse) {
        // Strongly boost stabilizing content
        if (hasStabilizingContent) {
          score += 20;
          if (!reasons.includes('Grounding content')) {
            reasons.push('Grounding content');
          }
        }
        // De-prioritize heavy content unless lived experience
        if (hasHeavyContent && !hasLivedExperience) {
          score -= 30;
        }
      }

      // Boost foundational articles for new users
      if (allTags.includes('foundation') || allTags.includes('basics') || allTags.includes('introduction')) {
        if (readSlugs.size < 5) {
          score += 10;
          reasons.push('Good starting point');
        }
      }

      // Only include if has some relevance
      if (score > 0) {
        scoredArticles.push({ slug: post.slug, post, score, reasons });
      }
    }

    // Sort by score
    scoredArticles.sort((a, b) => b.score - a.score);

    // Take top 6
    const recommendations = scoredArticles.slice(0, 6).map(({ slug, post, reasons }) => ({
      slug,
      title: post.metadata.title,
      excerpt: post.metadata.excerpt,
      categories: post.metadata.categories,
      readingTime: post.readingTime,
      reasons: reasons.slice(0, 2),
      inProgress: inProgressSlugs.has(slug),
    }));

    // Fill with popular/recent if not enough
    if (recommendations.length < 3) {
      const recentPosts = allPosts
        .filter(p => !readSlugs.has(p.slug) && !recommendations.some(r => r.slug === p.slug))
        .slice(0, 6 - recommendations.length);

      for (const post of recentPosts) {
        recommendations.push({
          slug: post.slug,
          title: post.metadata.title,
          excerpt: post.metadata.excerpt,
          categories: post.metadata.categories,
          readingTime: post.readingTime,
          reasons: ['Recently published'],
          inProgress: false,
        });
      }
    }

    return NextResponse.json({
      recommendations,
      health: health ? {
        lowestPillar,
        inCollapse,
      } : null,
    });
  } catch (error) {
    console.error('Error generating article recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
