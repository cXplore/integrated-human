import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface WelcomeContext {
  greeting: string;
  lastConversationSummary?: string;
  daysSinceLastChat: number | null;
  recentActivity: {
    hasJournal: boolean;
    hasDreams: boolean;
    hasCheckIns: boolean;
  };
  suggestedTopic?: string;
}

/**
 * GET /api/chat/welcome-back
 * Generate a personalized welcome message based on user's context
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const now = new Date();

    // Fetch user's recent activity in parallel
    const [
      lastConversation,
      recentJournals,
      recentDreams,
      recentCheckIns,
      userProfile,
    ] = await Promise.all([
      // Last conversation
      prisma.chatConversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          title: true,
          updatedAt: true,
          tags: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, role: true },
          },
        },
      }),
      // Recent journal entries (last 7 days)
      prisma.journalEntry.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { title: true, tags: true },
      }),
      // Recent dreams (last 7 days)
      prisma.dreamEntry.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { title: true },
      }),
      // Recent check-ins (last 3 days)
      prisma.quickCheckIn.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      // User profile for name
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    // Calculate days since last chat
    let daysSinceLastChat: number | null = null;
    if (lastConversation) {
      const diffMs = now.getTime() - new Date(lastConversation.updatedAt).getTime();
      daysSinceLastChat = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Build greeting
    const hour = now.getHours();
    let timeGreeting = 'Hello';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const firstName = userProfile?.name?.split(' ')[0];
    let greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

    // Add context to greeting based on time away
    if (daysSinceLastChat !== null) {
      if (daysSinceLastChat === 0) {
        greeting += '. Welcome back today.';
      } else if (daysSinceLastChat === 1) {
        greeting += ". It's good to see you again.";
      } else if (daysSinceLastChat <= 3) {
        greeting += `. It's been a couple of days.`;
      } else if (daysSinceLastChat <= 7) {
        greeting += `. It's been about a week - I hope you're well.`;
      } else if (daysSinceLastChat <= 30) {
        greeting += `. It's been a while - welcome back.`;
      } else {
        greeting += `. It's been some time - I'm glad you're here.`;
      }
    } else {
      greeting += ". Welcome - it's nice to meet you.";
    }

    // Build last conversation summary
    let lastConversationSummary: string | undefined;
    if (lastConversation && daysSinceLastChat !== null && daysSinceLastChat <= 14) {
      const tags = lastConversation.tags ? JSON.parse(lastConversation.tags) : [];
      if (lastConversation.title && lastConversation.title !== 'New Conversation') {
        lastConversationSummary = `Last time we talked about "${lastConversation.title}"`;
        if (tags.length > 0) {
          lastConversationSummary += ` (${tags.slice(0, 2).join(', ')})`;
        }
        lastConversationSummary += '.';
      }
    }

    // Generate suggested topic based on recent activity
    let suggestedTopic: string | undefined;

    if (recentDreams.length > 0) {
      suggestedTopic = `I noticed you recorded a dream recently - would you like to explore its meaning?`;
    } else if (recentJournals.length > 0) {
      const journalTags = recentJournals
        .flatMap(j => {
          try {
            return JSON.parse(j.tags || '[]');
          } catch {
            return [];
          }
        })
        .filter((t: string) => t && t !== 'chat-insights');

      if (journalTags.length > 0) {
        const commonTag = journalTags[0];
        suggestedTopic = `I see you've been journaling about ${commonTag} - want to dive deeper?`;
      }
    } else if (!recentCheckIns.length && daysSinceLastChat !== null && daysSinceLastChat > 3) {
      suggestedTopic = `It's been a few days - how are you feeling today?`;
    }

    const context: WelcomeContext = {
      greeting,
      lastConversationSummary,
      daysSinceLastChat,
      recentActivity: {
        hasJournal: recentJournals.length > 0,
        hasDreams: recentDreams.length > 0,
        hasCheckIns: recentCheckIns.length > 0,
      },
      suggestedTopic,
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error('Error generating welcome context:', error);
    return NextResponse.json({ error: 'Failed to generate welcome' }, { status: 500 });
  }
}
