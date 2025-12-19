import { NextResponse } from 'next/server';
import { getAllLeadMagnets } from '@/lib/lead-magnets';

export async function GET() {
  const leadMagnets = getAllLeadMagnets();

  // Return without content (just metadata for listing)
  const list = leadMagnets.map(({ content, ...meta }) => meta);

  return NextResponse.json({ leadMagnets: list });
}
