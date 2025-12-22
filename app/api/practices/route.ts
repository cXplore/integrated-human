import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import {
  getAllPractices,
  getPracticesByCategory,
  getPracticesByDuration,
  getRecommendedPractices,
  searchPractices,
  type PracticeCategory,
  type PracticeDuration,
} from '@/lib/practices';
import type { ArchetypeData, AttachmentData, NervousSystemData } from '@/lib/insights';

/**
 * GET /api/practices
 * List all practices with optional filtering
 *
 * Query params:
 * - category: filter by category
 * - duration: filter by duration
 * - search: search query
 * - recommended: if "true", get personalized recommendations based on user's assessments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as PracticeCategory | null;
    const duration = searchParams.get('duration') as PracticeDuration | null;
    const search = searchParams.get('search');
    const recommended = searchParams.get('recommended') === 'true';

    let practices = getAllPractices();

    // If recommended, get user's assessment data
    if (recommended) {
      const session = await auth();

      if (session?.user?.id) {
        const assessments = await prisma.assessmentResult.findMany({
          where: { userId: session.user.id },
        });

        let nervousSystemState: 'ventral' | 'sympathetic' | 'dorsal' | undefined;
        let attachmentStyle: 'anxious' | 'avoidant' | 'disorganized' | 'secure' | undefined;

        for (const assessment of assessments) {
          const results = safeJsonParse(assessment.results, {});

          if (assessment.type === 'nervous-system') {
            const ns = results as NervousSystemData;
            // Only use states that practices can target (not 'mixed')
            if (ns.state === 'ventral' || ns.state === 'sympathetic' || ns.state === 'dorsal') {
              nervousSystemState = ns.state;
            }
          }

          if (assessment.type === 'attachment') {
            const att = results as AttachmentData;
            attachmentStyle = att.style;
          }
        }

        if (nervousSystemState || attachmentStyle) {
          practices = getRecommendedPractices(nervousSystemState, attachmentStyle);
        }
      }
    }

    // Apply filters
    if (category) {
      practices = practices.filter(p => p.metadata.category === category);
    }

    if (duration) {
      practices = practices.filter(p => p.metadata.duration === duration);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      practices = practices.filter(p => {
        const searchText = [
          p.metadata.title,
          p.metadata.description,
          ...p.metadata.tags,
          ...p.metadata.helpssWith,
        ].join(' ').toLowerCase();

        return searchText.includes(searchLower);
      });
    }

    // Return without content (just metadata for listing)
    const list = practices.map(({ content, ...rest }) => rest);

    return NextResponse.json({ practices: list });
  } catch (error) {
    console.error('Error fetching practices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practices' },
      { status: 500 }
    );
  }
}
