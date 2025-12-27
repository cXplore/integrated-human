/**
 * Courses API - Paginated and filtered course retrieval
 *
 * GET /api/courses
 *   ?page=1              - Page number (default: 1)
 *   ?limit=18            - Courses per page (default: 18)
 *   ?category=mind       - Filter by category (Mind, Body, Soul, Relationships)
 *   ?tier=beginner       - Filter by tier (intro, beginner, intermediate, advanced, flagship)
 *   ?spectrum=regulation - Filter by spectrum stage
 *   ?level=Beginner      - Filter by level
 *   ?search=anxiety      - Search term
 *   ?sort=title|newest   - Sort order (default: title)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses, type Course, type SpectrumStage } from '@/lib/courses';

// Search function for courses
function searchCourses(courses: Course[], query: string): Course[] {
  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  if (searchTerms.length === 0 || searchTerms[0] === '') {
    return courses;
  }

  const scoredCourses = courses.map((course) => {
    let score = 0;
    const title = course.metadata.title.toLowerCase();
    const subtitle = course.metadata.subtitle?.toLowerCase() || '';
    const description = course.metadata.description.toLowerCase();
    const category = course.metadata.category.toLowerCase();
    const tags = (course.metadata.tags || []).map(t => t.toLowerCase());

    searchTerms.forEach((term) => {
      if (title.includes(term)) score += 10;
      if (category.includes(term)) score += 8;
      if (tags.some(t => t.includes(term))) score += 6;
      if (subtitle.includes(term)) score += 4;
      if (description.includes(term)) score += 2;
    });

    return { course, score };
  });

  return scoredCourses
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ course }) => course);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '18');
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const spectrum = searchParams.get('spectrum') as SpectrumStage | null;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'title';

    // Get all courses
    let courses = getAllCourses();

    // Apply search first
    if (search) {
      courses = searchCourses(courses, search);
    }

    // Apply filters
    if (category) {
      const categoryLower = category.toLowerCase();
      courses = courses.filter(c => c.metadata.category.toLowerCase() === categoryLower);
    }

    if (tier) {
      courses = courses.filter(c => c.metadata.tier === tier);
    }

    if (spectrum) {
      courses = courses.filter(c => c.metadata.spectrum?.includes(spectrum));
    }

    if (level) {
      courses = courses.filter(c => c.metadata.level.toLowerCase() === level.toLowerCase());
    }

    // Sort
    if (sort === 'newest' && !search) {
      courses = [...courses].sort((a, b) => {
        const dateA = a.metadata.createdAt ? new Date(a.metadata.createdAt).getTime() : 0;
        const dateB = b.metadata.createdAt ? new Date(b.metadata.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sort === 'title' && !search) {
      // Already sorted by title from getAllCourses
    }
    // If search is active, keep relevance order

    // Calculate pagination
    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCourses = courses.slice(offset, offset + limit);

    // Get filter options metadata from all courses
    const allCourses = getAllCourses();

    // Category counts
    const categoryCounts: Record<string, number> = {};
    allCourses.forEach(c => {
      const cat = c.metadata.category.toLowerCase();
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Tier counts
    const tierCounts: Record<string, number> = {};
    allCourses.forEach(c => {
      const t = c.metadata.tier;
      tierCounts[t] = (tierCounts[t] || 0) + 1;
    });

    // Spectrum counts
    const spectrumCounts: Record<string, number> = {};
    allCourses.forEach(c => {
      c.metadata.spectrum?.forEach(s => {
        spectrumCounts[s] = (spectrumCounts[s] || 0) + 1;
      });
    });

    // Level counts
    const levelCounts: Record<string, number> = {};
    allCourses.forEach(c => {
      const l = c.metadata.level;
      levelCounts[l] = (levelCounts[l] || 0) + 1;
    });

    // Serialize courses
    const serializedCourses = paginatedCourses.map(c => ({
      slug: c.slug,
      title: c.metadata.title,
      subtitle: c.metadata.subtitle,
      description: c.metadata.description,
      category: c.metadata.category,
      tier: c.metadata.tier,
      level: c.metadata.level,
      duration: c.metadata.duration,
      spectrum: c.metadata.spectrum || [],
      tags: c.metadata.tags || [],
      moduleCount: c.metadata.modules.length,
      image: c.metadata.image,
    }));

    return NextResponse.json({
      courses: serializedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        categories: categoryCounts,
        tiers: tierCounts,
        spectrum: spectrumCounts,
        levels: levelCounts,
      },
    });
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
