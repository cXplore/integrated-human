/**
 * Posts API - Paginated and filtered post retrieval
 *
 * GET /api/posts
 *   ?page=1          - Page number (default: 1)
 *   ?limit=20        - Posts per page (default: 20)
 *   ?pillar=mind     - Filter by pillar (Mind, Body, Soul, Relationships)
 *   ?dimension=x     - Filter by dimension ID
 *   ?type=guide      - Filter by type (article, guide)
 *   ?readingTime=quick|medium|deep - Filter by reading time
 *   ?tag=meditation  - Filter by tag
 *   ?search=query    - Search term
 *   ?sort=date|title - Sort order (default: date)
 *   ?slugs=a,b,c     - Get specific posts by slug (legacy support)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, getPostBySlug, searchPosts, type Post } from '@/lib/posts';
import { DIMENSION_CONTENT_MAP } from '@/lib/assessment/content-mapping';

// Dimension name lookup
const DIMENSION_NAMES: Record<string, string> = {
  // Mind
  'emotional-regulation': 'Emotional Regulation',
  'cognitive-flexibility': 'Cognitive Flexibility',
  'self-awareness': 'Self-Awareness',
  'present-moment': 'Present Moment',
  'thought-patterns': 'Thought Patterns',
  'psychological-safety': 'Psychological Safety',
  'self-relationship': 'Self-Relationship',
  'meaning-purpose': 'Meaning & Purpose',
  // Body
  'interoception': 'Interoceptive Awareness',
  'stress-physiology': 'Stress Physiology',
  'sleep-restoration': 'Sleep & Restoration',
  'energy-vitality': 'Energy & Vitality',
  'movement-capacity': 'Movement Capacity',
  'nourishment': 'Nourishment',
  'embodied-presence': 'Embodied Presence',
  // Soul
  'authenticity': 'Authenticity',
  'existential-grounding': 'Existential Grounding',
  'transcendence': 'Transcendence',
  'shadow-integration': 'Shadow Integration',
  'creative-expression': 'Creative Expression',
  'life-engagement': 'Life Engagement',
  'inner-wisdom': 'Inner Wisdom',
  'spiritual-practice': 'Spiritual Practice',
  // Relationships
  'attachment-patterns': 'Attachment Patterns',
  'communication': 'Communication',
  'boundaries': 'Boundaries',
  'conflict-repair': 'Conflict & Repair',
  'trust-vulnerability': 'Trust & Vulnerability',
  'empathy-attunement': 'Empathy & Attunement',
  'intimacy-depth': 'Intimacy & Depth',
  'social-connection': 'Social Connection',
  'relational-patterns': 'Relational Patterns',
};

// Get all dimension options for filters
function getDimensionOptions() {
  const dimensions: { id: string; name: string; pillar: string }[] = [];

  for (const [pillarId, dims] of Object.entries(DIMENSION_CONTENT_MAP)) {
    for (const dimId of Object.keys(dims)) {
      dimensions.push({
        id: dimId,
        name: DIMENSION_NAMES[dimId] || dimId,
        pillar: pillarId,
      });
    }
  }

  return dimensions;
}

// Check if a post matches a dimension (by slug or related tags)
function postMatchesDimension(post: Post, dimensionId: string): boolean {
  for (const [, dims] of Object.entries(DIMENSION_CONTENT_MAP)) {
    const dimContent = dims[dimensionId];
    if (dimContent) {
      // Check if post slug is in the dimension's articles
      if (dimContent.articles.includes(post.slug)) {
        return true;
      }
      // Also check by tag matching (looser match)
      const dimTags = dimensionId.split('-');
      if (post.metadata.tags.some(t => dimTags.some(dt => t.toLowerCase().includes(dt)))) {
        return true;
      }
    }
  }
  return false;
}

// Reading time brackets
function getReadingTimeBracket(minutes: number): 'quick' | 'medium' | 'deep' {
  if (minutes <= 5) return 'quick';
  if (minutes <= 10) return 'medium';
  return 'deep';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Legacy support: specific slugs
    const slugsParam = searchParams.get('slugs');
    if (slugsParam) {
      const slugs = slugsParam.split(',').filter(Boolean);
      const posts = slugs
        .map((slug) => {
          const post = getPostBySlug(slug);
          if (!post) return null;
          return {
            slug: post.slug,
            title: post.metadata.title,
            excerpt: post.metadata.excerpt,
            categories: post.metadata.categories,
            readingTime: post.readingTime,
          };
        })
        .filter(Boolean);

      return NextResponse.json({ posts });
    }

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const pillar = searchParams.get('pillar');
    const dimension = searchParams.get('dimension');
    const type = searchParams.get('type');
    const readingTime = searchParams.get('readingTime') as 'quick' | 'medium' | 'deep' | null;
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'date';

    // Get posts - use search if query provided
    let posts = search ? searchPosts(search) : getAllPosts();

    // Apply filters
    if (pillar) {
      const pillarCapitalized = pillar.charAt(0).toUpperCase() + pillar.slice(1);
      posts = posts.filter(p => p.metadata.categories.includes(pillarCapitalized));
    }

    if (dimension) {
      posts = posts.filter(p => postMatchesDimension(p, dimension));
    }

    if (type) {
      if (type === 'guide') {
        posts = posts.filter(p => p.metadata.type === 'guide');
      } else {
        posts = posts.filter(p => p.metadata.type !== 'guide');
      }
    }

    if (readingTime) {
      posts = posts.filter(p => getReadingTimeBracket(p.readingTime) === readingTime);
    }

    if (tag) {
      posts = posts.filter(p => p.metadata.tags.includes(tag));
    }

    // Sort
    if (sort === 'title') {
      posts = [...posts].sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));
    }
    // Default is already sorted by date from getAllPosts

    // Calculate pagination
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPosts = posts.slice(offset, offset + limit);

    // Get filter options metadata
    const allPosts = getAllPosts();
    const filterCounts = {
      pillars: {
        mind: allPosts.filter(p => p.metadata.categories.includes('Mind')).length,
        body: allPosts.filter(p => p.metadata.categories.includes('Body')).length,
        soul: allPosts.filter(p => p.metadata.categories.includes('Soul')).length,
        relationships: allPosts.filter(p => p.metadata.categories.includes('Relationships')).length,
      },
      types: {
        article: allPosts.filter(p => p.metadata.type !== 'guide').length,
        guide: allPosts.filter(p => p.metadata.type === 'guide').length,
      },
      readingTime: {
        quick: allPosts.filter(p => p.readingTime <= 5).length,
        medium: allPosts.filter(p => p.readingTime > 5 && p.readingTime <= 10).length,
        deep: allPosts.filter(p => p.readingTime > 10).length,
      },
    };

    // Serialize posts (exclude full content for performance)
    const serializedPosts = paginatedPosts.map(p => ({
      slug: p.slug,
      title: p.metadata.title,
      excerpt: p.metadata.excerpt,
      categories: p.metadata.categories,
      tags: p.metadata.tags,
      date: p.metadata.date,
      type: p.metadata.type || 'article',
      series: p.metadata.series,
      image: p.metadata.image,
      readingTime: p.readingTime,
    }));

    return NextResponse.json({
      posts: serializedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: filterCounts,
      dimensions: getDimensionOptions(),
    });
  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
