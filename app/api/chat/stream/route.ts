import { NextRequest } from 'next/server';
import {
  detectStance,
  isCasualMessage,
  buildCasualPrompt,
  buildSystemPrompt,
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

    // Call LM Studio with streaming
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
        stream: true,
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

    // Create a transform stream that filters out <think> tags
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let buffer = '';
    let inThinkTag = false;
    let thinkTagBuffer = '';

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Send any remaining buffer (shouldn't happen if tags are balanced)
              if (buffer && !inThinkTag) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
                buffer = '';
              }
              // Send stance info at the end
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, stance })}\n\n`));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Add to buffer and process
                buffer += content;

                // Process buffer to filter out <think>...</think> tags
                while (true) {
                  if (inThinkTag) {
                    // Look for closing </think>
                    const closeIndex = buffer.indexOf('</think>');
                    if (closeIndex !== -1) {
                      // Found closing tag, skip everything up to and including it
                      buffer = buffer.slice(closeIndex + 8);
                      inThinkTag = false;
                    } else {
                      // Still inside think tag, don't output anything
                      break;
                    }
                  } else {
                    // Look for opening <think>
                    const openIndex = buffer.indexOf('<think>');
                    if (openIndex !== -1) {
                      // Output everything before the think tag
                      const before = buffer.slice(0, openIndex);
                      if (before) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: before })}\n\n`));
                      }
                      buffer = buffer.slice(openIndex + 7);
                      inThinkTag = true;
                    } else {
                      // Check if we might be in the middle of a <think> tag
                      // Keep last 6 chars in buffer in case "<think" is split across chunks
                      const safeLength = Math.max(0, buffer.length - 6);
                      if (safeLength > 0) {
                        const toSend = buffer.slice(0, safeLength);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: toSend })}\n\n`));
                        buffer = buffer.slice(safeLength);
                      }
                      break;
                    }
                  }
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
      flush(controller) {
        // Send any remaining buffer that's not in a think tag
        if (buffer && !inThinkTag) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
        }
      }
    });

    // Pipe the response through our transform
    const readable = response.body?.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);
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
