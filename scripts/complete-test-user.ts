/**
 * Complete test user setup (adds profile and other data to existing user)
 * Run with: npx tsx scripts/complete-test-user.ts
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

  // Find the test user
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!user) {
    console.log('Test user not found. Run create-test-user.ts first.');
    return;
  }

  console.log('Found test user:', user.id);

  // Check if profile exists
  const existingProfile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (!existingProfile) {
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
  } else {
    console.log('Profile already exists');
  }

  // Check if AI credits exist
  const existingCredits = await prisma.aICredits.findUnique({
    where: { userId: user.id },
  });

  if (!existingCredits) {
    await prisma.aICredits.create({
      data: {
        userId: user.id,
        tokenBalance: 500000, // 500k tokens
        monthlyTokens: 500000,
        purchasedTokens: 0,
      },
    });
    console.log('Created AI credits (500k tokens)');
  } else {
    console.log('AI credits already exist:', existingCredits.tokenBalance);
  }

  // Check for assessment results
  const existingAssessments = await prisma.assessmentResult.count({
    where: { userId: user.id },
  });

  if (existingAssessments === 0) {
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
  } else {
    console.log('Assessments already exist:', existingAssessments);
  }

  // Check for journal entries
  const existingJournals = await prisma.journalEntry.count({
    where: { userId: user.id },
  });

  if (existingJournals === 0) {
    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        content: 'Today I practiced breathwork for the first time. It felt strange at first but I noticed a shift in my energy by the end.',
        mood: 'curious',
        tags: JSON.stringify(['breathwork', 'first-time', 'body']),
      },
    });
    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        content: 'Had a difficult conversation with a friend. I noticed myself getting defensive but was able to pause and respond rather than react.',
        mood: 'reflective',
        tags: JSON.stringify(['relationships', 'growth', 'awareness']),
      },
    });
    console.log('Created journal entries');
  } else {
    console.log('Journal entries already exist:', existingJournals);
  }

  // Check for quick check-ins
  const existingCheckIns = await prisma.quickCheckIn.count({
    where: { userId: user.id },
  });

  if (existingCheckIns === 0) {
    await prisma.quickCheckIn.createMany({
      data: [
        {
          userId: user.id,
          mood: 7,
          energy: 6,
          pillarFocus: 'body',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          mood: 8,
          energy: 7,
          pillarFocus: 'mind',
          createdAt: new Date(),
        },
      ],
    });
    console.log('Created quick check-ins');
  } else {
    console.log('Quick check-ins already exist:', existingCheckIns);
  }

  // Check for integration health
  const existingHealth = await prisma.integrationHealth.findFirst({
    where: { userId: user.id },
  });

  if (!existingHealth) {
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
  } else {
    console.log('Integration health already exists');
  }

  console.log('\n========================================');
  console.log('Test user setup complete!');
  console.log('========================================');
  console.log('Email:', testEmail);
  console.log('User ID:', user.id);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
