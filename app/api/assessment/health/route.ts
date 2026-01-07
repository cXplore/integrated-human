/**
 * Assessment Health API
 *
 * Fetches user's dimension health scores for learning path generation
 * and integration health display.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Dimension display names
const DIMENSION_NAMES: Record<string, string> = {
  // Mind
  'emotional-awareness': 'Emotional Awareness',
  'cognitive-flexibility': 'Cognitive Flexibility',
  'self-reflection': 'Self-Reflection',
  'mental-clarity': 'Mental Clarity',
  'growth-mindset': 'Growth Mindset',
  'stress-management': 'Stress Management',
  'focus-attention': 'Focus & Attention',

  // Body
  'body-awareness': 'Body Awareness',
  'sleep-recovery': 'Sleep & Recovery',
  'movement-exercise': 'Movement & Exercise',
  'nutrition-nourishment': 'Nutrition',
  'energy-vitality': 'Energy & Vitality',
  'nervous-system': 'Nervous System Regulation',
  'physical-health': 'Physical Health',

  // Soul
  'purpose-meaning': 'Purpose & Meaning',
  'values-alignment': 'Values Alignment',
  'spiritual-connection': 'Spiritual Connection',
  'creativity-expression': 'Creative Expression',
  'presence-mindfulness': 'Presence & Mindfulness',
  'inner-peace': 'Inner Peace',
  'authenticity': 'Authenticity',

  // Relationships
  'attachment-security': 'Attachment Security',
  'communication': 'Communication',
  'boundaries': 'Boundaries',
  'intimacy-vulnerability': 'Intimacy & Vulnerability',
  'conflict-resolution': 'Conflict Resolution',
  'social-connection': 'Social Connection',
  'self-relationship': 'Relationship with Self',
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch dimension health records
    const dimensionHealth = await prisma.dimensionHealth.findMany({
      where: { userId: session.user.id },
      orderBy: { verifiedAt: 'desc' },
    });

    // Also fetch pillar health for overall stage info
    const pillarHealth = await prisma.pillarHealth.findMany({
      where: { userId: session.user.id },
    });

    // Transform dimension health data
    const dimensions = dimensionHealth.map(d => ({
      pillarId: d.pillarId,
      dimensionId: d.dimensionId,
      dimensionName: DIMENSION_NAMES[d.dimensionId] || formatDimensionName(d.dimensionId),
      score: d.verifiedScore,
      stage: d.verifiedStage,
      verifiedAt: d.verifiedAt,
    }));

    // Calculate pillar summaries
    const pillars = pillarHealth.map(p => ({
      pillarId: p.pillar,
      stage: p.stage,
      trend: p.trend,
      dimensions: JSON.parse(p.dimensions || '{}'),
      lastUpdated: p.createdAt,
    }));

    // Calculate overall health score
    const overallScore = dimensions.length > 0
      ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
      : 0;

    // Find growth edges (lowest scoring dimensions)
    const growthEdges = [...dimensions]
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    // Find strengths (highest scoring dimensions)
    const strengths = [...dimensions]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({
      dimensions,
      pillars,
      overallScore,
      growthEdges,
      strengths,
      hasData: dimensions.length > 0,
      lastAssessmentAt: dimensionHealth[0]?.verifiedAt || null,
    });
  } catch (error) {
    console.error('Assessment health GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment health' },
      { status: 500 }
    );
  }
}

// Helper to format dimension ID to display name
function formatDimensionName(dimensionId: string): string {
  return dimensionId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
