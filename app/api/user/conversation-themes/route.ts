import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface ThemeData {
  theme: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  conversationCount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  relatedThemes: string[];
}

interface ThemeInsight {
  type: 'recurring' | 'emerging' | 'resolved' | 'deepening';
  theme: string;
  message: string;
  strength: number;
}

// Theme co-occurrence matrix for related themes
const THEME_RELATIONSHIPS: Record<string, string[]> = {
  'anxiety': ['self-worth', 'relationships', 'boundaries'],
  'relationships': ['boundaries', 'authenticity', 'self-worth'],
  'self-worth': ['anxiety', 'shadow-work', 'authenticity'],
  'boundaries': ['relationships', 'self-worth', 'authenticity'],
  'grief': ['healing', 'relationships', 'purpose'],
  'purpose': ['authenticity', 'growth', 'self-worth'],
  'shadow-work': ['authenticity', 'self-worth', 'healing'],
  'healing': ['grief', 'growth', 'shadow-work'],
  'growth': ['purpose', 'authenticity', 'healing'],
  'authenticity': ['shadow-work', 'purpose', 'relationships'],
};

/**
 * GET /api/user/conversation-themes
 * Get theme analysis across user's conversations
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const lookbackDays = parseInt(url.searchParams.get('days') || '90');

  try {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    // Get all conversations in the lookback period
    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId,
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        keyThemes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get insights from the pattern analysis
    const insights = await prisma.conversationInsight.findMany({
      where: {
        userId,
        insightType: 'recurring-theme',
      },
      orderBy: { strength: 'desc' },
    });

    // Aggregate theme data
    const themeMap = new Map<string, {
      count: number;
      conversationIds: string[];
      firstSeen: Date;
      lastSeen: Date;
      recentCount: number; // Last 30 days
    }>();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const conv of conversations) {
      if (!conv.keyThemes) continue;

      try {
        const themes = JSON.parse(conv.keyThemes) as string[];
        for (const theme of themes) {
          const normalizedTheme = theme.toLowerCase().trim();
          const existing = themeMap.get(normalizedTheme);

          if (existing) {
            existing.count++;
            existing.conversationIds.push(conv.id);
            if (conv.createdAt < existing.firstSeen) {
              existing.firstSeen = conv.createdAt;
            }
            if (conv.updatedAt > existing.lastSeen) {
              existing.lastSeen = conv.updatedAt;
            }
            if (conv.updatedAt >= thirtyDaysAgo) {
              existing.recentCount++;
            }
          } else {
            themeMap.set(normalizedTheme, {
              count: 1,
              conversationIds: [conv.id],
              firstSeen: conv.createdAt,
              lastSeen: conv.updatedAt,
              recentCount: conv.updatedAt >= thirtyDaysAgo ? 1 : 0,
            });
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    // Build theme data with trends
    const themes: ThemeData[] = [];

    for (const [theme, data] of themeMap.entries()) {
      // Calculate trend based on recent vs older activity
      const recentRatio = data.recentCount / Math.max(1, data.count);
      let trend: 'increasing' | 'stable' | 'decreasing';

      if (recentRatio > 0.6) {
        trend = 'increasing';
      } else if (recentRatio < 0.3 && data.count > 2) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      themes.push({
        theme,
        count: data.count,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen,
        conversationCount: data.conversationIds.length,
        trend,
        relatedThemes: THEME_RELATIONSHIPS[theme] || [],
      });
    }

    // Sort by count (most frequent first)
    themes.sort((a, b) => b.count - a.count);

    // Generate theme insights
    const themeInsights: ThemeInsight[] = [];

    for (const theme of themes.slice(0, 5)) {
      if (theme.count >= 5 && theme.trend === 'increasing') {
        themeInsights.push({
          type: 'deepening',
          theme: theme.theme,
          message: `You're exploring "${theme.theme}" more deeply lately. This seems to be an active growth area.`,
          strength: Math.min(10, theme.count),
        });
      } else if (theme.count >= 3 && theme.trend === 'stable') {
        themeInsights.push({
          type: 'recurring',
          theme: theme.theme,
          message: `"${theme.theme}" continues to be an important theme in your conversations.`,
          strength: Math.min(8, theme.count),
        });
      } else if (theme.count >= 2 && theme.trend === 'decreasing') {
        themeInsights.push({
          type: 'resolved',
          theme: theme.theme,
          message: `You seem to be moving past "${theme.theme}" - it comes up less often now.`,
          strength: 5,
        });
      }
    }

    // Check for emerging themes (appeared recently, growing)
    const recentThemes = themes.filter(t => {
      const daysSinceFirst = Math.floor(
        (Date.now() - t.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceFirst < 14 && t.count >= 2;
    });

    for (const theme of recentThemes.slice(0, 2)) {
      themeInsights.push({
        type: 'emerging',
        theme: theme.theme,
        message: `"${theme.theme}" is a new theme you've started exploring.`,
        strength: 6,
      });
    }

    // Find theme clusters (themes that appear together)
    const themeClusters: Array<{ themes: string[]; strength: number }> = [];
    const convThemeGroups: string[][] = [];

    for (const conv of conversations) {
      if (conv.keyThemes) {
        try {
          const themes = JSON.parse(conv.keyThemes) as string[];
          if (themes.length >= 2) {
            convThemeGroups.push(themes.map(t => t.toLowerCase().trim()));
          }
        } catch {
          // Skip
        }
      }
    }

    // Count co-occurrences
    const coOccurrences = new Map<string, number>();
    for (const group of convThemeGroups) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const pair = [group[i], group[j]].sort().join('|');
          coOccurrences.set(pair, (coOccurrences.get(pair) || 0) + 1);
        }
      }
    }

    // Find strong clusters
    for (const [pair, count] of coOccurrences.entries()) {
      if (count >= 3) {
        themeClusters.push({
          themes: pair.split('|'),
          strength: count,
        });
      }
    }

    themeClusters.sort((a, b) => b.strength - a.strength);

    return NextResponse.json({
      themes: themes.slice(0, 10),
      insights: themeInsights,
      clusters: themeClusters.slice(0, 5),
      totalConversationsAnalyzed: conversations.length,
      lookbackDays,
      storedInsights: insights.map(i => ({
        insight: i.insight,
        strength: i.strength,
        occurrences: i.occurrences,
        lastSeen: i.lastSeen,
      })),
    });
  } catch (error) {
    console.error('Error analyzing conversation themes:', error);
    return NextResponse.json({ error: 'Failed to analyze themes' }, { status: 500 });
  }
}

/**
 * POST /api/user/conversation-themes/analyze
 * Trigger theme analysis for recent conversations
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Import and run the analysis
    const { analyzeConversationPatterns } = await import('@/lib/conversation-memory');
    await analyzeConversationPatterns(userId, 30);

    return NextResponse.json({ success: true, message: 'Theme analysis complete' });
  } catch (error) {
    console.error('Error running theme analysis:', error);
    return NextResponse.json({ error: 'Failed to run analysis' }, { status: 500 });
  }
}
