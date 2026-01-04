import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { LM_STUDIO_URL, LM_STUDIO_MODEL } from '@/lib/ai-credits';

/**
 * POST /api/chat/journaling-prompts
 * Generate personalized journaling prompts based on conversation themes
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Fetch conversation with messages
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { content: true, role: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Need at least 4 messages for meaningful prompts
    if (conversation.messages.length < 4) {
      return NextResponse.json({
        error: 'Conversation needs more depth for prompts',
        minMessages: 4,
      }, { status: 400 });
    }

    // Build conversation text for analysis
    const conversationText = conversation.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    // Generate prompts using LM Studio
    const promptRequest = `Based on this personal growth conversation, generate 3 journaling prompts that would help the person explore their experience more deeply.

CONVERSATION:
${conversationText}

Generate 3 journaling prompts that:
1. Help them explore what came up in the conversation
2. Connect to their emotions and body sensations
3. Look for patterns or insights they might uncover through writing

Format your response as a JSON array with exactly 3 objects, each having "prompt" and "focus" fields.
Example: [{"prompt": "What emotions arise when you think about...", "focus": "emotional exploration"}]

Return ONLY the JSON array, no other text.`;

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in therapeutic journaling and personal growth. Generate thoughtful, open-ended journaling prompts. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: promptRequest,
          },
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('LM Studio error:', await response.text());
      return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Try to extract JSON from the response
    let prompts: Array<{ prompt: string; focus: string }> = [];

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      prompts = JSON.parse(content);
    } catch {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          prompts = JSON.parse(jsonMatch[0]);
        } catch {
          // Fall back to default prompts based on conversation themes
          prompts = generateFallbackPrompts(conversationText);
        }
      } else {
        prompts = generateFallbackPrompts(conversationText);
      }
    }

    // Validate prompts structure
    prompts = prompts.filter(p =>
      typeof p.prompt === 'string' &&
      typeof p.focus === 'string' &&
      p.prompt.length > 10
    ).slice(0, 3);

    if (prompts.length === 0) {
      prompts = generateFallbackPrompts(conversationText);
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error generating journaling prompts:', error);
    return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
  }
}

function generateFallbackPrompts(text: string): Array<{ prompt: string; focus: string }> {
  const lowerText = text.toLowerCase();

  const prompts: Array<{ prompt: string; focus: string }> = [];

  // Detect themes and provide relevant prompts
  if (lowerText.includes('relationship') || lowerText.includes('partner')) {
    prompts.push({
      prompt: 'What patterns do you notice in how you show up in relationships? How do these connect to your early experiences?',
      focus: 'relationship patterns',
    });
  }

  if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('fear')) {
    prompts.push({
      prompt: 'When you notice anxiety arising, where do you feel it in your body? What might it be trying to protect you from?',
      focus: 'anxiety exploration',
    });
  }

  if (lowerText.includes('anger') || lowerText.includes('frustrated')) {
    prompts.push({
      prompt: 'What boundaries might your anger be pointing to? What need is underneath the frustration?',
      focus: 'anger as messenger',
    });
  }

  if (lowerText.includes('sad') || lowerText.includes('grief') || lowerText.includes('loss')) {
    prompts.push({
      prompt: 'What are you grieving right now? What would it look like to honor this sadness without trying to fix it?',
      focus: 'grief honoring',
    });
  }

  if (lowerText.includes('stuck') || lowerText.includes('blocked')) {
    prompts.push({
      prompt: 'If the stuck part of you could speak, what would it say? What might it need before it can move?',
      focus: 'exploring stuckness',
    });
  }

  if (lowerText.includes('family') || lowerText.includes('parent') || lowerText.includes('childhood')) {
    prompts.push({
      prompt: 'What did you learn about yourself from your family? Which of these learnings still serve you, and which are ready to evolve?',
      focus: 'family inheritance',
    });
  }

  // Add default prompts if we don't have enough
  const defaults = [
    {
      prompt: 'What felt most alive or true in your conversation today? What does this reveal about what matters to you?',
      focus: 'core values',
    },
    {
      prompt: 'If you could give your present self advice from a wiser, future version of you, what would it be?',
      focus: 'inner wisdom',
    },
    {
      prompt: 'What are you carrying right now that isn\'t yours to carry? What would it feel like to set it down?',
      focus: 'letting go',
    },
  ];

  while (prompts.length < 3) {
    const nextDefault = defaults.shift();
    if (nextDefault && !prompts.some(p => p.focus === nextDefault.focus)) {
      prompts.push(nextDefault);
    } else if (!nextDefault) {
      break;
    }
  }

  return prompts.slice(0, 3);
}
