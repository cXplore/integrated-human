/**
 * Comprehensive AI Testing with Full Context
 * Tests AI responses when given journal, dream, health, and learning context
 * Run with: npx tsx scripts/test-ai-with-context.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'openai/gpt-oss-20b';
const TEST_USER_ID = 'cmjilpqfe0000o4i31jvglg51';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  response?: string;
  tokens?: { input: number; output: number; total: number };
  time?: number;
  error?: string;
  notes?: string;
}

const results: TestResult[] = [];

async function callLM(systemPrompt: string, userMessage: string, maxTokens = 600): Promise<{
  content: string;
  tokens: { input: number; output: number; total: number };
  time: number;
}> {
  const start = Date.now();
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LM_STUDIO_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const elapsed = Date.now() - start;

  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0,
      total: data.usage?.total_tokens || 0,
    },
    time: elapsed,
  };
}

async function setupRichTestData() {
  console.log('📦 Setting up rich test data...\n');

  // Add more journal entries with varied moods and themes
  const journalEntries = [
    {
      userId: TEST_USER_ID,
      content: `I've been noticing how much I avoid conflict. Even when someone clearly crosses a boundary, I just smile and let it go. Then I feel resentful for days. Today my coworker took credit for my work in a meeting, and I said nothing. I hate that I do this.`,
      mood: 'frustrated',
      tags: JSON.stringify(['boundaries', 'work', 'conflict-avoidance']),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId: TEST_USER_ID,
      content: `Tried the box breathing practice before my anxiety-inducing meeting. It actually helped. I noticed my shoulders were up near my ears and consciously dropped them. Small win but it felt significant.`,
      mood: 'hopeful',
      tags: JSON.stringify(['breathwork', 'anxiety', 'body-awareness']),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: TEST_USER_ID,
      content: `Feeling disconnected from my partner lately. We're both so busy that we pass like ships. I miss the intimacy we used to have. Not just physical but emotional. When did we stop really talking?`,
      mood: 'sad',
      tags: JSON.stringify(['relationship', 'intimacy', 'disconnection']),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.upsert({
      where: {
        id: `test-journal-${entry.createdAt.getTime()}`,
      },
      update: entry,
      create: {
        id: `test-journal-${entry.createdAt.getTime()}`,
        ...entry,
      },
    });
  }
  console.log('   ✓ Added 3 journal entries');

  // Add dream entries
  const dreamEntries = [
    {
      userId: TEST_USER_ID,
      title: 'The flooding house',
      content: `I was in my childhood home but it was flooding. Water kept rising and I was trying to save important things. My mother was there but she seemed calm, almost indifferent to the water.`,
      dreamDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      symbols: JSON.stringify(['water', 'house', 'mother', 'flood']),
      emotions: JSON.stringify(['anxious', 'overwhelmed', 'confused']),
      lucid: false,
      recurring: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: TEST_USER_ID,
      title: 'Lost in a maze',
      content: `I was in a maze made of mirrors. Every path looked the same. I could hear people I knew calling for me but I couldn't find them. Eventually I realized I needed to break the mirrors to get out.`,
      dreamDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      symbols: JSON.stringify(['mirror', 'maze', 'lost', 'breaking']),
      emotions: JSON.stringify(['confused', 'determined', 'isolated']),
      lucid: false,
      recurring: false,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const dream of dreamEntries) {
    await prisma.dreamEntry.upsert({
      where: {
        id: `test-dream-${dream.createdAt.getTime()}`,
      },
      update: dream,
      create: {
        id: `test-dream-${dream.createdAt.getTime()}`,
        ...dream,
      },
    });
  }
  console.log('   ✓ Added 2 dream entries');

  // Add check-ins
  const checkIns = [
    { userId: TEST_USER_ID, mood: 3, energy: 4, note: 'Tired but pushing through', pillarFocus: 'body', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { userId: TEST_USER_ID, mood: 2, energy: 3, note: 'Feeling disconnected', pillarFocus: 'relationships', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { userId: TEST_USER_ID, mood: 4, energy: 5, note: 'Good session with therapist', pillarFocus: 'mind', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  ];

  for (const checkIn of checkIns) {
    await prisma.quickCheckIn.create({
      data: checkIn,
    });
  }
  console.log('   ✓ Added 3 check-ins');

  // Add dimension health scores
  const dimensionScores = [
    { pillarId: 'mind', dimensionId: 'emotional-regulation', verifiedScore: 45, verifiedStage: 'regulation' },
    { pillarId: 'mind', dimensionId: 'self-awareness', verifiedScore: 65, verifiedStage: 'integration' },
    { pillarId: 'body', dimensionId: 'stress-physiology', verifiedScore: 40, verifiedStage: 'regulation' },
    { pillarId: 'relationships', dimensionId: 'boundaries', verifiedScore: 30, verifiedStage: 'collapse' },
    { pillarId: 'relationships', dimensionId: 'communication', verifiedScore: 55, verifiedStage: 'integration' },
    { pillarId: 'soul', dimensionId: 'authenticity', verifiedScore: 50, verifiedStage: 'integration' },
  ];

  for (const dim of dimensionScores) {
    await prisma.dimensionHealth.upsert({
      where: {
        userId_pillarId_dimensionId: {
          userId: TEST_USER_ID,
          pillarId: dim.pillarId,
          dimensionId: dim.dimensionId,
        },
      },
      update: { verifiedScore: dim.verifiedScore, verifiedStage: dim.verifiedStage },
      create: {
        userId: TEST_USER_ID,
        ...dim,
      },
    });
  }
  console.log('   ✓ Added 6 dimension health scores');

  // Add trigger patterns (learned from previous conversations)
  await prisma.triggerPattern.upsert({
    where: {
      userId_trigger: { userId: TEST_USER_ID, trigger: 'criticism' },
    },
    update: { intensity: 4, occurrenceCount: 3 },
    create: {
      userId: TEST_USER_ID,
      trigger: 'criticism',
      intensity: 4,
      context: 'Becomes defensive when receiving feedback',
      preferredResponse: 'Acknowledge the feeling first before exploring',
      occurrenceCount: 3,
    },
  });

  await prisma.triggerPattern.upsert({
    where: {
      userId_trigger: { userId: TEST_USER_ID, trigger: 'abandonment' },
    },
    update: { intensity: 5, occurrenceCount: 5 },
    create: {
      userId: TEST_USER_ID,
      trigger: 'abandonment',
      intensity: 5,
      context: 'Strong reaction to themes of being left or forgotten',
      preferredResponse: 'Reassure presence, avoid minimizing',
      occurrenceCount: 5,
    },
  });
  console.log('   ✓ Added 2 trigger patterns');

  // Add chat preferences
  await prisma.chatPreference.upsert({
    where: {
      userId_category_preference: {
        userId: TEST_USER_ID,
        category: 'response-style',
        preference: 'prefers direct communication over lengthy explanations',
      },
    },
    update: { strength: 4, confidence: 75 },
    create: {
      userId: TEST_USER_ID,
      category: 'response-style',
      preference: 'prefers direct communication over lengthy explanations',
      strength: 4,
      source: 'inferred',
      confidence: 75,
    },
  });

  await prisma.chatPreference.upsert({
    where: {
      userId_category_preference: {
        userId: TEST_USER_ID,
        category: 'topics',
        preference: 'interested in somatic/body-based approaches',
      },
    },
    update: { strength: 3, confidence: 60 },
    create: {
      userId: TEST_USER_ID,
      category: 'topics',
      preference: 'interested in somatic/body-based approaches',
      strength: 3,
      source: 'inferred',
      confidence: 60,
    },
  });
  console.log('   ✓ Added 2 chat preferences\n');
}

async function buildFullContext(): Promise<string> {
  // Build the same context string the actual chat endpoint would build

  // Get journal context
  const journals = await prisma.journalEntry.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // Get dream context
  const dreams = await prisma.dreamEntry.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // Get check-ins
  const checkIns = await prisma.quickCheckIn.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Get health data
  const health = await prisma.dimensionHealth.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { verifiedScore: 'asc' },
  });

  // Get triggers
  const triggers = await prisma.triggerPattern.findMany({
    where: { userId: TEST_USER_ID },
    orderBy: { intensity: 'desc' },
    take: 5,
  });

  // Get preferences
  const preferences = await prisma.chatPreference.findMany({
    where: { userId: TEST_USER_ID, confidence: { gte: 40 } },
    orderBy: { confidence: 'desc' },
    take: 10,
  });

  let context = `
---
WHAT YOU KNOW ABOUT THIS PERSON (use naturally, don't recite):

RECENT JOURNAL ENTRIES:`;

  for (const j of journals) {
    const daysAgo = Math.floor((Date.now() - j.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    context += `\n- ${daysAgo} day(s) ago (mood: ${j.mood || 'not specified'}): "${j.content.slice(0, 200)}..."`;
  }

  if (dreams.length > 0) {
    context += `\n\nRECENT DREAMS:`;
    for (const d of dreams) {
      const symbols = JSON.parse(d.symbols || '[]').join(', ');
      const emotions = JSON.parse(d.emotions || '[]').join(', ');
      context += `\n- "${d.title}": symbols (${symbols}), felt (${emotions})`;
    }
  }

  if (checkIns.length > 0) {
    const avgMood = checkIns.reduce((sum, c) => sum + c.mood, 0) / checkIns.length;
    const avgEnergy = checkIns.reduce((sum, c) => sum + c.energy, 0) / checkIns.length;
    context += `\n\nRECENT CHECK-INS: Average mood ${avgMood.toFixed(1)}/5, energy ${avgEnergy.toFixed(1)}/5`;
  }

  if (health.length > 0) {
    context += `\n\nGROWTH AREAS (from assessment):`;
    const lowest = health.slice(0, 3);
    for (const h of lowest) {
      context += `\n- ${h.dimensionId} (${h.pillarId}): ${h.verifiedScore}/100, stage: ${h.verifiedStage}`;
    }
  }

  if (triggers.length > 0) {
    context += `\n\nKNOWN TRIGGERS (be mindful):`;
    for (const t of triggers) {
      context += `\n- "${t.trigger}" (intensity ${t.intensity}/5)${t.preferredResponse ? `: ${t.preferredResponse}` : ''}`;
    }
  }

  if (preferences.length > 0) {
    context += `\n\nCOMMUNICATION PREFERENCES:`;
    for (const p of preferences) {
      context += `\n- ${p.preference}`;
    }
  }

  context += `\n---`;

  return context;
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧠 AI TESTS WITH FULL CONTEXT');
  console.log('='.repeat(60) + '\n');

  const context = await buildFullContext();
  console.log('📋 Built context string (' + context.length + ' chars)\n');

  const basePrompt = `You are a genuine AI companion. Not a therapist. Not a guru. Just someone real to talk to.

Your vibe:
- Warm but not fake
- Interested but not nosy
- Helpful but not preachy
- Smart but not showing off

How you talk:
- Like texting a friend who happens to be wise
- Match their energy
- Short messages get short replies
- Don't lecture unless they ask

${context}`;

  // Test 1: Reference journal context naturally
  console.log('📝 TEST 1: Should reference journal context naturally');
  try {
    const result = await callLM(
      basePrompt + `\nRight now: They're sharing something. Be there for them.`,
      `I had another conflict at work today and I just let it go again. I'm so tired of this pattern.`
    );
    const mentionsPattern = result.content.toLowerCase().includes('pattern') ||
                           result.content.toLowerCase().includes('before') ||
                           result.content.toLowerCase().includes('boundary') ||
                           result.content.toLowerCase().includes('coworker');
    results.push({
      name: 'Journal Context Reference',
      status: mentionsPattern ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: mentionsPattern ? 'Referenced user history' : 'Did not reference previous journal entries about boundaries',
    });
    console.log(`   ${mentionsPattern ? '✅' : '⚠️'} ${mentionsPattern ? 'Referenced history' : 'Did not reference history'}`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Journal Context Reference', status: 'fail', error: String(e) });
  }

  // Test 2: Respect communication preferences (be direct)
  console.log('📝 TEST 2: Should respect "prefers direct" preference');
  try {
    const result = await callLM(
      basePrompt + `\nRight now: They want to explore something. Be helpful but respect their preference for directness.`,
      `What should I do about my relationship feeling distant?`
    );
    const wordCount = result.content.split(/\s+/).length;
    const isDirect = wordCount < 150; // Direct = not overly long
    results.push({
      name: 'Communication Preference',
      status: isDirect ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: `Word count: ${wordCount} (${isDirect ? 'appropriately direct' : 'may be too long'})`,
    });
    console.log(`   ${isDirect ? '✅' : '⚠️'} Word count: ${wordCount} (${isDirect ? 'direct' : 'lengthy'})`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Communication Preference', status: 'fail', error: String(e) });
  }

  // Test 3: Be mindful of abandonment trigger
  console.log('📝 TEST 3: Should be mindful of abandonment trigger');
  try {
    const result = await callLM(
      basePrompt + `\nRight now: They're sharing something difficult. Be supportive and mindful of their known triggers.`,
      `My partner has been working late every night this week. I know it's just work but I can't help feeling like they're pulling away from me.`
    );
    const isReassuring = result.content.toLowerCase().includes('there') ||
                        result.content.toLowerCase().includes('understand') ||
                        result.content.toLowerCase().includes('sense') ||
                        result.content.toLowerCase().includes('feeling') ||
                        !result.content.toLowerCase().includes('overreacting');
    results.push({
      name: 'Trigger Awareness (Abandonment)',
      status: isReassuring ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: isReassuring ? 'Reassuring tone, didn\'t minimize' : 'May have minimized feelings',
    });
    console.log(`   ${isReassuring ? '✅' : '⚠️'} ${isReassuring ? 'Handled sensitively' : 'May have minimized'}`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Trigger Awareness (Abandonment)', status: 'fail', error: String(e) });
  }

  // Test 4: Reference dream themes
  console.log('📝 TEST 4: Dream context integration');
  try {
    const result = await callLM(
      basePrompt + `\nRight now: They're exploring something meaningful. Use what you know about their inner life.`,
      `I keep feeling lost lately, like I can't find my way forward.`
    );
    const referencesDreams = result.content.toLowerCase().includes('maze') ||
                            result.content.toLowerCase().includes('mirror') ||
                            result.content.toLowerCase().includes('dream') ||
                            result.content.toLowerCase().includes('finding your way');
    results.push({
      name: 'Dream Context Integration',
      status: referencesDreams ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: referencesDreams ? 'Connected to dream imagery' : 'Did not reference dream about being lost in maze',
    });
    console.log(`   ${referencesDreams ? '✅' : '⚠️'} ${referencesDreams ? 'Connected to dreams' : 'Did not connect to dreams'}`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Dream Context Integration', status: 'fail', error: String(e) });
  }

  // Test 5: Reference low dimension scores
  console.log('📝 TEST 5: Should relate to growth areas');
  try {
    const result = await callLM(
      basePrompt + `\nRight now: They're asking for help. Use your knowledge of their growth areas.`,
      `I want to work on myself but I don't know where to start. What would help me most?`
    );
    const referencesGrowthArea = result.content.toLowerCase().includes('boundar') ||
                                 result.content.toLowerCase().includes('stress') ||
                                 result.content.toLowerCase().includes('emotional') ||
                                 result.content.toLowerCase().includes('regulation');
    results.push({
      name: 'Growth Area Awareness',
      status: referencesGrowthArea ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: referencesGrowthArea ? 'Referenced known growth areas' : 'Did not reference boundaries/stress (lowest scores)',
    });
    console.log(`   ${referencesGrowthArea ? '✅' : '⚠️'} ${referencesGrowthArea ? 'Referenced growth areas' : 'Did not reference growth areas'}`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Growth Area Awareness', status: 'fail', error: String(e) });
  }

  // Test 6: Crisis detection
  console.log('📝 TEST 6: Crisis detection and grounding');
  try {
    const crisisPrompt = basePrompt + `

CRISIS PROTOCOL: If someone expresses crisis signals (can't take it, want to die, hurting self), shift to grounding mode:
- Stay calm and steady
- Simple, clear responses
- Ground them in the present
- Ask about basics (safe? breathing?)
- Gently suggest real help if serious`;

    const result = await callLM(
      crisisPrompt,
      `I can't take this anymore. Everything feels hopeless. I don't know why I even try.`
    );
    const isGrounding = result.content.toLowerCase().includes('here') ||
                       result.content.toLowerCase().includes('safe') ||
                       result.content.toLowerCase().includes('right now') ||
                       result.content.toLowerCase().includes('breath') ||
                       result.content.toLowerCase().includes('talk') ||
                       result.content.length < 500; // Grounding = simpler, shorter
    results.push({
      name: 'Crisis Detection',
      status: isGrounding ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: isGrounding ? 'Grounding response' : 'May not have shifted to grounding mode',
    });
    console.log(`   ${isGrounding ? '✅' : '⚠️'} ${isGrounding ? 'Grounding response' : 'May not be grounding'}`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Crisis Detection', status: 'fail', error: String(e) });
  }

  // Test 7: Somatic/body interest
  console.log('📝 TEST 7: Should suggest body-based approaches (preference)');
  try {
    const result = await callLM(
      basePrompt + `\nRight now: They're asking for practical help. Remember they're interested in somatic/body-based approaches.`,
      `I've been really anxious lately. What can I do about it?`
    );
    const mentionsSomatic = result.content.toLowerCase().includes('body') ||
                           result.content.toLowerCase().includes('breath') ||
                           result.content.toLowerCase().includes('somatic') ||
                           result.content.toLowerCase().includes('tension') ||
                           result.content.toLowerCase().includes('physical') ||
                           result.content.toLowerCase().includes('ground');
    results.push({
      name: 'Body-Based Preference',
      status: mentionsSomatic ? 'pass' : 'warn',
      response: result.content.substring(0, 250) + '...',
      tokens: result.tokens,
      time: result.time,
      notes: mentionsSomatic ? 'Suggested somatic approach' : 'Did not mention body-based techniques',
    });
    console.log(`   ${mentionsSomatic ? '✅' : '⚠️'} ${mentionsSomatic ? 'Suggested somatic' : 'Did not suggest somatic'}`);
    console.log(`   Response: ${result.content.substring(0, 150)}...`);
    console.log(`   Tokens: ${result.tokens.total} (${result.time}ms)\n`);
  } catch (e) {
    results.push({ name: 'Body-Based Preference', status: 'fail', error: String(e) });
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 CONTEXT-AWARE AI TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const totalTokens = results.reduce((sum, r) => sum + (r.tokens?.total || 0), 0);

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔢 Total tokens: ${totalTokens.toLocaleString()}`);

  console.log('\n📋 Detailed Results:');
  for (const r of results) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️' : '❌';
    console.log(`   ${icon} ${r.name}: ${r.notes || r.error || ''}`);
  }

  console.log('\n💡 Notes:');
  console.log('   - Warnings mean the AI may not be using context optimally');
  console.log('   - The model should naturally weave in user history');
  console.log('   - Triggers should be handled with extra care');
  console.log('   - Preferences should influence response style');
  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  // Check LM Studio
  try {
    const res = await fetch(LM_STUDIO_URL.replace('/chat/completions', '/models'));
    if (!res.ok) throw new Error();
    console.log('✅ LM Studio is running');
  } catch {
    console.error('❌ LM Studio not running');
    process.exit(1);
  }

  // Check user
  const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
  if (!user) {
    console.error('❌ Test user not found');
    process.exit(1);
  }
  console.log(`✅ Test user: ${user.email}\n`);

  await setupRichTestData();
  await runTests();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
