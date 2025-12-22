import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/sanitize';
import {
  generateInsights,
  type ArchetypeData,
  type AttachmentData,
  type NervousSystemData,
} from '@/lib/insights';

/**
 * GET /api/insights
 * Returns personalized cross-assessment insights for the current user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all assessment results
    const assessments = await prisma.assessmentResult.findMany({
      where: { userId },
    });

    // Parse results into typed data
    let archetypeData: ArchetypeData | undefined;
    let attachmentData: AttachmentData | undefined;
    let nervousSystemData: NervousSystemData | undefined;

    for (const assessment of assessments) {
      const results = safeJsonParse(assessment.results, {});

      switch (assessment.type) {
        case 'archetype':
          archetypeData = results as ArchetypeData;
          break;
        case 'attachment':
          attachmentData = results as AttachmentData;
          break;
        case 'nervous-system':
          nervousSystemData = results as NervousSystemData;
          break;
      }
    }

    // Count completed assessments
    const completedCount = [archetypeData, attachmentData, nervousSystemData].filter(Boolean).length;

    if (completedCount < 2) {
      return NextResponse.json({
        hasEnoughData: false,
        completedCount,
        missing: {
          archetype: !archetypeData,
          attachment: !attachmentData,
          nervousSystem: !nervousSystemData,
        },
        message: 'Complete at least 2 assessments to receive personalized insights.',
      });
    }

    // Generate insights
    const insights = generateInsights(archetypeData, attachmentData, nervousSystemData);

    return NextResponse.json({
      hasEnoughData: true,
      completedCount,
      assessments: {
        archetype: archetypeData ? {
          primaryArchetype: archetypeData.primaryArchetype,
          secondaryArchetype: archetypeData.secondaryArchetype,
          isWounded: archetypeData.isWounded,
          isIntegrated: archetypeData.isIntegrated,
        } : null,
        attachment: attachmentData ? {
          style: attachmentData.style,
          styleName: attachmentData.styleName,
        } : null,
        nervousSystem: nervousSystemData ? {
          state: nervousSystemData.state,
          stateName: nervousSystemData.stateName,
        } : null,
      },
      insights,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
