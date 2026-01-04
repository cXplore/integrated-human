/**
 * SKILL DEMONSTRATION EVALUATOR
 *
 * AI-powered evaluation of skill demonstrations through scenarios.
 * Users are presented with a situation and must respond as they would in real life.
 * The AI evaluates their response against a rubric.
 */

import {
  SkillDemonstrationScenario,
  SkillDemonstrationEvaluation,
  SkillRubricItem,
  SkillCategory,
  SkillLevel,
  VerificationResult,
} from './types';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';

// =============================================================================
// SCENARIO LIBRARY
// =============================================================================

export const SKILL_SCENARIOS: SkillDemonstrationScenario[] = [
  // REPAIR CONVERSATIONS
  {
    id: 'repair-forgotten-important',
    category: 'repair-conversation',
    title: 'The Forgotten Anniversary',
    description: 'Demonstrate repair skills after forgetting something important',
    context: `Your partner confronts you: "I can't believe you forgot our anniversary. I've been planning this for weeks and you didn't even remember. It's like I don't matter to you."

They are clearly hurt and angry. You genuinely forgot - you've been stressed with work.

Write out what you would say to them. Include the full conversation as you imagine it unfolding.`,
    difficulty: 'intermediate',
    dimensions: ['conflict-repair', 'communication', 'empathy-attunement'],
    rubric: [
      {
        criterion: 'acknowledgment',
        description: 'Acknowledges the hurt without defending',
        weight: 0.25,
        levels: {
          emerging: 'Jumps to explaining or defending',
          developing: 'Brief acknowledgment then explains',
          competent: 'Acknowledges hurt before anything else',
          proficient: 'Fully receives their pain, validates it specifically',
          masterful: 'Creates space for them to feel fully heard before anything else',
        },
      },
      {
        criterion: 'ownership',
        description: 'Takes clear responsibility',
        weight: 0.25,
        levels: {
          emerging: 'Blames circumstances, makes excuses',
          developing: 'Partial ownership with qualifications',
          competent: 'Clear "I forgot, I\'m sorry"',
          proficient: 'Takes full ownership of impact, not just action',
          masterful: 'Owns the pattern if relevant, not just the incident',
        },
      },
      {
        criterion: 'understanding-impact',
        description: 'Demonstrates understanding of impact on partner',
        weight: 0.25,
        levels: {
          emerging: 'Minimizes or misses the impact',
          developing: 'Acknowledges they\'re upset generically',
          competent: 'Names the specific hurt they caused',
          proficient: 'Connects to what it might mean to partner',
          masterful: 'Shows understanding of the deeper relational message',
        },
      },
      {
        criterion: 'repair-action',
        description: 'Offers meaningful repair',
        weight: 0.25,
        levels: {
          emerging: 'No repair offered or dismissive "I\'ll make it up"',
          developing: 'Generic promise to do better',
          competent: 'Specific action to repair',
          proficient: 'Repair that addresses the underlying need',
          masterful: 'Repair that rebuilds trust and reconnects',
        },
      },
    ],
  },
  // BOUNDARY SETTING
  {
    id: 'boundary-parent-criticism',
    category: 'boundary-setting',
    title: 'The Critical Parent',
    description: 'Set a boundary with a parent who criticizes your life choices',
    context: `You're at a family dinner. Your parent says (for the third time this month): "When are you going to get a real job? This [career/lifestyle choice] of yours isn't going to lead anywhere. Your cousin just got promoted again - they're doing so well."

Other family members are watching. You've asked them to stop this before, but they keep doing it.

Write out how you would respond. Include the boundary you would set and how you would hold it if they push back.`,
    difficulty: 'advanced',
    dimensions: ['boundaries', 'communication', 'self-relationship'],
    rubric: [
      {
        criterion: 'clarity',
        description: 'Boundary is clear and specific',
        weight: 0.25,
        levels: {
          emerging: 'Vague hints at discomfort',
          developing: 'Says they don\'t like it but no clear boundary',
          competent: 'States the boundary clearly',
          proficient: 'Boundary includes the limit AND the consequence',
          masterful: 'Crystal clear, no room for misinterpretation',
        },
      },
      {
        criterion: 'self-possession',
        description: 'Maintains emotional regulation while setting boundary',
        weight: 0.25,
        levels: {
          emerging: 'Reactive, attacking, or collapsing',
          developing: 'Manages to state boundary but clearly triggered',
          competent: 'Stays regulated enough to be clear',
          proficient: 'Grounded and calm throughout',
          masterful: 'Self-possessed, can be firm AND kind',
        },
      },
      {
        criterion: 'non-defensive',
        description: 'Doesn\'t justify or over-explain',
        weight: 0.25,
        levels: {
          emerging: 'Long defensive explanations',
          developing: 'Some justification alongside boundary',
          competent: 'States position without extensive justification',
          proficient: '"No" is a complete sentence energy',
          masterful: 'Confident without needing approval',
        },
      },
      {
        criterion: 'holding',
        description: 'Demonstrates ability to hold the boundary if challenged',
        weight: 0.25,
        levels: {
          emerging: 'No plan for pushback, or would likely cave',
          developing: 'Aware they might push but unsure how to handle',
          competent: 'Has a plan for repeated violations',
          proficient: 'Shows they\'ve already held this boundary',
          masterful: 'Ready to follow through on consequence with love',
        },
      },
    ],
  },
  // EMOTIONAL REGULATION
  {
    id: 'regulation-criticism-triggered',
    category: 'emotional-regulation',
    title: 'Receiving Criticism',
    description: 'Regulate when receiving difficult feedback',
    context: `A colleague gives you feedback on a project you worked hard on: "Honestly, this isn't what we needed. I thought you understood the requirements better. We're going to have to start over, and now we're behind schedule."

You feel your face flush. Your stomach drops. That inner voice says "You're a failure. You can never do anything right."

Describe: What's happening in your body? What are you feeling? And how would you respond - both internally (what you would do to regulate yourself) and externally (what you would say)?`,
    difficulty: 'intermediate',
    dimensions: ['emotional-regulation', 'self-relationship', 'psychological-safety'],
    rubric: [
      {
        criterion: 'body-awareness',
        description: 'Notices and names physical experience',
        weight: 0.20,
        levels: {
          emerging: 'No mention of body sensations',
          developing: 'Generic "felt bad"',
          competent: 'Names specific sensations',
          proficient: 'Tracks sensations with nuance',
          masterful: 'Rich somatic awareness, can track shifts',
        },
      },
      {
        criterion: 'emotion-identification',
        description: 'Identifies emotions accurately',
        weight: 0.20,
        levels: {
          emerging: 'Can\'t name emotions',
          developing: 'Names one basic emotion',
          competent: 'Names multiple emotions',
          proficient: 'Distinguishes layers (shame under anger)',
          masterful: 'Nuanced emotional landscape',
        },
      },
      {
        criterion: 'regulation-strategy',
        description: 'Uses effective regulation strategies',
        weight: 0.30,
        levels: {
          emerging: 'No strategy or maladaptive (lashing out, numbing)',
          developing: 'Avoidance-based strategy only',
          competent: 'Uses one healthy strategy (breathing, grounding)',
          proficient: 'Matches strategy to what\'s needed',
          masterful: 'Flexible repertoire, applied skillfully',
        },
      },
      {
        criterion: 'response-quality',
        description: 'Response is regulated rather than reactive',
        weight: 0.30,
        levels: {
          emerging: 'Reactive (defensive, shut down, attacking)',
          developing: 'Manages to hold back but not respond well',
          competent: 'Responds reasonably once regulated',
          proficient: 'Can be curious about feedback while feeling it',
          masterful: 'Uses the activation as information',
        },
      },
    ],
  },
  // VULNERABILITY EXPRESSION
  {
    id: 'vulnerability-asking-need',
    category: 'vulnerability-expression',
    title: 'Asking for What You Need',
    description: 'Express a vulnerable need to someone close',
    context: `You've been feeling disconnected from your partner/close friend lately. You miss them. You want more quality time together, more presence when you're together.

They haven't done anything wrong per se - life has just gotten busy. But you feel the distance and it hurts.

Write out how you would bring this up to them. Express what you're feeling and what you need.`,
    difficulty: 'intermediate',
    dimensions: ['trust-vulnerability', 'communication', 'intimacy-depth'],
    rubric: [
      {
        criterion: 'vulnerability-depth',
        description: 'Actually shares the vulnerable feeling',
        weight: 0.30,
        levels: {
          emerging: 'Criticizes or complains without sharing feelings',
          developing: 'Hints at feelings but stays protected',
          competent: 'Names the feeling openly',
          proficient: 'Shares the vulnerability under the surface',
          masterful: 'Full openness without weaponizing',
        },
      },
      {
        criterion: 'ownership',
        description: 'Owns the need as their own',
        weight: 0.25,
        levels: {
          emerging: '"You never..." language',
          developing: 'Mix of ownership and blame',
          competent: '"I" statements throughout',
          proficient: 'Clear ownership of need without making other wrong',
          masterful: 'Takes responsibility for their part in the pattern',
        },
      },
      {
        criterion: 'request-clarity',
        description: 'Makes a clear, doable request',
        weight: 0.25,
        levels: {
          emerging: 'No request, or vague "pay more attention"',
          developing: 'Request present but unclear',
          competent: 'Specific request made',
          proficient: 'Request is specific, doable, and negotiable',
          masterful: 'Invites collaboration on meeting the need',
        },
      },
      {
        criterion: 'non-manipulation',
        description: 'Request is clean, not guilt-inducing',
        weight: 0.20,
        levels: {
          emerging: 'Guilt trips, manipulation, or punishment',
          developing: 'Some guilt-inducing language',
          competent: 'Request without manipulation',
          proficient: 'Clean request that preserves other\'s autonomy',
          masterful: 'Vulnerable AND respecting of other\'s freedom',
        },
      },
    ],
  },
  // SHADOW RECOGNITION
  {
    id: 'shadow-projection-recognition',
    category: 'shadow-recognition',
    title: 'Recognizing Projection',
    description: 'Identify a shadow projection in yourself',
    context: `Think of someone who really irritates you - someone whose behavior you find almost unbearable. Maybe they're selfish, controlling, attention-seeking, passive-aggressive, or judgmental.

Describe:
1. What specifically about them bothers you?
2. Where might this quality exist in you (even in small ways or in disguise)?
3. What might this shadow aspect be protecting in you?`,
    difficulty: 'advanced',
    dimensions: ['shadow-integration', 'self-awareness', 'self-relationship'],
    rubric: [
      {
        criterion: 'projection-specificity',
        description: 'Names the projection specifically',
        weight: 0.20,
        levels: {
          emerging: 'Vague "they\'re annoying"',
          developing: 'Names behavior but not what it triggers',
          competent: 'Clear about what bothers them and the charge',
          proficient: 'Notices the intensity of their reaction',
          masterful: 'Sees the charge as the clue',
        },
      },
      {
        criterion: 'self-honesty',
        description: 'Actually finds the quality in themselves',
        weight: 0.35,
        levels: {
          emerging: '"I\'m nothing like that"',
          developing: '"Maybe a little, but..."',
          competent: 'Finds genuine examples in themselves',
          proficient: 'Sees how they do this in different ways',
          masterful: 'Compassionate recognition of their own shadow',
        },
      },
      {
        criterion: 'protective-function',
        description: 'Understands what the shadow protects',
        weight: 0.25,
        levels: {
          emerging: 'No understanding of protective function',
          developing: 'Intellectual guess',
          competent: 'Reasonable understanding',
          proficient: 'Connects to their history/wounds',
          masterful: 'Sees the shadow with compassion as protector',
        },
      },
      {
        criterion: 'integration-orientation',
        description: 'Shows movement toward integration vs rejection',
        weight: 0.20,
        levels: {
          emerging: 'Still rejecting the shadow',
          developing: 'Accepting intellectually',
          competent: 'Willing to work with it',
          proficient: 'Sees the gift in the shadow',
          masterful: 'Reclaiming shadow as resource',
        },
      },
    ],
  },
];

// =============================================================================
// EVALUATION
// =============================================================================

export function getScenarioById(id: string): SkillDemonstrationScenario | undefined {
  return SKILL_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByCategory(category: SkillCategory): SkillDemonstrationScenario[] {
  return SKILL_SCENARIOS.filter(s => s.category === category);
}

export function getScenariosByDimension(dimensionId: string): SkillDemonstrationScenario[] {
  return SKILL_SCENARIOS.filter(s => s.dimensions.includes(dimensionId));
}

function buildSkillEvaluationPrompt(scenario: SkillDemonstrationScenario): string {
  const rubricText = scenario.rubric.map(r => `
${r.criterion.toUpperCase()} (weight: ${Math.round(r.weight * 100)}%):
${r.description}
- Emerging (0-20): ${r.levels.emerging}
- Developing (21-40): ${r.levels.developing}
- Competent (41-60): ${r.levels.competent}
- Proficient (61-80): ${r.levels.proficient}
- Masterful (81-100): ${r.levels.masterful}
`).join('\n');

  return `You are an expert evaluator of interpersonal and self-development skills. Your role is to assess skill demonstrations based on specific rubrics.

SCENARIO: ${scenario.title}
CONTEXT: ${scenario.context}

RUBRIC:
${rubricText}

EVALUATION GUIDELINES:
- Score each criterion 0-100 based on the rubric levels
- Be specific about what you observed in their response
- Note both strengths and growth edges
- If they demonstrate something not in the rubric but relevant, mention it
- Be compassionate but honest - the goal is growth
- Don't inflate scores - competent (41-60) is a solid, passing performance

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "rubricScores": {
    "${scenario.rubric[0].criterion}": {
      "score": <number 0-100>,
      "feedback": "<specific observation about this criterion>"
    }
    // ... one entry per rubric criterion
  },
  "overall": <weighted average>,
  "level": "<emerging|developing|competent|proficient|masterful>",
  "result": "<pass|needs-depth|try-again>",
  "feedback": "<2-3 sentences overall feedback>",
  "specificFeedback": ["<observation 1>", "<observation 2>"],
  "strengths": ["<what they did well>"],
  "growthEdges": ["<where they could develop>"],
  "modelResponse": "<brief example of a proficient-level response if score < 60>"
}

RESULT GUIDELINES:
- pass: overall >= 60 AND no criterion below 30
- needs-depth: overall 45-59 OR one criterion notably weak
- try-again: overall < 45 OR multiple criteria below 30`;
}

export async function evaluateSkillDemonstration(
  scenarioId: string,
  userResponse: string,
  options?: {
    minimumScore?: number;
  }
): Promise<SkillDemonstrationEvaluation> {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  const systemPrompt = buildSkillEvaluationPrompt(scenario);
  const userPrompt = `USER'S RESPONSE TO THE SCENARIO:

${userResponse}

Evaluate this response against the rubric. Be specific about what you observe.`;

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
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return normalizeSkillEvaluation(evaluation, scenario, userResponse);
  } catch (error) {
    console.error('Skill evaluation error:', error);
    return createFallbackSkillEvaluation(scenario, userResponse);
  }
}

function normalizeSkillEvaluation(
  raw: Record<string, unknown>,
  scenario: SkillDemonstrationScenario,
  userResponse: string
): SkillDemonstrationEvaluation {
  const rubricScores: Record<string, { score: number; feedback: string }> = {};

  // Ensure all rubric items have scores
  for (const item of scenario.rubric) {
    const rawScore = raw.rubricScores?.[item.criterion];
    rubricScores[item.criterion] = {
      score: clampScore(rawScore?.score ?? 50),
      feedback: String(rawScore?.feedback ?? 'No specific feedback available.'),
    };
  }

  // Calculate weighted overall
  let overall = 0;
  for (const item of scenario.rubric) {
    overall += rubricScores[item.criterion].score * item.weight;
  }
  overall = Math.round(overall);

  const level = scoreToLevel(overall);
  const result = determineResult(overall, rubricScores);

  return {
    scenario,
    userResponse,
    rubricScores,
    overall,
    level,
    result,
    feedback: String(raw.feedback || 'Thank you for your response.'),
    specificFeedback: ensureStringArray(raw.specificFeedback),
    strengths: ensureStringArray(raw.strengths),
    growthEdges: ensureStringArray(raw.growthEdges),
    modelResponse: overall < 60 ? String(raw.modelResponse || '') : undefined,
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
  rubricScores: Record<string, { score: number; feedback: string }>
): VerificationResult {
  const scores = Object.values(rubricScores).map(r => r.score);
  const hasVeryLow = scores.some(s => s < 20);
  const lowCount = scores.filter(s => s < 30).length;

  if (hasVeryLow || lowCount >= 2 || overall < 45) {
    return 'try-again';
  }

  if (lowCount >= 1 || overall < 60) {
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

function createFallbackSkillEvaluation(
  scenario: SkillDemonstrationScenario,
  userResponse: string
): SkillDemonstrationEvaluation {
  const wordCount = userResponse.split(/\s+/).length;
  const baseScore = Math.min(60, Math.max(30, 30 + wordCount / 10));

  const rubricScores: Record<string, { score: number; feedback: string }> = {};
  for (const item of scenario.rubric) {
    rubricScores[item.criterion] = {
      score: baseScore,
      feedback: 'Evaluation pending - please try again later.',
    };
  }

  return {
    scenario,
    userResponse,
    rubricScores,
    overall: baseScore,
    level: 'developing',
    result: 'needs-depth',
    feedback: 'Your response has been received. For detailed feedback, please try again later.',
    specificFeedback: [],
    strengths: ['You engaged with the scenario.'],
    growthEdges: ['Unable to evaluate specific growth edges at this time.'],
  };
}
