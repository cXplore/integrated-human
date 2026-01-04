/**
 * Test AI with Health Assessment Context
 * Tests how the AI uses assessment data to personalize responses
 * Run with: npx tsx scripts/test-ai-with-health.ts
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

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  aiResponse?: string;
  contextUsed?: boolean;
}

const results: TestResult[] = [];

async function callLM(
  systemPrompt: string,
  userMessage: string
): Promise<{ content: string; tokens: number }> {
  const response = await fetch(LM_STUDIO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LM_STUDIO_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  };
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🩺 AI WITH HEALTH CONTEXT TESTS');
  console.log('='.repeat(70));
  console.log(`User: ${TEST_USER_ID}`);
  console.log(`LM Studio: ${LM_STUDIO_URL}\n`);

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: TEST_USER_ID },
    include: { profile: true },
  });

  if (!user) {
    console.error('❌ Test user not found');
    process.exit(1);
  }

  console.log(`✅ User: ${user.email}\n`);

  // =========================================================================
  // SETUP: Create health assessment data
  // =========================================================================
  console.log('📝 SETUP: Creating health assessment data...\n');

  // 1. Create Attachment Style Assessment
  const attachmentData = {
    style: 'anxious',
    anxietyPercent: 72,
    avoidancePercent: 28,
    description: 'Tends toward anxious attachment with hyperactivation of attachment system',
    strengths: ['Deep emotional awareness', 'Values connection', 'Empathetic'],
    challenges: ['Fear of abandonment', 'Seeking reassurance', 'Difficulty with uncertainty'],
  };

  await prisma.assessmentResult.upsert({
    where: { userId_type: { userId: TEST_USER_ID, type: 'attachment' } },
    update: { results: JSON.stringify(attachmentData), updatedAt: new Date() },
    create: {
      userId: TEST_USER_ID,
      type: 'attachment',
      results: JSON.stringify(attachmentData),
      summary: 'Anxious attachment style (72% anxiety, 28% avoidance)',
    },
  });
  console.log('   ✓ Created attachment assessment: Anxious (72% anxiety)');

  // 2. Create Nervous System Assessment
  const nervousSystemData = {
    primary: 'sympathetic',
    state: 'hyperarousal',
    counts: { ventral: 2, sympathetic: 5, dorsal: 1 },
    description: 'Tendency toward sympathetic activation under stress',
    recommendations: ['Breathing exercises', 'Grounding practices', 'Regular movement'],
  };

  await prisma.assessmentResult.upsert({
    where: { userId_type: { userId: TEST_USER_ID, type: 'nervous-system' } },
    update: { results: JSON.stringify(nervousSystemData), updatedAt: new Date() },
    create: {
      userId: TEST_USER_ID,
      type: 'nervous-system',
      results: JSON.stringify(nervousSystemData),
      summary: 'Sympathetic dominant - tends toward hyperarousal',
    },
  });
  console.log('   ✓ Created nervous system assessment: Sympathetic dominant');

  // 3. Create Integration Health snapshot
  await prisma.integrationHealth.upsert({
    where: { id: `${TEST_USER_ID}-health` },
    update: {
      mindScore: 55,
      bodyScore: 45,
      soulScore: 60,
      relationshipsScore: 40,
      mindStage: 'regulation',
      bodyStage: 'collapse',
      soulStage: 'integration',
      relationshipsStage: 'regulation',
      summary: JSON.stringify({
        insight: 'Currently working on nervous system regulation while navigating relationship patterns',
        strengths: ['Self-awareness', 'Commitment to growth', 'Spiritual connection'],
        challenges: ['Anxious attachment', 'Stress management', 'Setting boundaries'],
        nextSteps: ['Focus on somatic practices', 'Explore attachment healing work'],
      }),
      createdAt: new Date(),
    },
    create: {
      id: `${TEST_USER_ID}-health`,
      userId: TEST_USER_ID,
      mindScore: 55,
      bodyScore: 45,
      soulScore: 60,
      relationshipsScore: 40,
      mindStage: 'regulation',
      bodyStage: 'collapse',
      soulStage: 'integration',
      relationshipsStage: 'regulation',
      summary: JSON.stringify({
        insight: 'Currently working on nervous system regulation while navigating relationship patterns',
        strengths: ['Self-awareness', 'Commitment to growth', 'Spiritual connection'],
        challenges: ['Anxious attachment', 'Stress management', 'Setting boundaries'],
        nextSteps: ['Focus on somatic practices', 'Explore attachment healing work'],
      }),
    },
  });
  console.log('   ✓ Created integration health snapshot');
  console.log('      Mind: 55 (regulation), Body: 45 (collapse)');
  console.log('      Soul: 60 (integration), Relationships: 40 (regulation)\n');

  // =========================================================================
  // TEST 1: AI should recognize anxious attachment in relationship talk
  // =========================================================================
  console.log('🧪 TEST 1: Attachment-aware response\n');

  const attachmentPrompt = `You are a thoughtful AI companion helping someone explore their inner world.

USER HEALTH CONTEXT:
- Attachment Style: Anxious (72% anxiety, 28% avoidance)
- Key patterns: Fear of abandonment, seeking reassurance
- Nervous System: Tends toward sympathetic (hyperarousal) under stress
- Lowest pillar: Relationships (40/100)

When discussing relationships:
- Be aware of their anxious attachment pattern
- Validate without reinforcing anxious behaviors
- Gently help them see patterns
- Don't overwhelm with analysis

Keep response warm and concise.`;

  const attachmentMessage = "My partner has been distant lately and I've been checking my phone constantly. I know I'm probably overreacting but I can't stop.";

  const attachmentResult = await callLM(attachmentPrompt, attachmentMessage);

  // Check if response acknowledges the pattern
  const attachmentKeywords = ['pattern', 'anxiety', 'attachment', 'nervous system', 'understandable', 'makes sense'];
  const usedAttachmentContext = attachmentKeywords.some((kw) =>
    attachmentResult.content.toLowerCase().includes(kw)
  );

  results.push({
    name: 'Attachment-aware response',
    passed: usedAttachmentContext,
    details: usedAttachmentContext
      ? 'AI referenced attachment patterns appropriately'
      : 'AI did not reference attachment context',
    aiResponse: attachmentResult.content.substring(0, 300) + '...',
    contextUsed: usedAttachmentContext,
  });

  console.log(`   User: "${attachmentMessage}"`);
  console.log(`   AI: "${attachmentResult.content.substring(0, 200)}..."`);
  console.log(`   Context used: ${usedAttachmentContext ? '✅ Yes' : '❌ No'}`);
  console.log(`   Status: ${usedAttachmentContext ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 2: AI should offer grounding for sympathetic nervous system
  // =========================================================================
  console.log('🧪 TEST 2: Nervous system-aware response\n');

  const nsPrompt = `You are a supportive AI companion.

USER HEALTH CONTEXT:
- Nervous System State: Sympathetic dominant (hyperarousal tendency)
- Currently in "collapse" stage for body pillar (45/100)
- Recommended: Breathing exercises, grounding, movement

When they seem activated:
- Offer brief grounding first
- Don't jump into analysis
- Help regulate before exploring
- Suggest body-based practices

Keep it simple and calming.`;

  const nsMessage = "I'm so stressed right now. My heart is racing and I can't think straight. Everything feels urgent and overwhelming.";

  const nsResult = await callLM(nsPrompt, nsMessage);

  // Check for grounding/somatic elements
  const groundingKeywords = ['breath', 'ground', 'body', 'slow', 'pause', 'feet', 'inhale', 'exhale', 'moment'];
  const usedGrounding = groundingKeywords.some((kw) =>
    nsResult.content.toLowerCase().includes(kw)
  );

  results.push({
    name: 'Nervous system grounding',
    passed: usedGrounding,
    details: usedGrounding
      ? 'AI offered grounding/somatic support'
      : 'AI did not offer grounding support',
    aiResponse: nsResult.content.substring(0, 300) + '...',
    contextUsed: usedGrounding,
  });

  console.log(`   User: "${nsMessage}"`);
  console.log(`   AI: "${nsResult.content.substring(0, 200)}..."`);
  console.log(`   Grounding offered: ${usedGrounding ? '✅ Yes' : '❌ No'}`);
  console.log(`   Status: ${usedGrounding ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 3: AI should recognize soul strength and use it
  // =========================================================================
  console.log('🧪 TEST 3: Leveraging strengths (soul pillar)\n');

  const soulPrompt = `You are a wise AI companion.

USER HEALTH CONTEXT:
- Strongest pillar: Soul (60/100, integration stage)
- Has spiritual practice and sense of meaning
- Lower areas: Body and Relationships
- Assessment shows: Self-awareness is a key strength

When supporting them:
- You can draw on their spiritual/soul resources
- Help them connect challenges to their sense of meaning
- Their self-awareness is an asset - you can reflect patterns
- Bridge their soul strength to their growth areas

Be genuine and insightful.`;

  const soulMessage = "I feel like I understand my patterns intellectually but I keep repeating them in relationships. It's frustrating.";

  const soulResult = await callLM(soulPrompt, soulMessage);

  // Check for bridging soul awareness to relationships
  const soulKeywords = ['awareness', 'understanding', 'insight', 'wisdom', 'practice', 'meaning', 'growth', 'compassion'];
  const usedSoulStrength = soulKeywords.some((kw) =>
    soulResult.content.toLowerCase().includes(kw)
  );

  results.push({
    name: 'Leveraging soul strength',
    passed: usedSoulStrength,
    details: usedSoulStrength
      ? 'AI leveraged their self-awareness/soul strength'
      : 'AI did not leverage soul strength',
    aiResponse: soulResult.content.substring(0, 300) + '...',
    contextUsed: usedSoulStrength,
  });

  console.log(`   User: "${soulMessage}"`);
  console.log(`   AI: "${soulResult.content.substring(0, 200)}..."`);
  console.log(`   Used soul strength: ${usedSoulStrength ? '✅ Yes' : '❌ No'}`);
  console.log(`   Status: ${usedSoulStrength ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 4: AI should adapt recommendations to their stage
  // =========================================================================
  console.log('🧪 TEST 4: Stage-appropriate recommendations\n');

  const stagePrompt = `You are a growth-focused AI companion.

USER HEALTH CONTEXT:
- Body pillar is in COLLAPSE stage (45/100)
- This means: Basic regulation not yet established
- NOT ready for: Advanced practices, deep somatic work
- Needs: Simple, gentle, foundational practices

When recommending practices:
- Keep it SIMPLE - they're in collapse stage
- Focus on regulation basics, not optimization
- Don't suggest intense or complex practices
- Build foundation before advancing

Suggest one simple, achievable practice.`;

  const stageMessage = "I want to get better at managing my stress. What should I do?";

  const stageResult = await callLM(stagePrompt, stageMessage);

  // Check for simple/foundational recommendations (not advanced)
  const simpleKeywords = ['simple', 'start', 'begin', 'basic', 'gentle', 'easy', 'breath', 'moment', 'small', 'minutes'];
  // Use word boundaries to avoid false positives like "advance" in "5 minutes earlier"
  const advancedPatterns = [/\bintense\b/i, /\badvanced\b/i, /\bcomplex\b/i, /\bdeep dive\b/i, /\bmarathon\b/i, /\bextreme\b/i, /\bvipassana\b/i, /\bhour-long\b/i];

  const isSimple = simpleKeywords.some((kw) => stageResult.content.toLowerCase().includes(kw));
  const isAdvanced = advancedPatterns.some((pattern) => pattern.test(stageResult.content));
  const stageAppropriate = isSimple && !isAdvanced;

  results.push({
    name: 'Stage-appropriate advice',
    passed: stageAppropriate,
    details: stageAppropriate
      ? 'AI gave foundational advice appropriate for collapse stage'
      : isAdvanced
      ? 'AI suggested advanced practices (too complex for collapse stage)'
      : 'AI advice level unclear',
    aiResponse: stageResult.content.substring(0, 300) + '...',
    contextUsed: stageAppropriate,
  });

  console.log(`   User: "${stageMessage}"`);
  console.log(`   AI: "${stageResult.content.substring(0, 200)}..."`);
  console.log(`   Simple/foundational: ${isSimple ? '✅ Yes' : '❌ No'}`);
  console.log(`   Avoids advanced: ${!isAdvanced ? '✅ Yes' : '❌ No'}`);
  console.log(`   Status: ${stageAppropriate ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 5: AI should adapt tone based on recent mood data
  // =========================================================================
  console.log('🧪 TEST 5: Mood-adaptive tone\n');

  // Add some recent low-mood check-ins
  await prisma.quickCheckIn.createMany({
    data: [
      { userId: TEST_USER_ID, mood: 2, energy: 2, note: 'Feeling low' },
      { userId: TEST_USER_ID, mood: 2, energy: 3, note: 'Struggling today' },
    ],
  });

  const moodPrompt = `You are a compassionate AI companion.

USER CONTEXT:
- Recent check-ins show LOW MOOD (2/5 average)
- They've been struggling
- Energy also low (2-3/5)

When they're in a low state:
- Lead with warmth and validation
- Don't push for action or analysis
- Meet them where they are
- Offer presence, not solutions (unless asked)

Be gentle.`;

  const moodMessage = "I just don't feel like doing anything today.";

  const moodResult = await callLM(moodPrompt, moodMessage);

  // Check for gentle, validating tone (not pushy)
  const gentleKeywords = ['okay', 'valid', 'understand', 'hear you', 'makes sense', 'allowed', 'gentle', 'rest'];
  const pushyKeywords = ['should', 'must', 'need to', 'try harder', 'push through', 'force'];

  const isGentle = gentleKeywords.some((kw) => moodResult.content.toLowerCase().includes(kw));
  const isPushy = pushyKeywords.some((kw) => moodResult.content.toLowerCase().includes(kw));
  const moodAppropriate = isGentle && !isPushy;

  results.push({
    name: 'Mood-adaptive tone',
    passed: moodAppropriate,
    details: moodAppropriate
      ? 'AI was gentle and validating, appropriate for low mood'
      : isPushy
      ? 'AI was pushy (inappropriate for low mood)'
      : 'AI tone was neutral',
    aiResponse: moodResult.content.substring(0, 300) + '...',
    contextUsed: moodAppropriate,
  });

  console.log(`   User: "${moodMessage}"`);
  console.log(`   AI: "${moodResult.content.substring(0, 200)}..."`);
  console.log(`   Gentle/validating: ${isGentle ? '✅ Yes' : '❌ No'}`);
  console.log(`   Avoids pushy: ${!isPushy ? '✅ Yes' : '❌ No'}`);
  console.log(`   Status: ${moodAppropriate ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('='.repeat(70));
  console.log('📊 HEALTH CONTEXT TEST SUMMARY');
  console.log('='.repeat(70) + '\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   - ${r.name}: ${r.details}`);
    });
    console.log('');
  }

  console.log('Test Details:');
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name}: ${r.passed ? '✅' : '❌'} ${r.details}`);
  });

  console.log('\n' + '='.repeat(70) + '\n');

  // Cleanup: Remove test check-ins
  await prisma.quickCheckIn.deleteMany({
    where: {
      userId: TEST_USER_ID,
      note: { in: ['Feeling low', 'Struggling today'] },
    },
  });
}

main()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
