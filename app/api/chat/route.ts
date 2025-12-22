import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  detectStance,
  isCasualMessage,
  buildCasualPrompt,
  buildSystemPrompt,
  formatResponse,
  SITE_CONTEXT,
} from '@/lib/presence';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

// LM Studio endpoint - requires LM_STUDIO_URL env var in production
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'qwen/qwen3-32b';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limit by user
    const rateLimit = checkRateLimit(`chat:${session.user.id}`, RATE_LIMITS.chat);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Detect stance and build appropriate prompt
    const isCasual = isCasualMessage(message);
    const stance = isCasual ? 'companion' : detectStance(message);
    const systemPrompt = isCasual
      ? buildCasualPrompt()
      : buildSystemPrompt(stance, SITE_CONTEXT);

    // Build messages array for the LLM
    // Add /no_think to user message to disable qwen's thinking mode for faster responses
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: `${message} /no_think` },
    ];

    // Call LM Studio
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('LM Studio error:', response.status);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    const formattedResponse = formatResponse(aiResponse);

    return NextResponse.json({
      response: formattedResponse,
      stance,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
