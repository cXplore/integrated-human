import { NextRequest, NextResponse } from 'next/server';

// TTS Server URL (persistent Python server for low latency)
const TTS_SERVER_URL = process.env.TTS_SERVER_URL || 'http://127.0.0.1:8767';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return NextResponse.json({ error: 'No speakable text' }, { status: 400 });
    }

    // Call persistent TTS server
    const response = await fetch(`${TTS_SERVER_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'TTS server error' }));
      return NextResponse.json(error, { status: response.status });
    }

    // Get audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio as base64 for easy client consumption
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Detect format from content-type
    const contentType = response.headers.get('content-type') || 'audio/wav';
    const format = contentType.includes('mp3') ? 'mp3' : 'wav';

    // Estimate duration (~150 words per minute)
    const wordCount = cleanText.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    return NextResponse.json({
      audio: audioBase64,
      duration: estimatedDuration,
      format,
    });

  } catch (error) {
    console.error('TTS API error:', error);

    // Check if it's a connection error (server not running)
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json({
        error: 'TTS server not running',
        details: 'Start the TTS server: python services/tts_server.py'
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
