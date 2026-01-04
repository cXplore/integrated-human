import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  evaluateSkillDemonstration,
  getScenarioById,
  SKILL_SCENARIOS,
} from '@/lib/ai-verification';

/**
 * GET /api/verification/skill-demo
 * Get available skill demonstration scenarios
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const dimensionId = searchParams.get('dimension');

  let scenarios = SKILL_SCENARIOS;

  if (category) {
    scenarios = scenarios.filter(s => s.category === category);
  }

  if (dimensionId) {
    scenarios = scenarios.filter(s => s.dimensions.includes(dimensionId));
  }

  // Return scenarios without full rubric details (for listing)
  const summaries = scenarios.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    difficulty: s.difficulty,
    dimensions: s.dimensions,
  }));

  return NextResponse.json({ scenarios: summaries });
}

/**
 * POST /api/verification/skill-demo
 * Evaluate a skill demonstration response
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { scenarioId, response } = body;

    if (!scenarioId || !response) {
      return new NextResponse('Missing scenarioId or response', { status: 400 });
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return new NextResponse('Scenario not found', { status: 404 });
    }

    if (response.length < 100) {
      return NextResponse.json({
        result: 'try-again',
        feedback: 'Please provide a more complete response to the scenario.',
        overall: 0,
      });
    }

    const evaluation = await evaluateSkillDemonstration(scenarioId, response);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Skill demo evaluation error:', error);
    return new NextResponse('Evaluation failed', { status: 500 });
  }
}
