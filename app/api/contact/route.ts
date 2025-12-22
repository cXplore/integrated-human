import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { verifyCaptcha, isCaptchaEnabled } from '@/lib/captcha';

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

interface ContactMessage {
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

async function ensureDataDir() {
  const dataDir = path.dirname(MESSAGES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function getMessages(): Promise<ContactMessage[]> {
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveMessages(messages: ContactMessage[]) {
  await ensureDataDir();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, captchaToken } = await request.json();

    // Check rate limit by IP (contact form doesn't require auth)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const rateLimit = checkRateLimit(`contact:${ip}`, RATE_LIMITS.contact);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    // Verify CAPTCHA if enabled
    if (isCaptchaEnabled()) {
      const captchaResult = await verifyCaptcha(captchaToken, 'contact');
      if (!captchaResult.success) {
        console.warn('Captcha failed:', captchaResult.error, 'IP:', ip);
        return NextResponse.json(
          { error: 'Captcha verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const messages = await getMessages();

    const newMessage: ContactMessage = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    messages.push(newMessage);
    await saveMessages(messages);

    return NextResponse.json(
      { message: 'Message sent successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
