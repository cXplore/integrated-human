import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { evaluateJournalEntry } from '@/lib/ai-verification';

/**
 * POST /api/verification/journal
 * Evaluate a journal entry for quality
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { content, courseSlug, moduleSlug, prompt, minimumScore } = body;

    if (!content || !courseSlug || !moduleSlug || !prompt) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    if (content.length < 50) {
      return NextResponse.json({
        result: 'try-again',
        feedback: 'Please write a more substantial reflection (at least a few sentences).',
        overall: 0,
      });
    }

    const evaluation = await evaluateJournalEntry(content, {
      courseSlug,
      moduleSlug,
      prompt,
      minimumScore,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Journal evaluation error:', error);
    return new NextResponse('Evaluation failed', { status: 500 });
  }
}
