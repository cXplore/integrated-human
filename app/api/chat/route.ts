import { NextRequest } from 'next/server';
import {
  detectStance,
  isCasualMessage,
  buildCasualPrompt,
  buildSystemPrompt,
  formatResponse,
  SITE_CONTEXT,
} from '@/lib/presence';

// LM Studio endpoint
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://10.221.168.219:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'qwen/qwen3-32b';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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
      const errorText = await response.text();
      console.error('LM Studio error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to get response from AI',
          details: response.status === 404 ? 'LM Studio not running or no model loaded' : errorText,
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    const formattedResponse = formatResponse(aiResponse);

    return new Response(
      JSON.stringify({
        response: formattedResponse,
        stance,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
