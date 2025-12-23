/**
 * AI-Powered Health Analysis
 *
 * Uses LLM to analyze user's journal entries, check-ins, and other
 * reflective content to generate deeper insights about their integration journey.
 *
 * This is the "living" part of the health system - not just metrics,
 * but genuine understanding of where someone is.
 */

import { prisma } from './prisma';
import { HealthDataSources, Pillar, SpectrumStage, STAGE_INFO, PILLAR_INFO } from './integration-health';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthAnalysis {
  overallInsight: string;
  pillarInsights: Record<Pillar, PillarInsight>;
  themes: string[];
  emotionalPatterns: EmotionalPattern[];
  recommendations: Recommendation[];
  reassessmentNeeded: ReassessmentSuggestion[];
}

export interface PillarInsight {
  stage: SpectrumStage;
  insight: string;
  evidence: string[];
  growthEdge: string;
}

export interface EmotionalPattern {
  pattern: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'dominant';
  impact: 'positive' | 'neutral' | 'challenging';
  suggestion: string;
}

export interface Recommendation {
  type: 'course' | 'practice' | 'reflection' | 'assessment';
  slug?: string;
  title: string;
  reason: string;
  pillar: Pillar;
  priority: 'high' | 'medium' | 'low';
}

export interface ReassessmentSuggestion {
  assessmentType: string;
  reason: string;
  urgency: 'soon' | 'when-ready' | 'optional';
}

// ============================================================================
// DATA GATHERING FOR AI
// ============================================================================

interface AnalysisContext {
  journalEntries: Array<{
    content: string;
    mood?: string;
    createdAt: Date;
  }>;
  dreamEntries: Array<{
    content: string;
    emotions?: string[];
    symbols?: string[];
    interpretation?: string;
  }>;
  checkIns: Array<{
    promptType: string;
    response: string;
    createdAt: Date;
  }>;
  exerciseResponses: Array<{
    courseSlug: string;
    value: string;
  }>;
  assessmentSummaries: {
    archetype?: string;
    attachment?: string;
    nervousSystem?: string;
  };
  profile: {
    primaryIntention?: string;
    lifeSituation?: string;
    currentChallenges?: string[];
  };
}

/**
 * Gather rich context for AI analysis
 */
export async function gatherAnalysisContext(userId: string): Promise<AnalysisContext> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    journalEntries,
    dreamEntries,
    checkIns,
    exerciseResponses,
    assessments,
    profile,
  ] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { content: true, mood: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit for context window
    }),
    prisma.dreamEntry.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { content: true, emotions: true, symbols: true, interpretation: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.integrationCheckIn.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { promptType: true, response: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.exerciseResponse.findMany({
      where: { userId },
      select: { courseSlug: true, value: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.assessmentResult.findMany({
      where: { userId },
      select: { type: true, summary: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        primaryIntention: true,
        lifeSituation: true,
        currentChallenges: true,
      },
    }),
  ]);

  // Parse assessment summaries
  const assessmentSummaries: AnalysisContext['assessmentSummaries'] = {};
  for (const a of assessments) {
    if (a.type === 'archetype' && a.summary) {
      assessmentSummaries.archetype = a.summary;
    } else if (a.type === 'attachment' && a.summary) {
      assessmentSummaries.attachment = a.summary;
    } else if (a.type === 'nervous-system' && a.summary) {
      assessmentSummaries.nervousSystem = a.summary;
    }
  }

  return {
    journalEntries: journalEntries.map(j => ({
      content: j.content,
      mood: j.mood ?? undefined,
      createdAt: j.createdAt,
    })),
    dreamEntries: dreamEntries.map(d => ({
      content: d.content,
      emotions: d.emotions ? JSON.parse(d.emotions) : undefined,
      symbols: d.symbols ? JSON.parse(d.symbols) : undefined,
      interpretation: d.interpretation ?? undefined,
    })),
    checkIns,
    exerciseResponses,
    assessmentSummaries,
    profile: {
      primaryIntention: profile?.primaryIntention ?? undefined,
      lifeSituation: profile?.lifeSituation ?? undefined,
      currentChallenges: profile?.currentChallenges
        ? JSON.parse(profile.currentChallenges)
        : undefined,
    },
  };
}

// ============================================================================
// AI ANALYSIS
// ============================================================================

/**
 * Build the system prompt for health analysis
 */
function buildAnalysisPrompt(): string {
  return `You are a wise integration guide analyzing a user's recent reflections, journal entries, dreams, and check-ins to understand where they are in their development journey.

You understand the four pillars of integration:
- MIND: Shadow work, emotional intelligence, cognitive clarity, pattern recognition
- BODY: Nervous system regulation, physical vitality, embodiment, somatic awareness
- SOUL: Meaningfulness, spiritual practice, presence, inner stillness
- RELATIONSHIPS: Attachment security, boundaries, intimacy, connection

You understand the development spectrum stages:
- COLLAPSE: Crisis states, acute distress, need for stabilization
- REGULATION: Building safety, nervous system work, grounding
- INTEGRATION: Core development work - shadow, patterns, emotional processing
- EMBODIMENT: Living wisdom, sustainable practice, values alignment
- OPTIMIZATION: Peak performance from solid foundations (only for those with strong foundations)

Your analysis should be:
- Compassionate but honest
- Grounded in what you actually observe in their writing
- Specific with evidence from their entries
- Practical with suggestions for next steps
- Sensitive to their current capacity

Return your analysis as JSON with this structure:
{
  "overallInsight": "A 2-3 sentence summary of where this person is in their journey",
  "pillarInsights": {
    "mind": {
      "stage": "regulation|integration|embodiment|etc",
      "insight": "What you notice about their psychological/emotional work",
      "evidence": ["Specific quotes or observations"],
      "growthEdge": "The next step for growth in this area"
    },
    // ... same for body, soul, relationships
  },
  "themes": ["Recurring themes in their reflections"],
  "emotionalPatterns": [
    {
      "pattern": "Description of a pattern",
      "frequency": "frequent|occasional|etc",
      "impact": "positive|challenging|neutral",
      "suggestion": "What might help"
    }
  ],
  "recommendations": [
    {
      "type": "course|practice|reflection|assessment",
      "title": "Name of recommendation",
      "reason": "Why this would help",
      "pillar": "mind|body|soul|relationships",
      "priority": "high|medium|low"
    }
  ],
  "reassessmentNeeded": [
    {
      "assessmentType": "archetype|attachment|nervous-system",
      "reason": "Why reassessment might be valuable",
      "urgency": "soon|when-ready|optional"
    }
  ]
}`;
}

/**
 * Build the user message with context
 */
function buildUserMessage(context: AnalysisContext): string {
  const parts: string[] = [];

  // Profile context
  if (context.profile.primaryIntention || context.profile.lifeSituation) {
    parts.push(`## User Context
Primary intention: ${context.profile.primaryIntention || 'Not specified'}
Life situation: ${context.profile.lifeSituation || 'Not specified'}
Current challenges: ${context.profile.currentChallenges?.join(', ') || 'Not specified'}`);
  }

  // Assessment summaries
  if (Object.keys(context.assessmentSummaries).length > 0) {
    parts.push(`## Previous Assessments`);
    if (context.assessmentSummaries.archetype) {
      parts.push(`Archetype: ${context.assessmentSummaries.archetype}`);
    }
    if (context.assessmentSummaries.attachment) {
      parts.push(`Attachment: ${context.assessmentSummaries.attachment}`);
    }
    if (context.assessmentSummaries.nervousSystem) {
      parts.push(`Nervous System: ${context.assessmentSummaries.nervousSystem}`);
    }
  }

  // Journal entries
  if (context.journalEntries.length > 0) {
    parts.push(`## Recent Journal Entries (last 30 days)`);
    for (const entry of context.journalEntries.slice(0, 10)) {
      const date = entry.createdAt.toLocaleDateString();
      const mood = entry.mood ? ` [Mood: ${entry.mood}]` : '';
      // Truncate long entries
      const content = entry.content.length > 500
        ? entry.content.substring(0, 500) + '...'
        : entry.content;
      parts.push(`${date}${mood}:\n${content}\n`);
    }
  }

  // Dream entries
  if (context.dreamEntries.length > 0) {
    parts.push(`## Recent Dreams`);
    for (const dream of context.dreamEntries.slice(0, 5)) {
      const emotions = dream.emotions?.join(', ') || '';
      const symbols = dream.symbols?.join(', ') || '';
      const content = dream.content.length > 300
        ? dream.content.substring(0, 300) + '...'
        : dream.content;
      parts.push(`Dream: ${content}
${emotions ? `Emotions: ${emotions}` : ''}
${symbols ? `Symbols: ${symbols}` : ''}`);
    }
  }

  // Check-ins
  if (context.checkIns.length > 0) {
    parts.push(`## Integration Check-ins`);
    for (const checkIn of context.checkIns.slice(0, 5)) {
      parts.push(`${checkIn.promptType}: ${checkIn.response}`);
    }
  }

  // Exercise responses (sample)
  if (context.exerciseResponses.length > 0) {
    parts.push(`## Course Exercise Responses (sample)`);
    for (const response of context.exerciseResponses.slice(0, 5)) {
      const value = response.value.length > 200
        ? response.value.substring(0, 200) + '...'
        : response.value;
      parts.push(`[${response.courseSlug}]: ${value}`);
    }
  }

  parts.push(`\nBased on this information, provide your analysis of where this person is in their integration journey across all four pillars.`);

  return parts.join('\n\n');
}

/**
 * Run AI analysis on user's reflective content
 */
export async function analyzeUserHealth(userId: string): Promise<HealthAnalysis | null> {
  try {
    const context = await gatherAnalysisContext(userId);

    // Check if there's enough data to analyze
    const hasData = context.journalEntries.length > 0 ||
                    context.checkIns.length > 0 ||
                    context.dreamEntries.length > 0;

    if (!hasData) {
      return null; // Not enough data for meaningful analysis
    }

    const systemPrompt = buildAnalysisPrompt();
    const userMessage = buildUserMessage(context);

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('AI analysis failed:', response.status);
      return null;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Strip think tags if present
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from AI response');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]) as HealthAnalysis;
    return analysis;
  } catch (error) {
    console.error('Error in AI health analysis:', error);
    return null;
  }
}

// ============================================================================
// HEALTH SESSION (Weekly Check-in)
// ============================================================================

interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Build system prompt for health session
 */
function buildSessionPrompt(healthSnapshot: { pillars: Record<Pillar, { stage: SpectrumStage; score: number }> }): string {
  const pillarSummary = Object.entries(healthSnapshot.pillars)
    .map(([pillar, data]) => `${PILLAR_INFO[pillar as Pillar].name}: ${STAGE_INFO[data.stage].name} (${data.score}%)`)
    .join('\n');

  return `You are a compassionate integration guide conducting a weekly health check-in.

The user's current integration health:
${pillarSummary}

Your role is to:
1. Check in on how they're feeling in each of the four pillars
2. Listen for changes since their last check-in
3. Notice patterns or shifts
4. Offer gentle observations
5. Suggest adjustments to their practice

Guidelines:
- Be warm but not saccharine
- Ask one question at a time
- Let them guide the depth of the conversation
- Validate their experience before offering suggestions
- Be honest if you notice concerning patterns
- Stay grounded - no spiritual bypassing

Start by asking how they've been feeling lately, especially in the area that seems to need most attention based on their scores.`;
}

/**
 * Continue a health session conversation
 */
export async function continueHealthSession(
  userId: string,
  sessionId: string,
  userMessage: string,
  healthSnapshot: { pillars: Record<Pillar, { stage: SpectrumStage; score: number }> }
): Promise<{ response: string; sessionComplete: boolean; healthUpdates?: Record<string, unknown> }> {
  // Get existing session
  const session = await prisma.healthSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Session not found');
  }

  // Parse existing messages
  const messages: SessionMessage[] = JSON.parse(session.messages);

  // Add user message
  messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  });

  // Build conversation for AI
  const systemPrompt = buildSessionPrompt(healthSnapshot);
  const aiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  // Call AI
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen/qwen3-32b',
      messages: aiMessages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error('AI response failed');
  }

  const data = await response.json();
  let assistantContent = data.choices?.[0]?.message?.content || '';
  assistantContent = assistantContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Add assistant message
  messages.push({
    role: 'assistant',
    content: assistantContent,
    timestamp: new Date(),
  });

  // Check if session should be complete (after ~6-8 exchanges)
  const sessionComplete = messages.length >= 12;

  // Update session
  await prisma.healthSession.update({
    where: { id: sessionId },
    data: {
      messages: JSON.stringify(messages),
      status: sessionComplete ? 'completed' : 'in_progress',
    },
  });

  return {
    response: assistantContent,
    sessionComplete,
  };
}

/**
 * Start a new health session
 */
export async function startHealthSession(
  userId: string,
  type: 'weekly-checkin' | 'crisis-support' | 'progress-review' = 'weekly-checkin'
): Promise<{ sessionId: string; initialMessage: string }> {
  // Get health snapshot for context
  const { getOrCreateHealth } = await import('./integration-health');
  const health = await getOrCreateHealth(userId);

  const systemPrompt = buildSessionPrompt(health);

  // Generate initial message
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen/qwen3-32b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Start the check-in.' },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to start session');
  }

  const data = await response.json();
  let initialMessage = data.choices?.[0]?.message?.content || '';
  initialMessage = initialMessage.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Create session
  const session = await prisma.healthSession.create({
    data: {
      userId,
      type,
      messages: JSON.stringify([
        { role: 'assistant', content: initialMessage, timestamp: new Date() },
      ]),
      status: 'in_progress',
    },
  });

  return {
    sessionId: session.id,
    initialMessage,
  };
}

// ============================================================================
// REASSESSMENT TRIGGERS
// ============================================================================

/**
 * Check if user should be prompted to reassess
 */
export async function checkReassessmentTriggers(userId: string): Promise<ReassessmentSuggestion[]> {
  const triggers: ReassessmentSuggestion[] = [];

  // Get assessment dates
  const assessments = await prisma.assessmentResult.findMany({
    where: { userId },
    select: { type: true, updatedAt: true },
  });

  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Check each assessment type
  for (const assessment of assessments) {
    if (assessment.updatedAt < threeMonthsAgo) {
      triggers.push({
        assessmentType: assessment.type,
        reason: `It's been over 3 months since your last ${assessment.type} assessment. Your patterns may have shifted.`,
        urgency: 'when-ready',
      });
    }
  }

  // Check for missing assessments
  const assessmentTypes = ['archetype', 'attachment', 'nervous-system'];
  const existingTypes = assessments.map(a => a.type);

  for (const type of assessmentTypes) {
    if (!existingTypes.includes(type)) {
      triggers.push({
        assessmentType: type,
        reason: `You haven't taken the ${type} assessment yet. This helps personalize your journey.`,
        urgency: 'soon',
      });
    }
  }

  // Check for activity patterns that suggest reassessment
  const recentJournals = await prisma.journalEntry.count({
    where: {
      userId,
      createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
    },
  });

  if (recentJournals >= 10) {
    // High activity might indicate life changes
    const nervousSystemAssessment = assessments.find(a => a.type === 'nervous-system');
    if (nervousSystemAssessment && nervousSystemAssessment.updatedAt < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      triggers.push({
        assessmentType: 'nervous-system',
        reason: 'You\'ve been journaling frequently. Checking your nervous system state might provide useful insights.',
        urgency: 'optional',
      });
    }
  }

  return triggers;
}

/**
 * Save reassessment triggers to database
 */
export async function createReassessmentTriggers(userId: string, triggers: ReassessmentSuggestion[]): Promise<void> {
  // Clear old pending triggers
  await prisma.reassessmentTrigger.deleteMany({
    where: { userId, status: 'pending' },
  });

  // Create new triggers
  for (const trigger of triggers) {
    await prisma.reassessmentTrigger.create({
      data: {
        userId,
        assessmentType: trigger.assessmentType,
        reason: trigger.reason === 'soon' ? 'activity-detected' : 'time-based',
        context: JSON.stringify(trigger),
        status: 'pending',
      },
    });
  }
}
