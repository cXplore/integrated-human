/**
 * JOURNAL QUALITY EVALUATOR
 *
 * AI-powered evaluation of journal entries to assess depth, specificity,
 * self-reflection, and emotional honesty. Used for progress gates in courses.
 */

import {
  JournalVerification,
  JournalQualityCriteria,
  VerificationResult,
  SkillLevel,
} from './types';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';

// =============================================================================
// PROMPTS
// =============================================================================

function buildJournalEvaluationPrompt(
  context: {
    courseSlug: string;
    moduleSlug: string;
    prompt: string;
    minimumScore: number;
  }
): string {
  return `You are an expert evaluator of personal development journal entries. Your role is to assess whether a journal entry demonstrates genuine engagement with the material, not just completion.

CONTEXT:
- Course: ${context.courseSlug}
- Module: ${context.moduleSlug}
- The user was given this prompt: "${context.prompt}"
- Minimum passing score: ${context.minimumScore}/100

EVALUATION CRITERIA (score each 0-100):

1. DEPTH (weight: 25%)
   - Surface level (0-20): Generic statements, platitudes, or intellectual-only responses
   - Moderate (21-40): Some personal connection but stays safe
   - Good (41-60): Genuine exploration with some vulnerable moments
   - Deep (61-80): Sustained engagement with difficult material
   - Profound (81-100): Breakthrough insight, transformation visible in the writing

2. SPECIFICITY (weight: 25%)
   - Vague (0-20): Could apply to anyone, no personal examples
   - General (21-40): Some personal references but still abstract
   - Specific (41-60): Clear personal examples from their life
   - Detailed (61-80): Rich detail, specific people/moments/situations
   - Vivid (81-100): Brings you into their experience

3. SELF-REFLECTION (weight: 20%)
   - Absent (0-20): Describes events without examining self
   - Beginning (21-40): Notices some reactions but doesn't explore
   - Present (41-60): Examines their role, patterns, or reactions
   - Deep (61-80): Connects current patterns to origins/history
   - Integrated (81-100): Sees themselves with compassion AND honesty

4. PATTERN RECOGNITION (weight: 15%)
   - None (0-20): No awareness of patterns
   - Emerging (21-40): Vague sense something repeats
   - Clear (41-60): Identifies specific patterns
   - Connected (61-80): Sees how patterns link to other areas
   - Systemic (81-100): Understands the whole pattern system

5. EMOTIONAL HONESTY (weight: 15%)
   - Guarded (0-20): Intellectualized, emotions avoided
   - Cautious (21-40): Names emotions but keeps distance
   - Present (41-60): Feels emotions while writing
   - Vulnerable (61-80): Shares difficult emotions openly
   - Raw (81-100): Unflinching honesty about hard feelings

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "criteria": {
    "depth": <number 0-100>,
    "specificity": <number 0-100>,
    "selfReflection": <number 0-100>,
    "patternRecognition": <number 0-100>,
    "emotionalHonesty": <number 0-100>
  },
  "overall": <weighted average>,
  "level": "<emerging|developing|competent|proficient|masterful>",
  "result": "<pass|needs-depth|try-again>",
  "feedback": "<2-3 sentences of compassionate, specific feedback>",
  "specificFeedback": ["<specific observation 1>", "<specific observation 2>"],
  "strengths": ["<what they did well>"],
  "growthEdges": ["<where they could go deeper>"],
  "promptsForDeeper": ["<follow-up question if needs more depth>", "<another prompt>"]
}

SCORING GUIDELINES:
- pass: overall >= ${context.minimumScore} AND no single criterion below 30
- needs-depth: overall >= ${context.minimumScore - 15} OR one criterion notably weak
- try-again: overall < ${context.minimumScore - 15} OR multiple criteria very low

Be compassionate but honest. The point is to help them grow, not to make them feel bad.
But also don't pass entries that are clearly surface-level or going through the motions.`;
}

// =============================================================================
// EVALUATION
// =============================================================================

export async function evaluateJournalEntry(
  entry: string,
  context: {
    courseSlug: string;
    moduleSlug: string;
    prompt: string;
    minimumScore?: number;
  }
): Promise<JournalVerification> {
  const minimumScore = context.minimumScore ?? 60;

  const systemPrompt = buildJournalEvaluationPrompt({
    ...context,
    minimumScore,
  });

  const userPrompt = `JOURNAL ENTRY TO EVALUATE:

${entry}

Evaluate this entry against the criteria. Be specific about what works and what could go deeper.`;

  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Strip think tags if present
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return normalizeJournalVerification(evaluation, minimumScore);
  } catch (error) {
    console.error('Journal evaluation error:', error);
    // Return a fallback that requires human review
    return createFallbackVerification(entry);
  }
}

function normalizeJournalVerification(
  raw: Record<string, unknown>,
  minimumScore: number
): JournalVerification {
  const rawCriteria = (raw.criteria ?? {}) as Record<string, unknown>;
  const criteria: JournalQualityCriteria = {
    depth: clampScore((rawCriteria.depth as number) ?? 50),
    specificity: clampScore((rawCriteria.specificity as number) ?? 50),
    selfReflection: clampScore((rawCriteria.selfReflection as number) ?? 50),
    patternRecognition: clampScore((rawCriteria.patternRecognition as number) ?? 50),
    emotionalHonesty: clampScore((rawCriteria.emotionalHonesty as number) ?? 50),
  };

  // Calculate weighted average
  const overall = Math.round(
    criteria.depth * 0.25 +
    criteria.specificity * 0.25 +
    criteria.selfReflection * 0.20 +
    criteria.patternRecognition * 0.15 +
    criteria.emotionalHonesty * 0.15
  );

  const level = scoreToLevel(overall);
  const result = determineResult(overall, criteria, minimumScore);

  return {
    criteria,
    overall,
    level,
    result,
    feedback: String(raw.feedback || 'Thank you for your reflection.'),
    specificFeedback: ensureStringArray(raw.specificFeedback),
    strengths: ensureStringArray(raw.strengths),
    growthEdges: ensureStringArray(raw.growthEdges),
    promptsForDeeper: ensureStringArray(raw.promptsForDeeper),
  };
}

function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function scoreToLevel(score: number): SkillLevel {
  if (score >= 81) return 'masterful';
  if (score >= 61) return 'proficient';
  if (score >= 41) return 'competent';
  if (score >= 21) return 'developing';
  return 'emerging';
}

function determineResult(
  overall: number,
  criteria: JournalQualityCriteria,
  minimumScore: number
): VerificationResult {
  // Check for any critically low scores
  const scores = Object.values(criteria);
  const hasVeryLow = scores.some(s => s < 20);
  const hasLow = scores.some(s => s < 30);

  if (hasVeryLow || overall < minimumScore - 15) {
    return 'try-again';
  }

  if (hasLow || overall < minimumScore) {
    return 'needs-depth';
  }

  return 'pass';
}

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(v => typeof v === 'string');
  }
  return [];
}

function createFallbackVerification(entry: string): JournalVerification {
  // When AI fails, do basic heuristic check
  const wordCount = entry.split(/\s+/).length;
  const hasI = /\bI\b/g.test(entry);
  const hasEmotionWords = /feel|felt|emotion|anxious|happy|sad|angry|scared|loved|hurt/i.test(entry);
  const hasSpecificWords = /when|because|example|remember|yesterday|today|she said|he said/i.test(entry);

  const baseScore = Math.min(100, Math.max(20,
    (wordCount > 50 ? 20 : 10) +
    (wordCount > 150 ? 20 : 10) +
    (hasI ? 15 : 0) +
    (hasEmotionWords ? 20 : 0) +
    (hasSpecificWords ? 15 : 0)
  ));

  return {
    criteria: {
      depth: baseScore,
      specificity: baseScore,
      selfReflection: baseScore,
      patternRecognition: baseScore,
      emotionalHonesty: baseScore,
    },
    overall: baseScore,
    level: scoreToLevel(baseScore),
    result: baseScore >= 60 ? 'pass' : 'needs-depth',
    feedback: 'Your entry has been received. For deeper feedback, please try again later.',
    specificFeedback: [],
    strengths: ['You showed up and wrote.'],
    growthEdges: ['Consider adding more specific personal examples.'],
    promptsForDeeper: ['What specific moment or situation are you reflecting on?'],
  };
}

// =============================================================================
// BATCH EVALUATION
// =============================================================================

/**
 * Evaluate multiple journal entries and return aggregate scores
 * Useful for final assessment or overall progress evaluation
 */
export async function evaluateJournalSeries(
  entries: Array<{ content: string; prompt: string; date: Date }>,
  context: {
    courseSlug: string;
    minimumAverage?: number;
  }
): Promise<{
  evaluations: JournalVerification[];
  averageScore: number;
  growth: 'declining' | 'stable' | 'improving' | 'breakthrough';
  overallResult: VerificationResult;
  summary: string;
}> {
  const evaluations: JournalVerification[] = [];

  // Evaluate each entry
  for (const entry of entries) {
    const evaluation = await evaluateJournalEntry(entry.content, {
      courseSlug: context.courseSlug,
      moduleSlug: 'series-evaluation',
      prompt: entry.prompt,
      minimumScore: context.minimumAverage ?? 60,
    });
    evaluations.push(evaluation);
  }

  // Calculate aggregate metrics
  const scores = evaluations.map(e => e.overall);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Detect growth trajectory
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const growthDelta = secondAvg - firstAvg;

  let growth: 'declining' | 'stable' | 'improving' | 'breakthrough';
  if (growthDelta < -10) growth = 'declining';
  else if (growthDelta < 5) growth = 'stable';
  else if (growthDelta < 15) growth = 'improving';
  else growth = 'breakthrough';

  // Determine overall result
  const minimumAverage = context.minimumAverage ?? 60;
  const passCount = evaluations.filter(e => e.result === 'pass').length;
  const passRate = passCount / evaluations.length;

  let overallResult: VerificationResult;
  if (averageScore >= minimumAverage && passRate >= 0.7) {
    overallResult = 'pass';
  } else if (averageScore >= minimumAverage - 10 && passRate >= 0.5) {
    overallResult = 'needs-depth';
  } else {
    overallResult = 'try-again';
  }

  // Generate summary
  const summary = generateSeriesSummary(evaluations, growth, averageScore);

  return {
    evaluations,
    averageScore,
    growth,
    overallResult,
    summary,
  };
}

function generateSeriesSummary(
  evaluations: JournalVerification[],
  growth: string,
  averageScore: number
): string {
  const strengths = evaluations.flatMap(e => e.strengths);
  const edges = evaluations.flatMap(e => e.growthEdges);

  const uniqueStrengths = [...new Set(strengths)].slice(0, 3);
  const uniqueEdges = [...new Set(edges)].slice(0, 3);

  let summary = `Your journal entries show ${scoreToLevel(averageScore)} level reflection overall. `;

  switch (growth) {
    case 'breakthrough':
      summary += 'There is clear growth in depth and insight across your entries - your later reflections show significant deepening. ';
      break;
    case 'improving':
      summary += 'Your reflections are getting deeper as you progress through the material. ';
      break;
    case 'stable':
      summary += 'Your reflection quality is consistent throughout. ';
      break;
    case 'declining':
      summary += 'Your earlier entries showed more depth - you may want to revisit the practice with fresh attention. ';
      break;
  }

  if (uniqueStrengths.length > 0) {
    summary += `Strengths: ${uniqueStrengths.join('; ')}. `;
  }

  if (uniqueEdges.length > 0) {
    summary += `Areas for growth: ${uniqueEdges.join('; ')}.`;
  }

  return summary;
}
