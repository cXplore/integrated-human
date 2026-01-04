import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  evaluateGate,
  canProceedToModule,
  getGateForModule,
  checkCertificateEligibility,
} from '@/lib/ai-verification';

/**
 * GET /api/verification/gate
 * Check gate status for a module
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get('course');
  const moduleSlug = searchParams.get('module');
  const checkCertificate = searchParams.get('certificate') === 'true';

  if (checkCertificate && courseSlug) {
    // Check certificate eligibility
    const eligibility = await checkCertificateEligibility(
      session.user.id,
      courseSlug
    );
    return NextResponse.json(eligibility);
  }

  if (!courseSlug || !moduleSlug) {
    return new NextResponse('Missing course or module', { status: 400 });
  }

  // Check if module has a gate and user's status
  const gate = getGateForModule(courseSlug, moduleSlug);

  if (!gate) {
    return NextResponse.json({
      hasGate: false,
      canProceed: true,
    });
  }

  const status = await canProceedToModule(
    session.user.id,
    courseSlug,
    moduleSlug
  );

  return NextResponse.json({
    hasGate: true,
    gate: {
      id: gate.id,
      type: gate.gateType,
      minimumScore: gate.minimumScore,
      allowRetry: gate.allowRetry,
      retryDelay: gate.retryDelay,
    },
    ...status,
  });
}

/**
 * POST /api/verification/gate
 * Submit a gate attempt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { gateId, content, prompt } = body;

    if (!gateId || !content) {
      return new NextResponse('Missing gateId or content', { status: 400 });
    }

    const result = await evaluateGate({
      gateId,
      userId: session.user.id,
      content,
      prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Gate evaluation error:', error);
    return new NextResponse('Gate evaluation failed', { status: 500 });
  }
}
