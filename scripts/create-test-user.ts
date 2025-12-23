/**
 * Create a test user for development/testing
 * Run with: npx tsx scripts/create-test-user.ts
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

async function main() {
  const testEmail = 'testuser@integrated-human.dev';

  // Check if test user already exists
  const existing = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existing) {
    console.log('Test user already exists:', existing.id);
    console.log('Email:', testEmail);
    return;
  }

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test User',
      emailVerified: new Date(),
      newsletterSubscribed: false,
    },
  });

  console.log('Created test user:', user.id);

  // Create user profile (onboarded)
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      onboardingCompleted: true,
      primaryIntention: 'growth',
      lifeSituation: 'stable',
      currentChallenges: JSON.stringify(['anxiety', 'self-worth']),
      experienceLevels: JSON.stringify({
        meditation: 2,
        therapy: 3,
        bodywork: 1,
        spirituality: 2,
      }),
      depthPreference: 'moderate',
      learningStyle: 'reading',
    },
  });

  console.log('Created user profile');

  // Create AI credits
  await prisma.aICredits.create({
    data: {
      userId: user.id,
      tokenBalance: 500000, // 500k tokens to test with
      monthlyTokens: 500000,
      purchasedTokens: 0,
    },
  });

  console.log('Created AI credits (500k tokens)');

  // Create some assessment results
  await prisma.assessmentResult.createMany({
    data: [
      {
        userId: user.id,
        type: 'archetype',
        results: JSON.stringify({
          primaryArchetype: 'Sovereign',
          isWounded: false,
          isIntegrated: true,
          masculineScore: 55,
          feminineScore: 45,
        }),
      },
      {
        userId: user.id,
        type: 'attachment',
        results: JSON.stringify({
          style: 'secure-leaning',
          anxietyPercent: 35,
          avoidancePercent: 25,
        }),
      },
      {
        userId: user.id,
        type: 'nervous-system',
        results: JSON.stringify({
          state: 'ventral',
          primary: 'ventral',
          counts: { ventral: 8, sympathetic: 4, dorsal: 2 },
        }),
      },
    ],
  });

  console.log('Created assessment results');

  // Create a few journal entries
  const journalEntries = [
    {
      userId: user.id,
      content: 'Today I practiced breathwork for the first time. It felt strange at first but I noticed a shift in my energy by the end.',
      mood: 'curious',
      tags: JSON.stringify(['breathwork', 'first-time', 'body']),
    },
    {
      userId: user.id,
      content: 'Had a difficult conversation with a friend. I noticed myself getting defensive but was able to pause and respond rather than react.',
      mood: 'reflective',
      tags: JSON.stringify(['relationships', 'growth', 'awareness']),
    },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.create({ data: entry });
  }

  console.log('Created journal entries');

  // Create quick check-ins
  await prisma.quickCheckIn.createMany({
    data: [
      {
        userId: user.id,
        mood: 7,
        energy: 6,
        pillarFocus: 'body',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
      {
        userId: user.id,
        mood: 8,
        energy: 7,
        pillarFocus: 'mind',
        createdAt: new Date(), // Today
      },
    ],
  });

  console.log('Created quick check-ins');

  // Create integration health
  await prisma.integrationHealth.create({
    data: {
      userId: user.id,
      mindScore: 55,
      bodyScore: 45,
      soulScore: 50,
      relationshipsScore: 60,
      mindStage: 'integration',
      bodyStage: 'regulation',
      soulStage: 'integration',
      relationshipsStage: 'integration',
    },
  });

  console.log('Created integration health');

  // Create some article progress
  await prisma.articleProgress.createMany({
    data: [
      {
        userId: user.id,
        slug: 'anxiety-is-not-your-enemy',
        completed: true,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        scrollProgress: 100,
      },
      {
        userId: user.id,
        slug: 'nervous-system-basics',
        completed: false,
        scrollProgress: 45,
      },
    ],
  });

  console.log('Created article progress');

  console.log('\n========================================');
  console.log('Test user created successfully!');
  console.log('========================================');
  console.log('Email:', testEmail);
  console.log('User ID:', user.id);
  console.log('\nTo log in as this user in development:');
  console.log('1. Go to http://localhost:3000/login');
  console.log('2. The test user bypasses OAuth in dev mode');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error creating test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
