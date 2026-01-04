import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  classifyJournalEntry,
  generateJournalPrompts,
  analyzeJournalPatterns,
  type JournalPatterns,
  type JournalPrompt,
} from '@/lib/journal-analysis';

interface PromptsResponse {
  prompts: JournalPrompt[];
  patterns?: JournalPatterns;
  suggestedApproach: string;
}

/**
 * GET /api/journal/prompts
 * Get personalized journal prompts based on recent entries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    const includePatterns = searchParams.get('patterns') === 'true';

    // Get recent entries for context
    const recentEntries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        mood: true,
        createdAt: true,
      },
    });

    if (recentEntries.length === 0) {
      // No entries yet - return starter prompts
      return NextResponse.json({
        prompts: [
          {
            type: 'deepening',
            prompt: 'What\'s on your mind right now?',
            guidance: 'There\'s no wrong way to start. Just write what\'s true.',
          },
          {
            type: 'somatic',
            prompt: 'Take a breath. How does your body feel right now?',
            guidance: 'Scan from head to toe. Notice without judging.',
          },
          {
            type: 'gratitude',
            prompt: 'What\'s one small thing you appreciate about today?',
            guidance: 'It can be as simple as a good cup of coffee or a moment of quiet.',
          },
        ],
        suggestedApproach: 'explore',
      });
    }

    // Get specific entry or most recent
    let targetEntry = recentEntries[0];
    if (entryId) {
      const found = recentEntries.find(e => e.id === entryId);
      if (found) targetEntry = found;
    }

    // Classify the target entry
    const classification = classifyJournalEntry(
      targetEntry.content,
      targetEntry.mood || undefined
    );

    // Generate prompts based on classification
    const prompts = generateJournalPrompts(classification, targetEntry.content);

    const response: PromptsResponse = {
      prompts,
      suggestedApproach: classification.suggestedApproach,
    };

    // Optionally include pattern analysis
    if (includePatterns && recentEntries.length >= 3) {
      response.patterns = analyzeJournalPatterns(
        recentEntries.map(e => ({
          content: e.content,
          mood: e.mood || undefined,
          createdAt: e.createdAt,
        }))
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating journal prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/journal/prompts
 * Get prompts for a specific journal content (before saving)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, mood } = await request.json();

    if (!content || content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Classify the content
    const classification = classifyJournalEntry(content, mood);

    // Generate prompts
    const prompts = generateJournalPrompts(classification, content);

    return NextResponse.json({
      prompts,
      classification: {
        type: classification.primaryType,
        emotionalTone: classification.emotionalTone,
        approach: classification.suggestedApproach,
        flags: {
          crisisIndicators: classification.flags.crisisIndicators,
          growthMoment: classification.flags.growthMoment,
          spiralPattern: classification.flags.spiralPattern,
          shadowContent: classification.flags.shadowContent,
          somaticContent: classification.flags.somaticContent,
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing journal content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}
