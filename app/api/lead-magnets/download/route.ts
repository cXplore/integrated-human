import { NextRequest, NextResponse } from 'next/server';
import { getLeadMagnetBySlug } from '@/lib/lead-magnets';

// ConvertKit API
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID || '8853407';

export async function POST(request: NextRequest) {
  try {
    const { email, slug, firstName } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate slug
    if (!slug) {
      return NextResponse.json(
        { error: 'Lead magnet slug is required' },
        { status: 400 }
      );
    }

    // Get the lead magnet
    const leadMagnet = getLeadMagnetBySlug(slug);
    if (!leadMagnet) {
      return NextResponse.json(
        { error: 'Lead magnet not found' },
        { status: 404 }
      );
    }

    // Subscribe to ConvertKit with tag for this lead magnet
    if (CONVERTKIT_API_KEY) {
      try {
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
              first_name: firstName || undefined,
              tags: [`lead-magnet-${slug}`],
            }),
          }
        );

        if (!response.ok) {
          console.error('ConvertKit subscription failed:', await response.text());
        }
      } catch (error) {
        console.error('ConvertKit error:', error);
        // Continue anyway - don't block download if email service fails
      }
    } else {
      console.log('Lead magnet download (no API key):', { email, slug, firstName });
    }

    // Return the download URL
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/lead-magnets/${slug}/content`,
      title: leadMagnet.title,
    });
  } catch (error) {
    console.error('Lead magnet download error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
