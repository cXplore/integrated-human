/**
 * AI Context Integration Tests
 * Tests how well the AI uses context from various sources
 * Run with: npx tsx scripts/test-ai-context-integration.ts
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
  category: string;
  name: string;
  passed: boolean;
  issue?: string;
  details: string;
}

const results: TestResult[] = [];

async function callLM(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 300  // Reduced from 500 to encourage brevity
): Promise<string> {
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

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔗 AI CONTEXT INTEGRATION TESTS');
  console.log('='.repeat(70));
  console.log(`Model: ${LM_STUDIO_MODEL}\n`);

  // =========================================================================
  // SETUP: Create rich test data
  // =========================================================================
  console.log('📝 SETUP: Creating test data...\n');

  // Clean up old test data first
  await prisma.journalEntry.deleteMany({ where: { userId: TEST_USER_ID, mood: { in: ['anxious', 'hopeful', 'frustrated'] } } });
  await prisma.dreamEntry.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.quickCheckIn.deleteMany({ where: { userId: TEST_USER_ID } });

  // Create journal entries with clear themes
  const journalEntries = [
    {
      content: "Had another argument with my partner about them needing space. I immediately spiraled into anxiety, convinced they're going to leave me. I know this pattern - the fear of abandonment takes over and I become clingy.",
      mood: 'anxious',
      tags: JSON.stringify(['relationship', 'attachment', 'anxiety']),
    },
    {
      content: "Tried the breathing exercise today when I felt triggered. It helped a little. My therapist says I need to work on tolerating uncertainty in relationships. It's so hard.",
      mood: 'hopeful',
      tags: JSON.stringify(['progress', 'coping', 'therapy']),
    },
    {
      content: "My boss criticized my work in front of everyone. I felt humiliated. I'm starting to see how I seek validation from authority figures the same way I do in relationships.",
      mood: 'frustrated',
      tags: JSON.stringify(['work', 'validation', 'pattern']),
    },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.create({
      data: { userId: TEST_USER_ID, ...entry },
    });
  }
  console.log(`   ✓ Created ${journalEntries.length} journal entries`);

  // Create dream entries
  const dreams = [
    {
      title: 'Chasing something I can never catch',
      content: 'I was running through a forest trying to catch up to someone I loved. No matter how fast I ran, they stayed just out of reach.',
      symbols: JSON.stringify(['chase', 'forest', 'loved one', 'unreachable']),
      emotions: JSON.stringify(['frustrated', 'desperate', 'longing']),
    },
    {
      title: 'Lost in a maze',
      content: 'I was in a huge maze and everyone else seemed to know the way out except me. I kept asking for help but people just walked past.',
      symbols: JSON.stringify(['maze', 'lost', 'ignored', 'others succeeding']),
      emotions: JSON.stringify(['confused', 'alone', 'inadequate']),
    },
  ];

  for (const dream of dreams) {
    await prisma.dreamEntry.create({
      data: { userId: TEST_USER_ID, ...dream },
    });
  }
  console.log(`   ✓ Created ${dreams.length} dream entries`);

  // Create check-ins showing a pattern
  const checkIns = [
    { mood: 2, energy: 3, note: 'Partner was distant today. Anxious all day.' },
    { mood: 4, energy: 4, note: 'Good conversation with partner. Feeling secure.' },
    { mood: 2, energy: 2, note: 'They didnt text back for hours. Spiraled.' },
    { mood: 3, energy: 3, note: 'Trying to stay grounded.' },
  ];

  for (const checkIn of checkIns) {
    await prisma.quickCheckIn.create({
      data: { userId: TEST_USER_ID, ...checkIn },
    });
  }
  console.log(`   ✓ Created ${checkIns.length} check-ins`);

  // Ensure health assessment exists
  await prisma.assessmentResult.upsert({
    where: { userId_type: { userId: TEST_USER_ID, type: 'attachment' } },
    update: {},
    create: {
      userId: TEST_USER_ID,
      type: 'attachment',
      results: JSON.stringify({
        style: 'anxious',
        anxietyPercent: 72,
        avoidancePercent: 28,
      }),
      summary: 'Anxious attachment (72% anxiety)',
    },
  });
  console.log('   ✓ Confirmed attachment assessment exists\n');

  // =========================================================================
  // TEST CONTEXT INTEGRATION
  // =========================================================================

  // Build a realistic context prompt like the platform does
  const buildContextPrompt = () => `You are a genuine AI companion on a personal growth platform.

## User Context
This user has been exploring their patterns on the platform:

### Recent Journal Themes
- Relationship anxiety and fear of abandonment
- Pattern recognition: seeking validation from partners and authority figures
- Working on coping skills (breathing exercises)
- Currently in therapy

### Recent Dreams
- Recurring theme: chasing something unreachable
- Feelings: frustrated, desperate, longing, alone

### Health Assessment
- Attachment Style: Anxious (72% anxiety, 28% avoidance)
- Relationships pillar is their lowest score

### Recent Check-ins
- Mood fluctuates based on partner's responsiveness
- Pattern: feels anxious when partner is distant, better after connection

### What they're working on
- Tolerating uncertainty in relationships
- Noticing patterns between childhood and current relationships

## Guidelines
- Reference their patterns naturally when relevant
- Don't force connections - only bring up context if it fits
- Don't over-recommend courses/articles - they're already working with a therapist
- Match their current energy and meet them where they are
- Be a supportive presence, not another authority figure`;

  // =========================================================================
  // TEST 1: Does AI reference journal patterns appropriately?
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 1: Journal Context Integration');
  console.log('━'.repeat(70) + '\n');

  const journalTestResponse = await callLM(
    buildContextPrompt(),
    "I got anxious again when my partner said they needed some alone time tonight."
  );

  const referencesJournalPattern = /pattern|before|notice|sounds familiar|you('ve)? mentioned/i.test(journalTestResponse);
  const mentionsAttachment = /attachment|abandonment|cling/i.test(journalTestResponse);
  const naturalIntegration = !/according to your journal|your journal says|I see from your entries/i.test(journalTestResponse);

  results.push({
    category: 'Context',
    name: 'Journal pattern integration',
    passed: referencesJournalPattern && naturalIntegration,
    issue: !referencesJournalPattern ? 'Did not reference patterns' : (!naturalIntegration ? 'Integration felt forced' : undefined),
    details: journalTestResponse.substring(0, 300),
  });

  console.log(`   User: "I got anxious again when my partner said they needed some alone time tonight."`);
  console.log(`   AI: "${journalTestResponse.substring(0, 250)}..."\n`);
  console.log(`   References patterns: ${referencesJournalPattern ? '✅' : '❌'}`);
  console.log(`   Mentions attachment: ${mentionsAttachment ? '✅' : '—'}`);
  console.log(`   Natural integration: ${naturalIntegration ? '✅' : '❌'}`);
  console.log(`   Status: ${referencesJournalPattern && naturalIntegration ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 2: Does AI acknowledge progress from journal?
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 2: Progress Acknowledgment');
  console.log('━'.repeat(70) + '\n');

  const progressResponse = await callLM(
    buildContextPrompt(),
    "I tried the breathing thing you mentioned last time. It kind of helped."
  );

  const acknowledgesProgress = /progress|step|growing|working on|nice|good|great to hear|that's great/i.test(progressResponse);
  const notOverlyEnthusiastic = !/amazing|incredible|fantastic|wonderful/i.test(progressResponse);

  results.push({
    category: 'Context',
    name: 'Progress acknowledgment',
    passed: acknowledgesProgress && notOverlyEnthusiastic,
    issue: !acknowledgesProgress ? 'Did not acknowledge progress' : (!notOverlyEnthusiastic ? 'Too enthusiastic' : undefined),
    details: progressResponse.substring(0, 300),
  });

  console.log(`   User: "I tried the breathing thing you mentioned last time. It kind of helped."`);
  console.log(`   AI: "${progressResponse.substring(0, 250)}..."\n`);
  console.log(`   Acknowledges progress: ${acknowledgesProgress ? '✅' : '❌'}`);
  console.log(`   Appropriate enthusiasm: ${notOverlyEnthusiastic ? '✅' : '❌'}`);
  console.log(`   Status: ${acknowledgesProgress && notOverlyEnthusiastic ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 3: Dream context integration
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 3: Dream Context Integration');
  console.log('━'.repeat(70) + '\n');

  const dreamContextPrompt = buildContextPrompt() + `\n\nThe user recently had a dream about chasing someone they loved but never catching them.`;

  const dreamResponse = await callLM(
    dreamContextPrompt,
    "I keep having this feeling like no matter what I do, I can't get my partner to really see me."
  );

  const connectsDream = /dream|chase|reach|catch|running/i.test(dreamResponse);
  const notForced = !/your dream means|the dream represents|I notice in your dream/i.test(dreamResponse);
  const insightful = /pattern|theme|feeling|similar|connect/i.test(dreamResponse);

  results.push({
    category: 'Context',
    name: 'Dream context integration',
    passed: (connectsDream || insightful) && notForced,
    issue: !connectsDream && !insightful ? 'Missed dream connection opportunity' : (!notForced ? 'Forced dream reference' : undefined),
    details: dreamResponse.substring(0, 300),
  });

  console.log(`   User: "I keep having this feeling like no matter what I do, I can't get my partner to really see me."`);
  console.log(`   AI: "${dreamResponse.substring(0, 250)}..."\n`);
  console.log(`   Connects to dream: ${connectsDream ? '✅' : '—'}`);
  console.log(`   Natural integration: ${notForced ? '✅' : '❌'}`);
  console.log(`   Insightful: ${insightful ? '✅' : '—'}`);
  console.log(`   Status: ${(connectsDream || insightful) && notForced ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 4: Over-recommendation check
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 4: Content Over-Recommendation');
  console.log('━'.repeat(70) + '\n');

  const recommendPrompt = buildContextPrompt() + `

AVAILABLE CONTENT:
- Article: "Understanding Anxious Attachment"
- Article: "5 Grounding Techniques for Anxiety"
- Course: "Anxious Attachment Healing" (8 lessons)
- Course: "Nervous System Reset" (6 lessons)
- Practice: "Box Breathing"
- Practice: "5-4-3-2-1 Grounding"

Remember: This user is already in therapy. Don't overwhelm with recommendations.`;

  const overRecommendResponse = await callLM(
    recommendPrompt,
    "I feel stuck. What should I do?"
  );

  // Count recommendations
  const articleMentions = (overRecommendResponse.match(/article|read|check out/gi) || []).length;
  const courseMentions = (overRecommendResponse.match(/course|lesson|module/gi) || []).length;
  const practiceMentions = (overRecommendResponse.match(/practice|exercise|technique|try/gi) || []).length;
  const totalRecommendations = articleMentions + courseMentions + practiceMentions;

  const notOverwhelming = totalRecommendations <= 3;
  const acknowledgesTherapy = /therapist|therapy|already working|you mentioned/i.test(overRecommendResponse);

  results.push({
    category: 'Recommendations',
    name: 'Not over-recommending',
    passed: notOverwhelming,
    issue: !notOverwhelming ? `Too many recommendations (${totalRecommendations})` : undefined,
    details: `Articles: ${articleMentions}, Courses: ${courseMentions}, Practices: ${practiceMentions}`,
  });

  console.log(`   User: "I feel stuck. What should I do?"`);
  console.log(`   AI: "${overRecommendResponse.substring(0, 250)}..."\n`);
  console.log(`   Recommendations: ${totalRecommendations} (articles: ${articleMentions}, courses: ${courseMentions}, practices: ${practiceMentions})`);
  console.log(`   Not overwhelming: ${notOverwhelming ? '✅' : '❌'}`);
  console.log(`   Acknowledges therapy: ${acknowledgesTherapy ? '✅' : '—'}`);
  console.log(`   Status: ${notOverwhelming ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 5: Check-in mood pattern recognition
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 5: Check-in Pattern Recognition');
  console.log('━'.repeat(70) + '\n');

  const checkinPrompt = buildContextPrompt() + `

RECENT CHECK-INS (last 4 days):
- Day 1: mood 2/5, "Partner was distant today. Anxious all day."
- Day 2: mood 4/5, "Good conversation with partner. Feeling secure."
- Day 3: mood 2/5, "They didn't text back for hours. Spiraled."
- Day 4: mood 3/5, "Trying to stay grounded."

You can see the clear pattern: mood directly correlates with partner's availability.`;

  const patternResponse = await callLM(
    checkinPrompt,
    "I've been tracking my mood and I don't really see any patterns."
  );

  const gentlyPointsOutPattern = /notice|pattern|connection|correlat|when.*partner|seems like/i.test(patternResponse);
  const notCondescending = !/actually|clearly|obviously|you should see/i.test(patternResponse);

  results.push({
    category: 'Context',
    name: 'Check-in pattern recognition',
    passed: gentlyPointsOutPattern && notCondescending,
    issue: !gentlyPointsOutPattern ? 'Missed opportunity to point out pattern' : (!notCondescending ? 'Came across as condescending' : undefined),
    details: patternResponse.substring(0, 300),
  });

  console.log(`   User: "I've been tracking my mood and I don't really see any patterns."`);
  console.log(`   AI: "${patternResponse.substring(0, 250)}..."\n`);
  console.log(`   Points out pattern gently: ${gentlyPointsOutPattern ? '✅' : '❌'}`);
  console.log(`   Not condescending: ${notCondescending ? '✅' : '❌'}`);
  console.log(`   Status: ${gentlyPointsOutPattern && notCondescending ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 6: Multi-turn conversation flow
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 6: Conversation Flow');
  console.log('━'.repeat(70) + '\n');

  // Simulate a multi-turn conversation
  const turn1 = await callLM(buildContextPrompt(), "Hey, rough day today.");
  console.log(`   Turn 1 - User: "Hey, rough day today."`);
  console.log(`   Turn 1 - AI: "${turn1.substring(0, 150)}..."\n`);

  const turn2Context = buildContextPrompt() + `\n\nConversation so far:\nUser: Hey, rough day today.\nAI: ${turn1}`;
  const turn2 = await callLM(turn2Context, "Yeah, partner stuff again.");
  console.log(`   Turn 2 - User: "Yeah, partner stuff again."`);
  console.log(`   Turn 2 - AI: "${turn2.substring(0, 150)}..."\n`);

  const turn3Context = turn2Context + `\nUser: Yeah, partner stuff again.\nAI: ${turn2}`;
  const turn3 = await callLM(turn3Context, "I just wish I didn't care so much, you know?");
  console.log(`   Turn 3 - User: "I just wish I didn't care so much, you know?"`);
  console.log(`   Turn 3 - AI: "${turn3.substring(0, 150)}..."\n`);

  // Check flow quality
  const flowsNaturally = turn2.length < 400 && turn3.length < 400; // Not over-explaining
  const buildsonContext = /partner|relationship|care|feel/i.test(turn3);
  const asksMeaningfulQuestions = /\?/.test(turn1) || /\?/.test(turn2);

  results.push({
    category: 'Conversation',
    name: 'Natural flow',
    passed: flowsNaturally && buildsonContext,
    issue: !flowsNaturally ? 'Responses too long for conversation' : (!buildsonContext ? 'Lost thread of conversation' : undefined),
    details: `Turn lengths: ${turn1.length}, ${turn2.length}, ${turn3.length}`,
  });

  console.log(`   Flows naturally: ${flowsNaturally ? '✅' : '❌'}`);
  console.log(`   Builds on context: ${buildsonContext ? '✅' : '❌'}`);
  console.log(`   Asks questions: ${asksMeaningfulQuestions ? '✅' : '—'}`);
  console.log(`   Status: ${flowsNaturally && buildsonContext ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 7: Doesn't repeat same advice
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 7: Advice Variety');
  console.log('━'.repeat(70) + '\n');

  const advicePrompts = [
    "I'm feeling anxious about my relationship.",
    "The anxiety is back again about my partner.",
    "Why do I keep getting anxious about relationships?",
  ];

  const adviceResponses: string[] = [];
  for (const prompt of advicePrompts) {
    const resp = await callLM(buildContextPrompt(), prompt);
    adviceResponses.push(resp);
  }

  // Check for variety - responses shouldn't be too similar
  const resp1Words = new Set(adviceResponses[0].toLowerCase().split(/\s+/));
  const resp2Words = new Set(adviceResponses[1].toLowerCase().split(/\s+/));
  const resp3Words = new Set(adviceResponses[2].toLowerCase().split(/\s+/));

  const overlap12 = [...resp1Words].filter(w => resp2Words.has(w) && w.length > 4).length;
  const overlap23 = [...resp2Words].filter(w => resp3Words.has(w) && w.length > 4).length;
  const avgOverlap = (overlap12 + overlap23) / 2;

  // Also check if same exact phrases are repeated
  const repeatedPhrases = [
    /let's (pause|take a moment)/i,
    /breathing exercise/i,
    /I hear you/i,
  ];
  let phraseRepeatCount = 0;
  for (const phrase of repeatedPhrases) {
    const matches = adviceResponses.filter(r => phrase.test(r)).length;
    if (matches >= 2) phraseRepeatCount++;
  }

  const hasVariety = phraseRepeatCount < 2;

  results.push({
    category: 'Quality',
    name: 'Response variety',
    passed: hasVariety,
    issue: !hasVariety ? `${phraseRepeatCount} phrases repeated across responses` : undefined,
    details: `Word overlap: ~${avgOverlap} words, Phrase repeats: ${phraseRepeatCount}`,
  });

  console.log(`   Asked 3 similar anxiety questions`);
  console.log(`   Response 1: "${adviceResponses[0].substring(0, 100)}..."`);
  console.log(`   Response 2: "${adviceResponses[1].substring(0, 100)}..."`);
  console.log(`   Response 3: "${adviceResponses[2].substring(0, 100)}..."\n`);
  console.log(`   Has variety: ${hasVariety ? '✅' : '❌'}`);
  console.log(`   Phrase repeats: ${phraseRepeatCount}`);
  console.log(`   Status: ${hasVariety ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // TEST 8: Health assessment integration
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📋 TEST 8: Health Assessment Integration');
  console.log('━'.repeat(70) + '\n');

  const healthPrompt = buildContextPrompt() + `

HEALTH ASSESSMENT RESULTS:
- Attachment: Anxious (72% anxiety, 28% avoidance)
- Nervous System: Sympathetic dominant (hyperarousal)
- Integration Health:
  - Mind: 55/100 (regulation stage)
  - Body: 45/100 (collapse stage)
  - Soul: 60/100 (integration stage)
  - Relationships: 40/100 (regulation stage) <- LOWEST

The user's main growth areas are relationships and body regulation.`;

  const healthResponse = await callLM(
    healthPrompt,
    "Sometimes I wonder why I'm like this. Like, is there something wrong with me?"
  );

  const usesHealthContext = /attachment|pattern|nervous system|regulation|understand yourself/i.test(healthResponse);
  // Check for pathologizing - only fails if AI agrees something is "wrong" with them
  const notPathologizing = !/\b(you are broken|something is wrong with you|you('re| are) damaged|disorder)\b/i.test(healthResponse);
  const normalizes = /many people|common|human|normal|natural/i.test(healthResponse);

  results.push({
    category: 'Context',
    name: 'Health assessment integration',
    passed: usesHealthContext && notPathologizing,
    issue: !usesHealthContext ? 'Did not use health context' : (!notPathologizing ? 'Pathologized the user' : undefined),
    details: healthResponse.substring(0, 300),
  });

  console.log(`   User: "Sometimes I wonder why I'm like this. Like, is there something wrong with me?"`);
  console.log(`   AI: "${healthResponse.substring(0, 250)}..."\n`);
  console.log(`   Uses health context: ${usesHealthContext ? '✅' : '❌'}`);
  console.log(`   Not pathologizing: ${notPathologizing ? '✅' : '❌'}`);
  console.log(`   Normalizes: ${normalizes ? '✅' : '—'}`);
  console.log(`   Status: ${usesHealthContext && notPathologizing ? '✅ PASS' : '❌ FAIL'}\n`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('━'.repeat(70));
  console.log('📊 CONTEXT INTEGRATION SUMMARY');
  console.log('━'.repeat(70) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('Issues Found:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.category}/${r.name}: ${r.issue}`);
    });
    console.log('');
  }

  console.log('By Category:');
  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    console.log(`   ${cat}: ${catPassed}/${catResults.length}`);
  }

  console.log('\n' + '━'.repeat(70) + '\n');

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await prisma.journalEntry.deleteMany({ where: { userId: TEST_USER_ID, mood: { in: ['anxious', 'hopeful', 'frustrated'] } } });
  await prisma.dreamEntry.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.quickCheckIn.deleteMany({ where: { userId: TEST_USER_ID } });
  console.log('   Done.\n');
}

main()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
