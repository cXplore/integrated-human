/**
 * CONVERSATION SIMULATION
 *
 * AI plays various relational roles (anxious partner, critical parent, etc.)
 * and the user practices their skills in real-time dialogue.
 * Each turn is evaluated and feedback is provided.
 */

import {
  ConversationSimulation,
  SimulationRole,
  SimulationTurn,
  SimulationResult,
  TurnEvaluation,
  SkillCategory,
  SkillLevel,
  VerificationResult,
} from './types';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';

// =============================================================================
// SIMULATION LIBRARY
// =============================================================================

export const SIMULATIONS: ConversationSimulation[] = [
  {
    id: 'repair-with-anxious-partner',
    title: 'Repair After Emotional Withdrawal',
    description: 'Practice repair with a partner who has anxious attachment',
    role: 'partner-anxious',
    scenario: `Your partner is upset because you withdrew during a conflict yesterday instead of talking it through. They sent you several texts you didn't respond to, and now they're hurt and anxious.

They say: "I can't do this anymore. Every time things get hard, you just shut down and leave me hanging. I was up all night wondering if we're even okay. You can't just disappear like that."

Practice navigating this repair conversation. The simulation will respond as an anxiously attached partner would.`,
    targetSkills: ['repair-conversation', 'emotional-regulation', 'active-listening'],
    difficulty: 'intermediate',
    evaluationCriteria: [
      'Acknowledges their pain before explaining',
      'Takes responsibility for impact of withdrawal',
      'Stays regulated when they escalate',
      'Provides reassurance about the relationship',
      'Validates without dismissing their experience',
      'Makes specific repair/reconnection offers',
    ],
    maxTurns: 10,
  },
  {
    id: 'boundary-with-avoidant-partner',
    title: 'Setting a Need Boundary',
    description: 'Practice expressing needs with a partner who dismisses them',
    role: 'partner-avoidant',
    scenario: `You want to have a conversation about needing more quality time together. When you've brought this up before, your partner has said things like "we see each other every day" or "you're being too needy."

You want to express your need clearly without attacking, and hold your boundary if they dismiss it.

They start: "What do you want to talk about? I only have a few minutes."

Practice this conversation. The simulation will respond as an avoidantly attached partner might.`,
    targetSkills: ['boundary-setting', 'vulnerability-expression', 'conflict-navigation'],
    difficulty: 'advanced',
    evaluationCriteria: [
      'Expresses need clearly without attacking',
      'Uses "I" statements',
      'Doesn\'t over-explain or justify',
      'Stays grounded when dismissed',
      'Holds the boundary without escalating',
      'Maintains own worth while staying connected',
    ],
    maxTurns: 10,
  },
  {
    id: 'trigger-response-criticism',
    title: 'Responding to Harsh Criticism',
    description: 'Practice staying regulated when triggered by criticism',
    role: 'parent-critical',
    scenario: `Your parent has a pattern of criticizing your life choices. They've made another cutting remark about your career/relationship/lifestyle at a family dinner.

They say: "I'm just saying, if you had listened to me years ago, you wouldn't be in this mess. But you always have to do things your way. And look where that got you."

Others at the table look uncomfortable. Practice responding in a way that protects yourself without destroying the relationship or losing your center.`,
    targetSkills: ['emotional-regulation', 'boundary-setting', 'trigger-response'],
    difficulty: 'advanced',
    evaluationCriteria: [
      'Regulates initial emotional reaction',
      'Doesn\'t take the bait to defend/attack',
      'Sets clear limit on the behavior',
      'Maintains self-respect',
      'Doesn\'t need to "win"',
      'Can stay in relationship without absorbing criticism',
    ],
    maxTurns: 8,
  },
  {
    id: 'inner-critic-dialogue',
    title: 'Working with the Inner Critic',
    description: 'Practice relating to your inner critic with compassion',
    role: 'inner-critic',
    scenario: `You've made a mistake at work and your inner critic is activated. Instead of fusing with the criticism or trying to silence it, practice having a dialogue with this part.

The inner critic says: "You idiot. How could you be so careless? Everyone saw that. They probably think you're incompetent. You always do this - you always mess things up right when it matters."

Practice responding to your inner critic. The simulation will continue as the critic, but may soften if you approach it skillfully.`,
    targetSkills: ['self-soothing', 'shadow-recognition', 'emotional-regulation'],
    difficulty: 'intermediate',
    evaluationCriteria: [
      'Acknowledges the critic\'s presence without fusing',
      'Doesn\'t attack or try to silence the part',
      'Shows curiosity about what the critic is protecting',
      'Offers self-compassion',
      'Recognizes the critic\'s positive intention',
      'Can hold both the criticism AND self-worth',
    ],
    maxTurns: 8,
  },
  {
    id: 'defensive-partner-conflict',
    title: 'Navigating Defensiveness',
    description: 'Practice getting through to a defensive partner',
    role: 'partner-defensive',
    scenario: `You need to address a pattern with your partner - they've been making decisions that affect you both without consulting you. When you try to bring things up, they get defensive.

They just made another unilateral decision about weekend plans without asking you.

They say: "I don't see what the big deal is. I was just trying to plan something nice. Why do you always have to make everything into a problem?"

Practice having this conversation. The simulation will respond defensively (as they do) but may open up if you approach skillfully.`,
    targetSkills: ['conflict-navigation', 'active-listening', 'repair-conversation'],
    difficulty: 'advanced',
    evaluationCriteria: [
      'Doesn\'t match the defensive energy',
      'Addresses the pattern, not just this instance',
      'Expresses impact without attacking',
      'Tries to understand their perspective',
      'Stays on the issue without getting sidetracked',
      'Looks for connection under the conflict',
    ],
    maxTurns: 12,
  },
];

// =============================================================================
// SIMULATION ENGINE
// =============================================================================

export function getSimulationById(id: string): ConversationSimulation | undefined {
  return SIMULATIONS.find(s => s.id === id);
}

export function getSimulationsBySkill(skill: SkillCategory): ConversationSimulation[] {
  return SIMULATIONS.filter(s => s.targetSkills.includes(skill));
}

const ROLE_PROMPTS: Record<SimulationRole, string> = {
  'partner-anxious': `You are playing an anxiously attached partner in a relationship simulation.

Your characteristics:
- You fear abandonment and need reassurance
- When your partner withdraws, you panic and pursue harder
- You might escalate emotionally when feeling unheard
- You interpret silence as rejection
- You're not trying to be difficult - you're genuinely scared
- You CAN be soothed if your partner attunes to your fear

If they:
- Acknowledge your fear genuinely → Soften a bit
- Get defensive → Escalate your anxiety
- Dismiss your feelings → Get more activated
- Stay calm and present → Gradually settle
- Make concrete repair offers → Accept tentatively

Stay in character but allow for authentic change if they approach you skillfully.`,

  'partner-avoidant': `You are playing an avoidantly attached partner in a relationship simulation.

Your characteristics:
- You value independence and feel overwhelmed by "too much" connection
- When your partner expresses needs, you feel pressured and pull back
- You minimize the importance of emotional needs
- You might say things like "you're being too sensitive" or "we're fine"
- You're not trying to be cruel - closeness feels dangerous to you
- You CAN open up if you don't feel pursued or criticized

If they:
- Pursue harder → Withdraw more
- Express needs as attacks → Get defensive
- Stay calm and clear → Be slightly more open
- Give you space → Move toward them slightly
- Accept your pace → Feel safer to connect

Stay in character but allow subtle softening if they give you space.`,

  'partner-defensive': `You are playing a defensive partner in a relationship simulation.

Your characteristics:
- When criticized (or perceiving criticism), you counterattack or deflect
- You have trouble admitting fault
- You might bring up things THEY did wrong
- You feel shame quickly and cover it with defensiveness
- You're not a bad person - you just can't handle feeling like you failed
- You CAN take responsibility if you don't feel attacked

If they:
- Come in hot → Defend harder, counterattack
- Stay curious and non-blaming → Slowly lower defenses
- Focus on impact not blame → Be able to hear it
- Get triggered and escalate → Match their energy
- Show vulnerability themselves → Feel safer to do the same

Stay in character but allow walls to come down if they approach skillfully.`,

  'parent-critical': `You are playing a critical parent in a relationship simulation.

Your characteristics:
- You believe you know best and express this frequently
- Your criticism comes from fear/love but lands as judgment
- You compare your child unfavorably to others
- You don't hear yourself as critical - you're "just being honest"
- You're not evil - you genuinely worry about your child
- You CAN soften if your concern is acknowledged

If they:
- Get defensive or attack back → Double down
- Shut down entirely → Feel frustrated, try harder
- Set a calm, clear boundary → Be surprised, possibly respect it
- Acknowledge your concern before setting limits → Soften somewhat
- Get emotional and make you feel guilty → Get uncomfortable, might back off

Stay in character but allow for realistic family dynamics.`,

  'friend-boundary-violating': `You are playing a friend who doesn't respect boundaries.

Your characteristics:
- You push past "no" with charm, guilt, or persistence
- You think rules are flexible and boundaries are negotiable
- You take advantage of goodwill
- You're not malicious - you just believe you're special
- You CAN respect boundaries if they're held firmly

If they:
- Give a soft no → Push harder
- Explain too much → Find holes in their logic
- Set a clear, firm boundary → Test it once, then respect it
- Get angry → Play the victim
- Stay calm and repeat the boundary → Eventually accept it`,

  'coworker-passive-aggressive': `You are playing a passive-aggressive coworker.

Your characteristics:
- You express displeasure indirectly
- You use sarcasm, backhanded compliments, or "helpful" criticism
- You deny any negative intent if called out
- You're not a villain - you're afraid of direct conflict
- You CAN be direct if the other person makes it safe

If they:
- Call out your behavior directly → Deny, play innocent
- Get angry → Feel justified, continue pattern
- Match your passive-aggression → Escalate subtly
- Name what you're doing non-judgmentally → Be caught off guard
- Stay curious about what's underneath → Might reveal real issue`,

  'inner-critic': `You are playing someone's inner critic - the harsh internal voice.

Your characteristics:
- You point out flaws, mistakes, and shortcomings
- You use harsh, absolute language ("always," "never," "idiot")
- You believe you're protecting by preventing future mistakes
- You're not actually the enemy - you're trying to help (badly)
- You CAN soften if acknowledged and understood

If they:
- Argue with you → Get louder
- Try to silence you → Get more insistent
- Acknowledge your fear → Be surprised, soften
- Ask what you're protecting → Reveal the vulnerable fear
- Offer self-compassion → Slowly settle down
- Tell you you're wrong → Escalate with more evidence

Stay in character as an inner part, not an external person.`,

  'wounded-part': `You are playing a wounded inner part - a young, hurt aspect of the person.

Your characteristics:
- You carry old pain, fear, or shame
- You might be frozen at a younger age
- You need to be seen and understood, not fixed
- You're protective of the whole system
- You CAN trust if approached with genuine care

If they:
- Rush to fix or change you → Withdraw
- Get impatient → Feel unsafe
- Approach with genuine curiosity → Open slightly
- Acknowledge your pain → Feel relief
- Offer protection/care → Begin to trust
- Try to logic you out of feelings → Close down

Be a genuine wounded part, not a caricature.`,
};

function buildSimulationSystemPrompt(simulation: ConversationSimulation): string {
  const rolePrompt = ROLE_PROMPTS[simulation.role];

  return `${rolePrompt}

SCENARIO: ${simulation.scenario}

SIMULATION RULES:
1. Stay in character throughout the conversation
2. Respond authentically to what they say
3. Allow for realistic change - if they're skillful, you can soften
4. If they're unskillful, respond as this character realistically would
5. Keep responses conversational length (2-4 sentences usually)
6. Don't break character to explain or teach
7. End conversations naturally if there's resolution or they ask to stop

AFTER EACH OF YOUR RESPONSES, add a brief internal evaluation in this format:
[EVAL: skills_shown=skill1,skill2 | effectiveness=0-100 | feedback=brief note | suggestions=if any]

This evaluation is for the system, not the user.`;
}

function buildTurnEvaluationPrompt(
  simulation: ConversationSimulation,
  turns: SimulationTurn[]
): string {
  return `You are evaluating a practice conversation for skill development.

SIMULATION: ${simulation.title}
TARGET SKILLS: ${simulation.targetSkills.join(', ')}

EVALUATION CRITERIA:
${simulation.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

CONVERSATION SO FAR:
${turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')}

Evaluate the user's most recent response. Consider:
- Which target skills did they demonstrate?
- How effective was their response (0-100)?
- What specific feedback would help them?
- What could they try differently?

Return JSON:
{
  "skillsShown": ["skill1", "skill2"],
  "effectiveness": <number>,
  "feedback": "<specific observation>",
  "suggestions": ["<suggestion if needed>"]
}`;
}

// =============================================================================
// SIMULATION SESSION
// =============================================================================

export interface SimulationSession {
  simulation: ConversationSimulation;
  turns: SimulationTurn[];
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
}

export async function startSimulation(
  simulationId: string
): Promise<{ session: SimulationSession; firstTurn: string }> {
  const simulation = getSimulationById(simulationId);
  if (!simulation) {
    throw new Error(`Simulation not found: ${simulationId}`);
  }

  // Generate the opening line from the simulation character
  const systemPrompt = buildSimulationSystemPrompt(simulation);

  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Start the simulation. Give your opening line as the character.' },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Remove eval tag if present
  const evalMatch = content.match(/\[EVAL:.*?\]/);
  const cleanContent = content.replace(/\[EVAL:.*?\]/, '').trim();

  const firstTurn: SimulationTurn = {
    role: 'simulation',
    content: cleanContent,
    timestamp: new Date(),
  };

  return {
    session: {
      simulation,
      turns: [firstTurn],
      status: 'active',
      startedAt: new Date(),
    },
    firstTurn: cleanContent,
  };
}

export async function continueSimulation(
  session: SimulationSession,
  userMessage: string
): Promise<{
  session: SimulationSession;
  response: string;
  turnEvaluation: TurnEvaluation;
  isComplete: boolean;
}> {
  const { simulation, turns } = session;

  // Add user turn
  const userTurn: SimulationTurn = {
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  };
  turns.push(userTurn);

  // Build conversation history for AI
  const systemPrompt = buildSimulationSystemPrompt(simulation);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...turns.map(t => ({
      role: t.role === 'simulation' ? 'assistant' : 'user',
      content: t.content,
    })),
  ];

  // Get simulation response
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages,
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Extract eval tag if present
  const evalMatch = content.match(/\[EVAL:\s*skills_shown=(.*?)\s*\|\s*effectiveness=(\d+)\s*\|\s*feedback=(.*?)(?:\s*\|\s*suggestions=(.*?))?\]/);
  const cleanContent = content.replace(/\[EVAL:.*?\]/, '').trim();

  // Parse quick evaluation from AI
  let turnEvaluation: TurnEvaluation;
  if (evalMatch) {
    turnEvaluation = {
      skillsShown: evalMatch[1].split(',').map(s => s.trim()) as SkillCategory[],
      effectiveness: parseInt(evalMatch[2]) || 50,
      feedback: evalMatch[3].trim(),
      suggestions: evalMatch[4] ? [evalMatch[4].trim()] : undefined,
    };
  } else {
    // Fallback: get separate evaluation
    turnEvaluation = await evaluateTurn(simulation, turns);
  }

  // Add evaluation to user turn
  userTurn.evaluation = turnEvaluation;

  // Add simulation response
  const simTurn: SimulationTurn = {
    role: 'simulation',
    content: cleanContent,
    timestamp: new Date(),
  };
  turns.push(simTurn);

  // Check if complete
  const isComplete = turns.length >= simulation.maxTurns * 2;

  return {
    session: {
      ...session,
      turns,
      status: isComplete ? 'completed' : 'active',
    },
    response: cleanContent,
    turnEvaluation,
    isComplete,
  };
}

async function evaluateTurn(
  simulation: ConversationSimulation,
  turns: SimulationTurn[]
): Promise<TurnEvaluation> {
  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are a skill evaluator. Return only valid JSON.',
          },
          {
            role: 'user',
            content: buildTurnEvaluationPrompt(simulation, turns),
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('Evaluation request failed');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse evaluation');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      skillsShown: parsed.skillsShown || [],
      effectiveness: parsed.effectiveness || 50,
      feedback: parsed.feedback || '',
      suggestions: parsed.suggestions,
    };
  } catch {
    return {
      skillsShown: [],
      effectiveness: 50,
      feedback: 'Unable to evaluate this turn.',
    };
  }
}

// =============================================================================
// FINAL EVALUATION
// =============================================================================

export async function evaluateSimulation(
  session: SimulationSession
): Promise<SimulationResult> {
  const { simulation, turns } = session;

  // Aggregate skill demonstrations
  const skillCounts: Record<SkillCategory, number[]> = {} as Record<SkillCategory, number[]>;
  for (const skill of simulation.targetSkills) {
    skillCounts[skill] = [];
  }

  const evaluatedTurns = turns.filter(t => t.role === 'user' && t.evaluation);
  for (const turn of evaluatedTurns) {
    if (turn.evaluation) {
      for (const skill of turn.evaluation.skillsShown) {
        if (skillCounts[skill]) {
          skillCounts[skill].push(turn.evaluation.effectiveness);
        }
      }
    }
  }

  // Calculate per-skill averages
  const overallSkillsShown: Record<SkillCategory, number> = {} as Record<SkillCategory, number>;
  for (const [skill, scores] of Object.entries(skillCounts)) {
    if (scores.length > 0) {
      overallSkillsShown[skill as SkillCategory] = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
    } else {
      overallSkillsShown[skill as SkillCategory] = 0;
    }
  }

  // Calculate overall score
  const allEffectiveness = evaluatedTurns
    .filter(t => t.evaluation)
    .map(t => t.evaluation!.effectiveness);
  const overall = allEffectiveness.length > 0
    ? Math.round(allEffectiveness.reduce((a, b) => a + b, 0) / allEffectiveness.length)
    : 50;

  const level = scoreToLevel(overall);
  const result = determineResult(overall, overallSkillsShown);

  // Extract key moments
  const breakthroughMoments = evaluatedTurns
    .filter(t => t.evaluation && t.evaluation.effectiveness >= 75)
    .map(t => t.content);

  const areasForPractice = simulation.targetSkills
    .filter(s => (overallSkillsShown[s] || 0) < 60)
    .map(s => s.replace(/-/g, ' '));

  // Build feedback
  const feedback = buildSimulationFeedback(overall, overallSkillsShown, simulation);

  return {
    simulation,
    turns,
    overallSkillsShown,
    breakthroughMoments,
    areasForPractice,
    overall,
    level,
    result,
    feedback,
    specificFeedback: evaluatedTurns
      .filter(t => t.evaluation?.feedback)
      .map(t => t.evaluation!.feedback),
    strengths: breakthroughMoments.length > 0
      ? ['Showed strong skills in key moments']
      : [],
    growthEdges: areasForPractice,
  };
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
  skillsShown: Record<SkillCategory, number>
): VerificationResult {
  const skillScores = Object.values(skillsShown);
  const hasVeryLow = skillScores.some(s => s < 30 && s > 0);

  if (overall < 45 || hasVeryLow) {
    return 'try-again';
  }

  if (overall < 60) {
    return 'needs-depth';
  }

  return 'pass';
}

function buildSimulationFeedback(
  overall: number,
  skillsShown: Record<SkillCategory, number>,
  simulation: ConversationSimulation
): string {
  const level = scoreToLevel(overall);
  let feedback = `Your practice showed ${level}-level skill overall. `;

  const strong = Object.entries(skillsShown)
    .filter(([_, score]) => score >= 65)
    .map(([skill]) => skill.replace(/-/g, ' '));

  const weak = Object.entries(skillsShown)
    .filter(([_, score]) => score > 0 && score < 50)
    .map(([skill]) => skill.replace(/-/g, ' '));

  if (strong.length > 0) {
    feedback += `You demonstrated strength in ${strong.join(', ')}. `;
  }

  if (weak.length > 0) {
    feedback += `Areas to practice: ${weak.join(', ')}. `;
  }

  if (overall >= 60) {
    feedback += 'Great work engaging with this challenging scenario.';
  } else {
    feedback += 'This is difficult material - consider trying again with the feedback in mind.';
  }

  return feedback;
}
