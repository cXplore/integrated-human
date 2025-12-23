/**
 * Learning Paths API
 * Returns curated learning paths with personalization based on health state
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAllPaths,
  getRecommendedPaths,
  getPathsByPillar,
  type LearningPath,
} from '@/lib/learning-paths';
import { getOrCreateHealth, type Pillar, type SpectrumStage } from '@/lib/integration-health';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pillarFilter = searchParams.get('pillar') as Pillar | null;
  const personalized = searchParams.get('personalized') === 'true';

  const session = await auth();

  try {
    let paths: LearningPath[];
    let healthContext: {
      lowestPillar: Pillar;
      stage: SpectrumStage;
    } | null = null;

    // If personalized and user is logged in, get recommendations
    if (personalized && session?.user?.id) {
      const health = await getOrCreateHealth(session.user.id).catch(() => null);

      if (health) {
        // Find lowest pillar
        const pillars: Pillar[] = ['mind', 'body', 'soul', 'relationships'];
        let lowestPillar: Pillar = 'mind';
        let lowestScore = 100;

        for (const pillar of pillars) {
          if (health.pillars[pillar].score < lowestScore) {
            lowestScore = health.pillars[pillar].score;
            lowestPillar = pillar;
          }
        }

        healthContext = {
          lowestPillar,
          stage: health.overall.stage,
        };

        paths = getRecommendedPaths(lowestPillar, health.overall.stage, 4);
      } else {
        paths = getAllPaths();
      }
    } else if (pillarFilter) {
      paths = getPathsByPillar(pillarFilter);
    } else {
      paths = getAllPaths();
    }

    // Get user's path progress if logged in
    let pathProgress: Record<string, { completed: number; total: number }> = {};

    if (session?.user?.id) {
      // For each path, count completed steps
      for (const path of paths) {
        let completed = 0;
        const total = path.steps.filter((s) => s.type !== 'milestone').length;

        for (const step of path.steps) {
          if (step.type === 'course') {
            const progress = await prisma.courseProgress.findMany({
              where: { userId: session.user.id, courseSlug: step.slug },
              select: { completed: true },
            });
            if (progress.length > 0 && progress.every((p) => p.completed)) {
              completed++;
            }
          } else if (step.type === 'article') {
            const progress = await prisma.articleProgress.findFirst({
              where: { userId: session.user.id, slug: step.slug, completed: true },
            });
            if (progress) {
              completed++;
            }
          } else if (step.type === 'assessment') {
            const result = await prisma.assessmentResult.findFirst({
              where: { userId: session.user.id, type: step.slug },
            });
            if (result) {
              completed++;
            }
          } else if (step.type === 'practice') {
            // Check if user has done this practice via check-in
            const checkIn = await prisma.integrationCheckIn.findFirst({
              where: { userId: session.user.id, relatedSlug: step.slug },
            });
            if (checkIn) {
              completed++;
            }
          }
        }

        pathProgress[path.id] = { completed, total };
      }
    }

    return NextResponse.json({
      paths: paths.map((path) => ({
        ...path,
        progress: pathProgress[path.id] || null,
      })),
      healthContext,
      total: paths.length,
    });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return NextResponse.json({ error: 'Failed to fetch paths' }, { status: 500 });
  }
}
