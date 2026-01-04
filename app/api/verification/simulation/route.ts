import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  startSimulation,
  continueSimulation,
  evaluateSimulation,
  getSimulationById,
  SIMULATIONS,
  SimulationSession,
} from '@/lib/ai-verification';

/**
 * GET /api/verification/simulation
 * Get available simulations or a specific active session
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const skill = searchParams.get('skill');

  // If sessionId provided, return that session
  if (sessionId) {
    const dbSession = await prisma.simulationSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession || dbSession.userId !== session.user.id) {
      return new NextResponse('Session not found', { status: 404 });
    }

    const simulation = getSimulationById(dbSession.simulationId);
    return NextResponse.json({
      session: {
        id: dbSession.id,
        simulationId: dbSession.simulationId,
        status: dbSession.status,
        turns: JSON.parse(dbSession.turns),
        startedAt: dbSession.startedAt,
      },
      simulation: simulation ? {
        id: simulation.id,
        title: simulation.title,
        description: simulation.description,
        targetSkills: simulation.targetSkills,
        maxTurns: simulation.maxTurns,
      } : null,
    });
  }

  // Otherwise, list available simulations
  let simulations = SIMULATIONS;

  if (skill) {
    simulations = simulations.filter(s =>
      s.targetSkills.includes(skill as any)
    );
  }

  const summaries = simulations.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    role: s.role,
    targetSkills: s.targetSkills,
    difficulty: s.difficulty,
    maxTurns: s.maxTurns,
  }));

  // Also get user's active sessions
  const activeSessions = await prisma.simulationSession.findMany({
    where: {
      userId: session.user.id,
      status: 'active',
    },
    orderBy: { startedAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({
    simulations: summaries,
    activeSessions: activeSessions.map(s => ({
      id: s.id,
      simulationId: s.simulationId,
      startedAt: s.startedAt,
    })),
  });
}

/**
 * POST /api/verification/simulation
 * Start a new simulation or continue an existing one
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { action, simulationId, sessionId, message } = body;

    if (action === 'start') {
      // Start new simulation
      if (!simulationId) {
        return new NextResponse('Missing simulationId', { status: 400 });
      }

      const simulation = getSimulationById(simulationId);
      if (!simulation) {
        return new NextResponse('Simulation not found', { status: 404 });
      }

      const { session: simSession, firstTurn } = await startSimulation(simulationId);

      // Save to database
      const dbSession = await prisma.simulationSession.create({
        data: {
          userId: session.user.id,
          simulationId,
          status: 'active',
          turns: JSON.stringify(simSession.turns),
        },
      });

      return NextResponse.json({
        sessionId: dbSession.id,
        simulation: {
          id: simulation.id,
          title: simulation.title,
          scenario: simulation.scenario,
          targetSkills: simulation.targetSkills,
          maxTurns: simulation.maxTurns,
        },
        firstTurn,
      });
    }

    if (action === 'continue') {
      // Continue existing simulation
      if (!sessionId || !message) {
        return new NextResponse('Missing sessionId or message', { status: 400 });
      }

      const dbSession = await prisma.simulationSession.findUnique({
        where: { id: sessionId },
      });

      if (!dbSession || dbSession.userId !== session.user.id) {
        return new NextResponse('Session not found', { status: 404 });
      }

      if (dbSession.status !== 'active') {
        return new NextResponse('Session is not active', { status: 400 });
      }

      const simulation = getSimulationById(dbSession.simulationId);
      if (!simulation) {
        return new NextResponse('Simulation not found', { status: 404 });
      }

      // Reconstruct session object
      const simSession: SimulationSession = {
        simulation,
        turns: JSON.parse(dbSession.turns),
        status: 'active',
        startedAt: dbSession.startedAt,
      };

      const result = await continueSimulation(simSession, message);

      // Update database
      await prisma.simulationSession.update({
        where: { id: sessionId },
        data: {
          turns: JSON.stringify(result.session.turns),
          status: result.isComplete ? 'completed' : 'active',
          completedAt: result.isComplete ? new Date() : null,
        },
      });

      // If complete, also generate final result
      let finalResult = null;
      if (result.isComplete) {
        finalResult = await evaluateSimulation(result.session);
        await prisma.simulationSession.update({
          where: { id: sessionId },
          data: { finalResult: JSON.stringify(finalResult) },
        });
      }

      return NextResponse.json({
        response: result.response,
        turnEvaluation: result.turnEvaluation,
        isComplete: result.isComplete,
        finalResult,
      });
    }

    if (action === 'complete') {
      // Force complete and evaluate
      if (!sessionId) {
        return new NextResponse('Missing sessionId', { status: 400 });
      }

      const dbSession = await prisma.simulationSession.findUnique({
        where: { id: sessionId },
      });

      if (!dbSession || dbSession.userId !== session.user.id) {
        return new NextResponse('Session not found', { status: 404 });
      }

      const simulation = getSimulationById(dbSession.simulationId);
      if (!simulation) {
        return new NextResponse('Simulation not found', { status: 404 });
      }

      const simSession: SimulationSession = {
        simulation,
        turns: JSON.parse(dbSession.turns),
        status: 'active',
        startedAt: dbSession.startedAt,
      };

      const finalResult = await evaluateSimulation(simSession);

      await prisma.simulationSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          finalResult: JSON.stringify(finalResult),
        },
      });

      return NextResponse.json({ finalResult });
    }

    return new NextResponse('Invalid action', { status: 400 });
  } catch (error) {
    console.error('Simulation error:', error);
    return new NextResponse('Simulation failed', { status: 500 });
  }
}
