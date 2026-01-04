/**
 * Full Platform Test - Simulates real user interactions
 * Tests the complete flow as if a user is using the platform
 * Run with: npx tsx scripts/test-full-platform.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';
const TEST_USER_ID = 'cmjilpqfe0000o4i31jvglg51';

// ============================================================================
// HELPER FUNCTIONS (from the actual codebase)
// ============================================================================

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const CHAT_DIMENSION_KEYWORDS: Record<string, { pillarId: string; dimensionId: string }> = {
  'anxiety': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'emotion': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'feeling': { pillarId: 'mind', dimensionId: 'emotional-regulation' },
  'boundary': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'boundaries': { pillarId: 'relationships', dimensionId: 'boundaries' },
  'relationship': { pillarId: 'relationships', dimensionId: 'relational-patterns' },
  'attachment': { pillarId: 'relationships', dimensionId: 'attachment-patterns' },
  'shadow': { pillarId: 'soul', dimensionId: 'shadow-integration' },
  'stress': { pillarId: 'body', dimensionId: 'stress-physiology' },
  'sleep': { pillarId: 'body', dimensionId: 'sleep-restoration' },
  'meaning': { pillarId: 'mind', dimensionId: 'meaning-purpose' },
  'authentic': { pillarId: 'soul', dimensionId: 'authenticity' },
};

function detectDimensions(text: string): Array<{ pillarId: string; dimensionId: string; reason: string }> {
  const lowerText = text.toLowerCase();
  const detected: Array<{ pillarId: string; dimensionId: string; reason: string }> = [];

  for (const [keyword, dim] of Object.entries(CHAT_DIMENSION_KEYWORDS)) {
    if (lowerText.includes(keyword) && detected.length < 2) {
      detected.push({ ...dim, reason: `Discussed ${keyword}` });
    }
  }
  return detected;
}

type Stance = 'chill' | 'supportive' | 'hype' | 'deep' | 'grounding';

function detectStance(message: string): Stance {
  const msg = message.toLowerCase();

  // Crisis detection - matches patterns from lib/crisis-detection.ts
  const crisisPatterns = [
    /\b(kill myself|end my life|suicide|suicidal)\b/i,
    /\b(want to die|don'?t want to (be here|exist|live))\b/i,
    /\b(hurt myself|self[- ]?harm|cutting myself|harming myself)\b/i,
    /\b(end it all|no point (in )?living)\b/i,
    /\b(can'?t go on|can'?t take (it|this)( anymore)?)\b/i,
    /\b(everyone would be better off without me)\b/i,
    /\b(no reason to live|nothing to live for)\b/i,
    /\b(want to disappear|wish I was (dead|gone|never born))\b/i,
    /\b(hopeless|no hope|completely lost)\b/i,
    /\b(can'?t cope|falling apart|breaking down)\b/i,
    /\b(everything feels pointless)\b/i,
  ];
  if (crisisPatterns.some(p => p.test(msg))) return 'grounding';

  const bigNewsWords = ["got the job", "got accepted", "got promoted", "engaged"];
  if (bigNewsWords.some(w => msg.includes(w))) return 'hype';

  const supportWords = ["struggling", "hard time", "feeling down", "sad", "anxious", "worried"];
  if (supportWords.some(w => msg.includes(w))) return 'supportive';

  const deepWords = ["been thinking", "realized", "wondering", "understand", "pattern", "why do i"];
  if (deepWords.some(w => msg.includes(w))) return 'deep';

  return 'chill';
}

async function callLM(messages: Array<{ role: string; content: string }>, maxTokens = 500): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LM_STUDIO_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 FULL PLATFORM SIMULATION TEST');
  console.log('='.repeat(70));
  console.log(`User: ${TEST_USER_ID}`);
  console.log(`LM Studio: ${LM_STUDIO_URL}`);
  console.log('');

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: TEST_USER_ID },
    include: { aiCredits: true, profile: true },
  });

  if (!user) {
    console.error('❌ Test user not found. Run: npx tsx scripts/create-test-user.ts');
    process.exit(1);
  }

  console.log(`✅ User: ${user.email}`);
  console.log(`✅ Credits: ${user.aiCredits?.tokenBalance?.toLocaleString() || 0} tokens`);
  console.log(`✅ Onboarded: ${user.profile?.onboardingCompleted ? 'Yes' : 'No'}\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 1: User writes a journal entry
  // -------------------------------------------------------------------------
  console.log('📓 SCENARIO 1: Writing a journal entry\n');

  const journalContent = `I've been feeling really anxious about my relationship lately. My partner seems distant and I keep wondering if I did something wrong. I notice I'm constantly checking my phone waiting for their messages. This pattern feels familiar - I think I've been here before with other partners.`;

  const journalEntry = await prisma.journalEntry.create({
    data: {
      userId: TEST_USER_ID,
      content: journalContent,
      mood: 'anxious',
      tags: JSON.stringify(['relationship', 'anxiety', 'patterns']),
    },
  });

  console.log(`   ✓ Created journal entry: ${journalEntry.id}`);
  console.log(`   Content: "${journalContent.substring(0, 80)}..."`);
  console.log(`   Mood: anxious\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 2: User logs a dream
  // -------------------------------------------------------------------------
  console.log('🌙 SCENARIO 2: Logging a dream\n');

  const dreamEntry = await prisma.dreamEntry.create({
    data: {
      userId: TEST_USER_ID,
      title: 'Chasing but never catching',
      content: `I was running through a forest trying to catch someone. Every time I got close, they disappeared. The trees kept getting thicker and I felt more and more lost. Eventually I realized the person I was chasing was myself.`,
      dreamDate: new Date(),
      symbols: JSON.stringify(['forest', 'chase', 'lost', 'self']),
      emotions: JSON.stringify(['anxious', 'confused', 'frustrated']),
      lucid: false,
      recurring: false,
    },
  });

  console.log(`   ✓ Created dream entry: ${dreamEntry.id}`);
  console.log(`   Title: "${dreamEntry.title}"`);
  console.log(`   Symbols: forest, chase, lost, self`);
  console.log(`   Emotions: anxious, confused, frustrated\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 3: User does a quick check-in
  // -------------------------------------------------------------------------
  console.log('📊 SCENARIO 3: Quick check-in\n');

  const checkIn = await prisma.quickCheckIn.create({
    data: {
      userId: TEST_USER_ID,
      mood: 3,
      energy: 4,
      note: 'Feeling a bit off today, not sure why',
      pillarFocus: 'mind',
    },
  });

  console.log(`   ✓ Created check-in: mood ${checkIn.mood}/5, energy ${checkIn.energy}/5`);
  console.log(`   Note: "${checkIn.note}"\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 4: User chats with AI (main chat)
  // -------------------------------------------------------------------------
  console.log('💬 SCENARIO 4: Main chat conversation\n');

  // Build context like the real endpoint does
  const recentJournals = await prisma.journalEntry.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const recentDreams = await prisma.dreamEntry.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const recentCheckIns = await prisma.quickCheckIn.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  let contextString = `
---
WHAT YOU KNOW ABOUT THIS PERSON (use naturally, don't recite):

RECENT JOURNAL ENTRIES:`;

  for (const j of recentJournals) {
    contextString += `\n- (mood: ${j.mood || 'not set'}): "${j.content.slice(0, 150)}..."`;
  }

  if (recentDreams.length > 0) {
    contextString += `\n\nRECENT DREAMS:`;
    for (const d of recentDreams) {
      const symbols = JSON.parse(d.symbols || '[]').join(', ');
      contextString += `\n- "${d.title}": symbols (${symbols})`;
    }
  }

  if (recentCheckIns.length > 0) {
    const avgMood = recentCheckIns.reduce((s, c) => s + c.mood, 0) / recentCheckIns.length;
    contextString += `\n\nRECENT CHECK-INS: Average mood ${avgMood.toFixed(1)}/5`;
  }

  contextString += `\n---`;

  const userMessage = "I've been noticing I get really anxious when my partner doesn't text back quickly. I know it's probably irrational but I can't help it.";
  const stance = detectStance(userMessage);

  console.log(`   User message: "${userMessage}"`);
  console.log(`   Detected stance: ${stance}`);

  const systemPrompt = `You are a genuine AI companion. Not a therapist. Not a guru. Just someone real to talk to.

Your vibe:
- Warm but not fake
- Interested but not nosy
- Helpful but not preachy

How you talk:
- Like texting a friend who happens to be wise
- Match their energy
- Don't lecture unless they ask

Right now: They're going through something. Be there for them.
- Listen more than advise
- Validate without overdoing it
- Ask what they need

${contextString}`;

  const chatResponse = await callLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  console.log(`\n   AI Response: "${chatResponse.content.substring(0, 200)}..."`);
  console.log(`   Tokens: ${chatResponse.inputTokens} in, ${chatResponse.outputTokens} out`);

  // Detect dimensions discussed
  const dimensions = detectDimensions(userMessage + ' ' + chatResponse.content);
  console.log(`   Dimensions detected: ${dimensions.map(d => d.dimensionId).join(', ') || 'none'}`);

  // Create conversation record
  const conversation = await prisma.chatConversation.create({
    data: {
      userId: TEST_USER_ID,
      title: 'Anxiety about partner',
      mode: 'general',
      isActive: true,
    },
  });

  // Save messages
  await prisma.chatMessage.createMany({
    data: [
      { conversationId: conversation.id, role: 'user', content: userMessage, inputTokens: chatResponse.inputTokens },
      { conversationId: conversation.id, role: 'assistant', content: chatResponse.content, outputTokens: chatResponse.outputTokens },
    ],
  });

  console.log(`   ✓ Saved conversation: ${conversation.id}`);

  // Record activity for dimensions
  if (dimensions.length > 0) {
    for (const dim of dimensions) {
      await prisma.growthActivity.create({
        data: {
          userId: TEST_USER_ID,
          activityType: 'ai-insight',
          pillarId: dim.pillarId,
          dimensionId: dim.dimensionId,
          points: 2,
          reason: dim.reason,
        },
      });
    }
    console.log(`   ✓ Recorded ${dimensions.length} dimension activities\n`);
  }

  // -------------------------------------------------------------------------
  // SCENARIO 5: Follow-up message (conversation memory)
  // -------------------------------------------------------------------------
  console.log('💬 SCENARIO 5: Follow-up message (testing memory)\n');

  const followUpMessage = "You mentioned patterns earlier. What do you mean by that?";
  console.log(`   User: "${followUpMessage}"`);

  // Get conversation history
  const history = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
  });

  const historyMessages = history.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const followUpResponse = await callLM([
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: followUpMessage },
  ]);

  console.log(`   AI: "${followUpResponse.content.substring(0, 200)}..."`);
  console.log(`   Tokens: ${followUpResponse.inputTokens} in, ${followUpResponse.outputTokens} out`);

  // Check if response references the context
  const referencesContext = followUpResponse.content.toLowerCase().includes('journal') ||
                           followUpResponse.content.toLowerCase().includes('wrote') ||
                           followUpResponse.content.toLowerCase().includes('mentioned') ||
                           followUpResponse.content.toLowerCase().includes('earlier') ||
                           followUpResponse.content.toLowerCase().includes('pattern');
  console.log(`   References context: ${referencesContext ? '✅ Yes' : '⚠️ Maybe not'}\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 6: Dream interpretation request
  // -------------------------------------------------------------------------
  console.log('🔮 SCENARIO 6: Dream interpretation\n');

  const dreamToInterpret = await prisma.dreamEntry.findFirst({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
  });

  if (dreamToInterpret) {
    const dreamSystemPrompt = `You are a thoughtful dream analyst drawing from Jungian psychology.
Your approach:
1. Symbol Exploration: Identify key symbols and possible meanings
2. Emotional Landscape: Reflect on emotional tone
3. Shadow Elements: Gently explore shadow material
4. Integration Questions: Offer 2-3 reflection questions
5. Practical Wisdom: Apply to waking life

Use tentative language ("might", "could suggest"). Keep it grounded.`;

    const symbols = JSON.parse(dreamToInterpret.symbols || '[]').join(', ');
    const emotions = JSON.parse(dreamToInterpret.emotions || '[]').join(', ');

    const dreamUserPrompt = `Dream: ${dreamToInterpret.content}
Symbols: ${symbols}
Emotions: ${emotions}`;

    const interpretation = await callLM([
      { role: 'system', content: dreamSystemPrompt },
      { role: 'user', content: dreamUserPrompt },
    ], 700);

    console.log(`   Dream: "${dreamToInterpret.title}"`);
    console.log(`   Interpretation: "${interpretation.content.substring(0, 250)}..."`);
    console.log(`   Tokens: ${interpretation.inputTokens} in, ${interpretation.outputTokens} out`);

    // Save interpretation
    await prisma.dreamEntry.update({
      where: { id: dreamToInterpret.id },
      data: { interpretation: interpretation.content },
    });
    console.log(`   ✓ Saved interpretation\n`);

    // Record soul dimension activity
    await prisma.growthActivity.create({
      data: {
        userId: TEST_USER_ID,
        activityType: 'dream-interpretation',
        pillarId: 'soul',
        dimensionId: 'inner-wisdom',
        points: 5,
        reason: 'Dream interpretation session',
        referenceType: 'dream',
        referenceId: dreamToInterpret.id,
      },
    });
    console.log(`   ✓ Recorded soul/inner-wisdom activity\n`);
  }

  // -------------------------------------------------------------------------
  // SCENARIO 7: Journal companion
  // -------------------------------------------------------------------------
  console.log('📔 SCENARIO 7: Journal companion reflection\n');

  const journalCompanionPrompt = `You are a thoughtful companion helping someone reflect on their journal entries.
Notice patterns, ask deepening questions, reflect back what you see without judgment.
Be warm but not saccharine. Insightful but not preachy.

Recent entries:
${recentJournals.map(j => `- (${j.mood || 'no mood'}): "${j.content.slice(0, 200)}..."`).join('\n')}`;

  const journalQuestion = "What patterns do you notice in my recent writing?";

  const journalReflection = await callLM([
    { role: 'system', content: journalCompanionPrompt },
    { role: 'user', content: journalQuestion },
  ]);

  console.log(`   User: "${journalQuestion}"`);
  console.log(`   AI: "${journalReflection.content.substring(0, 250)}..."`);
  console.log(`   Tokens: ${journalReflection.inputTokens} in, ${journalReflection.outputTokens} out\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 8: Where I'm Stuck
  // -------------------------------------------------------------------------
  console.log('🎯 SCENARIO 8: Where I\'m Stuck (resource finder)\n');

  const stuckPrompt = `You are a guide helping people find resources for their growth struggles.
1. Acknowledge briefly (1-2 sentences)
2. Offer insight (1-2 sentences)
3. Recommend 2-3 specific resources

AVAILABLE COURSES:
- Anxious Attachment Healing (anxious-attachment-healing): Heal attachment wounds
- Shadow Work Fundamentals (shadow-work-fundamentals): Integrate your shadow
- Nervous System Reset (nervous-system-reset): Regulate your nervous system
- Boundaries That Work (boundaries-course): Set healthy boundaries

RESPONSE FORMAT:
[Acknowledgment]

RECOMMENDATIONS:
1. **[Title]** (type: course, slug: the-slug)
   Why: [reason]`;

  const stuckInput = "I keep getting anxious when my partner needs space. I know I'm being clingy but I can't stop.";

  const stuckResponse = await callLM([
    { role: 'system', content: stuckPrompt },
    { role: 'user', content: stuckInput },
  ]);

  console.log(`   Struggle: "${stuckInput}"`);
  console.log(`   Response: "${stuckResponse.content.substring(0, 300)}..."`);
  console.log(`   Tokens: ${stuckResponse.inputTokens} in, ${stuckResponse.outputTokens} out\n`);

  // -------------------------------------------------------------------------
  // SCENARIO 9: Crisis detection
  // -------------------------------------------------------------------------
  console.log('🚨 SCENARIO 9: Crisis detection\n');

  const crisisMessage = "I can't take this anymore. Everything feels pointless. I don't know why I even try.";
  const crisisStance = detectStance(crisisMessage);

  console.log(`   Message: "${crisisMessage}"`);
  console.log(`   Detected stance: ${crisisStance} (should be 'grounding')`);
  console.log(`   ✓ Crisis detection: ${crisisStance === 'grounding' ? 'WORKING' : 'FAILED'}`);

  const crisisPrompt = `You are a calm, grounding presence.
Right now: They're overwhelmed or in crisis.
- Stay calm and steady
- Simple, clear responses
- Ground them in the present
- Ask about safety
- Gently suggest professional support`;

  const crisisResponse = await callLM([
    { role: 'system', content: crisisPrompt },
    { role: 'user', content: crisisMessage },
  ], 300);

  console.log(`   AI Response: "${crisisResponse.content.substring(0, 200)}..."`);

  const hasGroundingElements = crisisResponse.content.toLowerCase().includes('here') ||
                               crisisResponse.content.toLowerCase().includes('safe') ||
                               crisisResponse.content.toLowerCase().includes('right now') ||
                               crisisResponse.content.toLowerCase().includes('breathe');
  console.log(`   Grounding elements: ${hasGroundingElements ? '✅ Present' : '⚠️ May be missing'}\n`);

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('='.repeat(70));
  console.log('📊 DATABASE STATE AFTER TESTS');
  console.log('='.repeat(70) + '\n');

  const finalStats = await prisma.$transaction([
    prisma.journalEntry.count({ where: { userId: TEST_USER_ID } }),
    prisma.dreamEntry.count({ where: { userId: TEST_USER_ID } }),
    prisma.quickCheckIn.count({ where: { userId: TEST_USER_ID } }),
    prisma.chatConversation.count({ where: { userId: TEST_USER_ID } }),
    prisma.chatMessage.count({ where: { conversation: { userId: TEST_USER_ID } } }),
    prisma.growthActivity.count({ where: { userId: TEST_USER_ID } }),
  ]);

  console.log(`   Journal entries: ${finalStats[0]}`);
  console.log(`   Dream entries: ${finalStats[1]}`);
  console.log(`   Quick check-ins: ${finalStats[2]}`);
  console.log(`   Chat conversations: ${finalStats[3]}`);
  console.log(`   Chat messages: ${finalStats[4]}`);
  console.log(`   Growth activities: ${finalStats[5]}`);

  // Get recent activities
  const recentActivities = await prisma.growthActivity.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('\n   Recent activities:');
  for (const a of recentActivities) {
    console.log(`   - ${a.activityType}: ${a.pillarId}/${a.dimensionId} (+${a.points}pts) - ${a.reason}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ FULL PLATFORM TEST COMPLETE');
  console.log('='.repeat(70) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
