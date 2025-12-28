import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { analyzeEmotionalPatterns, type MoodCategory, type Trajectory } from '@/lib/emotional-arc';

interface EmotionalArcData {
  startMood: MoodCategory;
  currentMood: MoodCategory;
  trajectory: Trajectory;
}

interface ConversationEmotionalData {
  conversationId: string;
  title: string | null;
  date: Date;
  arc: EmotionalArcData;
}

/**
 * GET /api/user/emotional-arc
 * Get emotional arc data across conversations
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const lookbackDays = parseInt(url.searchParams.get('days') || '30');

  try {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    // Get conversations with emotional arc data
    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId,
        updatedAt: { gte: since },
        emotionalArc: { not: null },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        emotionalArc: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse emotional arcs
    const emotionalData: ConversationEmotionalData[] = [];
    const moodTrends: {
      date: string;
      startMood: MoodCategory;
      endMood: MoodCategory;
      trajectory: Trajectory;
    }[] = [];

    for (const conv of conversations) {
      if (conv.emotionalArc) {
        try {
          const arc = JSON.parse(conv.emotionalArc) as EmotionalArcData;
          emotionalData.push({
            conversationId: conv.id,
            title: conv.title,
            date: conv.createdAt,
            arc,
          });

          moodTrends.push({
            date: conv.createdAt.toISOString().split('T')[0],
            startMood: arc.startMood,
            endMood: arc.currentMood,
            trajectory: arc.trajectory,
          });
        } catch {
          // Skip invalid
        }
      }
    }

    // Calculate overall statistics
    const trajectoryStats = {
      improving: 0,
      stable: 0,
      declining: 0,
      fluctuating: 0,
    };

    const startMoodStats: Partial<Record<MoodCategory, number>> = {};
    const endMoodStats: Partial<Record<MoodCategory, number>> = {};

    for (const data of emotionalData) {
      trajectoryStats[data.arc.trajectory]++;
      startMoodStats[data.arc.startMood] = (startMoodStats[data.arc.startMood] || 0) + 1;
      endMoodStats[data.arc.currentMood] = (endMoodStats[data.arc.currentMood] || 0) + 1;
    }

    // Get insights
    const insights = await prisma.conversationInsight.findMany({
      where: {
        userId,
        insightType: 'emotional-pattern',
      },
      orderBy: { strength: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      conversations: emotionalData.slice(0, 20),
      trends: moodTrends.slice(0, 30),
      statistics: {
        totalConversations: emotionalData.length,
        trajectoryBreakdown: trajectoryStats,
        improvementRate: emotionalData.length > 0
          ? Math.round((trajectoryStats.improving / emotionalData.length) * 100)
          : 0,
        commonStartMoods: Object.entries(startMoodStats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([mood, count]) => ({ mood, count })),
        commonEndMoods: Object.entries(endMoodStats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([mood, count]) => ({ mood, count })),
      },
      insights: insights.map(i => ({
        insight: i.insight,
        strength: i.strength,
      })),
      lookbackDays,
    });
  } catch (error) {
    console.error('Error fetching emotional arc data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * POST /api/user/emotional-arc/analyze
 * Trigger emotional pattern analysis
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await analyzeEmotionalPatterns(session.user.id, 30);
    return NextResponse.json({ success: true, message: 'Emotional pattern analysis complete' });
  } catch (error) {
    console.error('Error running emotional analysis:', error);
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 });
  }
}
