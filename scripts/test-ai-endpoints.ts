/**
 * Test AI endpoints with test user authentication
 * Run with: npx tsx scripts/test-ai-endpoints.ts
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
  status: 'pass' | 'fail';
  response?: string;
  tokens?: { input: number; output: number; total: number };
  time?: number;
  error?: string;
}

const results: TestResult[] = [];

async function testLMStudioDirect(name: string, systemPrompt: string, userMessage: string): Promise<TestResult> {
  const start = Date.now();

  try {
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

    if (!response.ok) {
      return { name, status: 'fail', error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const elapsed = Date.now() - start;

    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return {
      name,
      status: 'pass',
      response: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      tokens: {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0,
      },
      time: elapsed,
    };
  } catch (error) {
    return { name, status: 'fail', error: String(error) };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 AI ENDPOINT TESTS');
  console.log('='.repeat(60));
  console.log(`LM Studio URL: ${LM_STUDIO_URL}`);
  console.log(`Model: ${LM_STUDIO_MODEL}`);
  console.log('');

  // Check LM Studio is running
  try {
    const modelsRes = await fetch(LM_STUDIO_URL.replace('/chat/completions', '/models'));
    if (!modelsRes.ok) throw new Error('LM Studio not responding');
    console.log('✅ LM Studio is running\n');
  } catch (error) {
    console.error('❌ LM Studio is not running at', LM_STUDIO_URL);
    process.exit(1);
  }

  // Check test user exists
  const user = await prisma.user.findUnique({
    where: { id: TEST_USER_ID },
    include: { aiCredits: true, profile: true },
  });

  if (!user) {
    console.error('❌ Test user not found. Run: npx tsx scripts/create-test-user.ts');
    process.exit(1);
  }
  console.log(`✅ Test user: ${user.email}`);
  console.log(`✅ AI Credits: ${user.aiCredits?.tokenBalance?.toLocaleString() || 0} tokens\n`);

  // Test 1: Casual Chat
  console.log('📝 TEST 1: Casual Chat (chill stance)');
  const casual = await testLMStudioDirect(
    'Casual Chat',
    `You are a genuine AI companion. Not a therapist. Not a guru. Just someone real to talk to.
Your vibe: Warm but not fake, interested but not nosy, helpful but not preachy.
How you talk: Like texting a friend who happens to be wise. Match their energy.
Right now: Just hanging out. No agenda. Chat naturally about whatever.`,
    'Hey, how are you doing today?'
  );
  results.push(casual);
  console.log(`   Status: ${casual.status === 'pass' ? '✅' : '❌'}`);
  console.log(`   Response: ${casual.response}`);
  console.log(`   Tokens: ${casual.tokens?.total} (${casual.time}ms)\n`);

  // Test 2: Supportive Chat
  console.log('📝 TEST 2: Supportive Chat (supportive stance)');
  const supportive = await testLMStudioDirect(
    'Supportive Chat',
    `You are a genuine AI companion. Warm but not fake.
Right now: They're going through something. Be there for them.
- Listen more than advise
- Validate without overdoing it
- Ask what they need (advice? just to vent?)
- Keep it real, not clinical`,
    'I feel stuck in my personal growth. Like I\'m not making any progress.'
  );
  results.push(supportive);
  console.log(`   Status: ${supportive.status === 'pass' ? '✅' : '❌'}`);
  console.log(`   Response: ${supportive.response}`);
  console.log(`   Tokens: ${supportive.tokens?.total} (${supportive.time}ms)\n`);

  // Test 3: Where I'm Stuck
  console.log('📝 TEST 3: Where I\'m Stuck (resource recommendation)');
  const stuck = await testLMStudioDirect(
    'Where I\'m Stuck',
    `You are a guide helping people find the right resources for where they're stuck.
Your role: When someone describes what they're struggling with:
1. Acknowledge briefly (1-2 sentences)
2. Offer insight (1-2 sentences)
3. Recommend 2-3 specific resources
Be direct and practical.

AVAILABLE COURSES:
- Shadow Work Fundamentals: Explore hidden aspects of self
- Anxious Attachment Healing: Develop secure attachment
- Nervous System Reset: Regulate your nervous system

RESPONSE FORMAT:
[Acknowledgment and insight - 2-3 sentences max]

RECOMMENDATIONS:
1. **[Title]** (type: course, slug: the-slug)
   Why: [1 sentence]`,
    'I keep attracting unavailable partners and I don\'t know why'
  );
  results.push(stuck);
  console.log(`   Status: ${stuck.status === 'pass' ? '✅' : '❌'}`);
  console.log(`   Response: ${stuck.response}`);
  console.log(`   Tokens: ${stuck.tokens?.total} (${stuck.time}ms)\n`);

  // Test 4: Dream Interpretation
  console.log('📝 TEST 4: Dream Interpretation');
  const dream = await testLMStudioDirect(
    'Dream Interpretation',
    `You are a thoughtful dream analyst drawing from Jungian psychology.
Your approach:
1. Symbol Exploration: Identify key symbols and possible meanings
2. Emotional Landscape: Reflect on emotional tone
3. Shadow Elements: Gently explore shadow material
4. Integration Questions: Offer 2-3 reflection questions
5. Practical Wisdom: Suggest how the dream applies to waking life

Use "might," "could suggest," "one possibility" - never be dogmatic.
Keep interpretations grounded and useful.`,
    `Here is a dream to interpret:
I was in a house I didn't recognize but it felt like home. I kept finding new rooms I'd never seen before. In one room there was a mirror but when I looked into it, I couldn't see my face clearly.

Emotional Tone: curious, slightly anxious
Symbols: house, rooms, mirror`
  );
  results.push(dream);
  console.log(`   Status: ${dream.status === 'pass' ? '✅' : '❌'}`);
  console.log(`   Response: ${dream.response}`);
  console.log(`   Tokens: ${dream.tokens?.total} (${dream.time}ms)\n`);

  // Test 5: Journal Companion
  console.log('📝 TEST 5: Journal Companion');
  const journal = await testLMStudioDirect(
    'Journal Companion',
    `You are a thoughtful companion helping someone reflect on their journal entries.
Your role:
- Notice patterns across entries
- Ask questions that deepen self-understanding
- Reflect back what you see without judgment
- Help them connect dots they might miss

Be warm but not saccharine. Insightful but not preachy.

Recent journal entries:
Entry 1: "Today I practiced breathwork for the first time. It felt strange at first but I noticed a shift in my energy by the end."
Entry 2: "Had a difficult conversation with a friend. I noticed myself getting defensive but was able to pause and respond rather than react."`,
    'What patterns do you notice in my writing?'
  );
  results.push(journal);
  console.log(`   Status: ${journal.status === 'pass' ? '✅' : '❌'}`);
  console.log(`   Response: ${journal.response}`);
  console.log(`   Tokens: ${journal.tokens?.total} (${journal.time}ms)\n`);

  // Test 6: Deep Exploration
  console.log('📝 TEST 6: Deep Exploration (deep stance)');
  const deep = await testLMStudioDirect(
    'Deep Exploration',
    `You are a genuine AI companion.
Right now: They want to explore something meaningful.
- Take it seriously but stay grounded
- Ask good questions
- Offer perspective when invited
- Help them think, don't think for them`,
    'I\'ve been wondering why I always feel like I need to prove myself. Even when I achieve something, it never feels like enough.'
  );
  results.push(deep);
  console.log(`   Status: ${deep.status === 'pass' ? '✅' : '❌'}`);
  console.log(`   Response: ${deep.response}`);
  console.log(`   Tokens: ${deep.tokens?.total} (${deep.time}ms)\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('📊 AI TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const totalTokens = results.reduce((sum, r) => sum + (r.tokens?.total || 0), 0);
  const avgTime = Math.round(results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length);

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔢 Total tokens used: ${totalTokens.toLocaleString()}`);
  console.log(`⏱️  Average response time: ${avgTime}ms`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n✨ AI Response Quality Notes:');
  console.log('   - Check if responses match the intended stance');
  console.log('   - Verify recommendations include proper slugs');
  console.log('   - Ensure tone is warm but not clinical');
  console.log('   - Dream interpretations should use tentative language');
  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
