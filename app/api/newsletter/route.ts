import { NextRequest, NextResponse } from 'next/server';

// ConvertKit (Kit) - Free up to 1,000 subscribers
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || '8853407';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // If no API key, fall back to just logging (for development)
    if (!CONVERTKIT_API_KEY) {
      console.log('Newsletter signup (no API key configured):', email);
      return NextResponse.json(
        { message: 'Successfully subscribed' },
        { status: 201 }
      );
    }

    // Subscribe via ConvertKit API v3 - form subscription
    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: CONVERTKIT_API_KEY,
          email: email.toLowerCase(),
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.subscription) {
      return NextResponse.json(
        { message: 'Successfully subscribed' },
        { status: 201 }
      );
    }

    // Log error for debugging
    console.error('ConvertKit API error:', response.status, data);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
