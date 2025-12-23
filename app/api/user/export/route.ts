/**
 * Data Export API
 * Exports all user data in JSON format for GDPR compliance and data portability
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Fetch all user data in parallel
    const [
      user,
      profile,
      journalEntries,
      dreamEntries,
      assessments,
      articleProgress,
      courseProgress,
      purchases,
      quickCheckIns,
      integrationCheckIns,
      exerciseResponses,
      aiCredits,
      aiUsage,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dreamEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assessmentResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.articleProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.courseProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.purchase.findMany({
        where: { userId },
        orderBy: { purchasedAt: 'desc' },
      }),
      prisma.quickCheckIn.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.integrationCheckIn.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exerciseResponse.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aICredits.findUnique({
        where: { userId },
      }),
      prisma.aIUsage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100, // Last 100 AI usage records
      }),
    ]);

    // Build export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        ...user,
        profile: profile ? {
          primaryIntention: profile.primaryIntention,
          lifeSituation: profile.lifeSituation,
          interests: profile.interests,
          currentChallenges: profile.currentChallenges,
          depthPreference: profile.depthPreference,
          experienceLevels: profile.experienceLevels,
          hasAwakeningExperience: profile.hasAwakeningExperience,
          onboardingCompleted: profile.onboardingCompleted,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        } : null,
      },
      journal: {
        count: journalEntries.length,
        entries: journalEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          tags: entry.tags,
          promptId: entry.promptId,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
      },
      dreams: {
        count: dreamEntries.length,
        entries: dreamEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          lucid: entry.lucid,
          recurring: entry.recurring,
          emotions: entry.emotions,
          symbols: entry.symbols,
          interpretation: entry.interpretation,
          dreamDate: entry.dreamDate,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
      },
      assessments: {
        count: assessments.length,
        results: assessments.map(a => ({
          id: a.id,
          type: a.type,
          results: a.results,
          createdAt: a.createdAt,
        })),
      },
      progress: {
        articles: {
          count: articleProgress.length,
          items: articleProgress.map(p => ({
            slug: p.slug,
            completed: p.completed,
            completedAt: p.completedAt,
            scrollProgress: p.scrollProgress,
            lastReadAt: p.lastReadAt,
            updatedAt: p.updatedAt,
          })),
        },
        courses: {
          count: courseProgress.length,
          items: courseProgress.map(p => ({
            courseSlug: p.courseSlug,
            moduleSlug: p.moduleSlug,
            completed: p.completed,
            completedAt: p.completedAt,
            updatedAt: p.updatedAt,
          })),
        },
        exercises: {
          count: exerciseResponses.length,
          items: exerciseResponses.map(e => ({
            exerciseId: e.exerciseId,
            courseSlug: e.courseSlug,
            moduleSlug: e.moduleSlug,
            type: e.type,
            value: e.value,
            createdAt: e.createdAt,
          })),
        },
      },
      checkIns: {
        quick: quickCheckIns.map(c => ({
          id: c.id,
          mood: c.mood,
          energy: c.energy,
          note: c.note,
          pillarFocus: c.pillarFocus,
          createdAt: c.createdAt,
        })),
        integration: integrationCheckIns.map(c => ({
          id: c.id,
          type: c.type,
          promptType: c.promptType,
          response: c.response,
          relatedSlug: c.relatedSlug,
          createdAt: c.createdAt,
        })),
      },
      purchases: purchases.map(p => ({
        id: p.id,
        courseSlug: p.courseSlug,
        amount: p.amount,
        status: p.status,
        purchasedAt: p.purchasedAt,
      })),
      ai: {
        credits: aiCredits ? {
          tokenBalance: aiCredits.tokenBalance,
          monthlyTokens: aiCredits.monthlyTokens,
          monthlyUsed: aiCredits.monthlyUsed,
          purchasedTokens: aiCredits.purchasedTokens,
          lastMonthlyReset: aiCredits.lastMonthlyReset,
        } : null,
        recentUsage: aiUsage.map(u => ({
          inputTokens: u.inputTokens,
          outputTokens: u.outputTokens,
          context: u.context,
          createdAt: u.createdAt,
        })),
      },
    };

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="integrated-human-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
