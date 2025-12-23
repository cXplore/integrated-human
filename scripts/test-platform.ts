/**
 * Automated Platform Testing Script
 * Tests key user flows and API endpoints
 * Run with: npx tsx scripts/test-platform.ts
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

const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'testuser@integrated-human.dev';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function log(result: TestResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
  results.push(result);
}

async function testPage(name: string, path: string, expectedContent?: string[]): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) {
      log({ name, status: 'fail', message: `HTTP ${res.status}`, details: path });
      return false;
    }

    const html = await res.text();

    if (expectedContent) {
      for (const content of expectedContent) {
        if (!html.includes(content)) {
          log({ name, status: 'warn', message: `Missing expected content: "${content}"`, details: path });
          return false;
        }
      }
    }

    log({ name, status: 'pass', message: 'Page loads correctly' });
    return true;
  } catch (error) {
    log({ name, status: 'fail', message: `Error: ${error}`, details: path });
    return false;
  }
}

async function testAPI(name: string, path: string, method: string = 'GET', expectAuth: boolean = false): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method });

    if (expectAuth && res.status === 401) {
      log({ name, status: 'pass', message: 'Correctly requires authentication' });
      return true;
    }

    if (!res.ok && res.status !== 401) {
      log({ name, status: 'fail', message: `HTTP ${res.status}`, details: path });
      return false;
    }

    log({ name, status: 'pass', message: `API responds correctly (${res.status})` });
    return true;
  } catch (error) {
    log({ name, status: 'fail', message: `Error: ${error}`, details: path });
    return false;
  }
}

async function testDatabase() {
  console.log('\n📊 DATABASE TESTS\n');

  // Test user exists
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: {
        profile: true,
        aiCredits: true,
        assessmentResults: true,
        journalEntries: true,
        quickCheckIns: true,
        integrationHealth: true,
      },
    });

    if (!user) {
      log({ name: 'Test User', status: 'fail', message: 'Test user not found in database' });
      return;
    }

    log({ name: 'Test User', status: 'pass', message: `Found: ${user.id}` });

    // Check profile
    if (user.profile?.onboardingCompleted) {
      log({ name: 'User Profile', status: 'pass', message: 'Onboarding completed' });
    } else {
      log({ name: 'User Profile', status: 'warn', message: 'Onboarding not completed' });
    }

    // Check AI credits
    if (user.aiCredits && user.aiCredits.tokenBalance > 0) {
      log({ name: 'AI Credits', status: 'pass', message: `${user.aiCredits.tokenBalance.toLocaleString()} tokens available` });
    } else {
      log({ name: 'AI Credits', status: 'warn', message: 'No AI credits' });
    }

    // Check assessments
    const assessmentTypes = user.assessmentResults.map(a => a.type);
    if (assessmentTypes.length >= 3) {
      log({ name: 'Assessments', status: 'pass', message: `${assessmentTypes.length} assessments: ${assessmentTypes.join(', ')}` });
    } else {
      log({ name: 'Assessments', status: 'warn', message: `Only ${assessmentTypes.length} assessments` });
    }

    // Check journal
    if (user.journalEntries.length > 0) {
      log({ name: 'Journal Entries', status: 'pass', message: `${user.journalEntries.length} entries` });
    } else {
      log({ name: 'Journal Entries', status: 'warn', message: 'No journal entries' });
    }

    // Check quick check-ins
    if (user.quickCheckIns.length > 0) {
      log({ name: 'Quick Check-ins', status: 'pass', message: `${user.quickCheckIns.length} check-ins` });
    } else {
      log({ name: 'Quick Check-ins', status: 'warn', message: 'No check-ins' });
    }

    // Check integration health
    if (user.integrationHealth.length > 0) {
      const latest = user.integrationHealth[0];
      log({
        name: 'Integration Health',
        status: 'pass',
        message: `Mind: ${latest.mindScore}, Body: ${latest.bodyScore}, Soul: ${latest.soulScore}, Relationships: ${latest.relationshipsScore}`
      });
    } else {
      log({ name: 'Integration Health', status: 'warn', message: 'No health data' });
    }

  } catch (error) {
    log({ name: 'Database Connection', status: 'fail', message: `${error}` });
  }
}

async function testPublicPages() {
  console.log('\n🌐 PUBLIC PAGES\n');

  await testPage('Homepage', '/');
  await testPage('Login Page', '/login', ['Continue with Google']);
  await testPage('Library', '/library');
  await testPage('Courses', '/courses');
  await testPage('Practices', '/practices');
  await testPage('Start Here', '/start-here');
  await testPage('Pricing', '/pricing');
  await testPage('About', '/about');
  await testPage('Privacy', '/privacy');
  await testPage('Terms', '/terms');
}

async function testPillarPages() {
  console.log('\n🏛️ PILLAR PAGES\n');

  await testPage('Mind', '/mind');
  await testPage('Body', '/body');
  await testPage('Soul', '/soul');
  await testPage('Relationships', '/relationships');
}

async function testAssessmentPages() {
  console.log('\n📋 ASSESSMENT PAGES\n');

  await testPage('Archetypes Quiz', '/archetypes');
  await testPage('Attachment Quiz', '/attachment');
  await testPage('Nervous System Check', '/nervous-system-check');
  await testPage('Shadow Profile', '/shadow-profile');
  await testPage('Values Reflection', '/values');
}

async function testToolPages() {
  console.log('\n🔧 TOOL PAGES\n');

  await testPage('Learning Paths', '/learn/paths');
  await testPage('Stuck Helper', '/stuck');
  await testPage('Books', '/books');
}

async function testProtectedPages() {
  console.log('\n🔒 PROTECTED PAGES (should redirect or show login)\n');

  // These should redirect to login or show auth required
  await testPage('Profile (unauth)', '/profile');
  await testPage('Journal (unauth)', '/profile/journal');
  await testPage('Dreams (unauth)', '/profile/dreams');
  await testPage('Chat (unauth)', '/chat');
}

async function testPublicAPIs() {
  console.log('\n🔌 PUBLIC API ENDPOINTS\n');

  await testAPI('GET /api/courses', '/api/courses');
  await testAPI('GET /api/posts', '/api/posts');
  await testAPI('GET /api/practices', '/api/practices');
  await testAPI('GET /api/paths', '/api/paths');
  await testAPI('GET /api/search', '/api/search?q=anxiety');
}

async function testProtectedAPIs() {
  console.log('\n🔐 PROTECTED API ENDPOINTS (should require auth)\n');

  await testAPI('GET /api/credits', '/api/credits', 'GET', true);
  await testAPI('GET /api/journal', '/api/journal', 'GET', true);
  await testAPI('GET /api/dreams', '/api/dreams', 'GET', true);
  await testAPI('GET /api/assessments', '/api/assessments', 'GET', true);
  await testAPI('GET /api/chat/conversations', '/api/chat/conversations', 'GET', true);
  await testAPI('GET /api/quick-check-in', '/api/quick-check-in', 'GET', true);
  await testAPI('GET /api/health', '/api/health', 'GET', true);
}

async function testContentExists() {
  console.log('\n📚 CONTENT AVAILABILITY\n');

  // Check if we can load some actual content
  try {
    const coursesRes = await fetch(`${BASE_URL}/api/courses`);
    if (coursesRes.ok) {
      const data = await coursesRes.json();
      const courseCount = Array.isArray(data) ? data.length : (data.courses?.length || 0);
      if (courseCount > 50) {
        log({ name: 'Courses Content', status: 'pass', message: `${courseCount} courses available` });
      } else if (courseCount > 0) {
        log({ name: 'Courses Content', status: 'warn', message: `Only ${courseCount} courses` });
      } else {
        log({ name: 'Courses Content', status: 'fail', message: 'No courses found' });
      }
    }
  } catch (e) {
    log({ name: 'Courses Content', status: 'fail', message: `Error: ${e}` });
  }

  try {
    const postsRes = await fetch(`${BASE_URL}/api/posts`);
    if (postsRes.ok) {
      const data = await postsRes.json();
      const postCount = Array.isArray(data) ? data.length : (data.posts?.length || 0);
      if (postCount > 100) {
        log({ name: 'Articles Content', status: 'pass', message: `${postCount} articles available` });
      } else if (postCount > 0) {
        log({ name: 'Articles Content', status: 'warn', message: `Only ${postCount} articles` });
      } else {
        log({ name: 'Articles Content', status: 'fail', message: 'No articles found' });
      }
    }
  } catch (e) {
    log({ name: 'Articles Content', status: 'fail', message: `Error: ${e}` });
  }

  try {
    const practicesRes = await fetch(`${BASE_URL}/api/practices`);
    if (practicesRes.ok) {
      const data = await practicesRes.json();
      const practiceCount = Array.isArray(data) ? data.length : (data.practices?.length || 0);
      if (practiceCount >= 10) {
        log({ name: 'Practices Content', status: 'pass', message: `${practiceCount} practices available` });
      } else if (practiceCount > 0) {
        log({ name: 'Practices Content', status: 'warn', message: `Only ${practiceCount} practices` });
      } else {
        log({ name: 'Practices Content', status: 'fail', message: 'No practices found' });
      }
    }
  } catch (e) {
    log({ name: 'Practices Content', status: 'fail', message: `Error: ${e}` });
  }
}

async function testSampleContent() {
  console.log('\n📖 SAMPLE CONTENT PAGES\n');

  // Test a few specific content pages
  await testPage('Sample Article', '/posts/shadow-work-beginners-guide');
  await testPage('Sample Course', '/courses/anxiety-first-aid');
  await testPage('Sample Practice', '/practices/box-breathing');
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  if (warned > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.filter(r => r.status === 'warn').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 INTEGRATED HUMAN - AUTOMATED PLATFORM TESTS');
  console.log('='.repeat(60));
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  // First check if server is running
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running at', BASE_URL);
    console.error('Please start the dev server first: npm run dev');
    process.exit(1);
  }

  await testDatabase();
  await testPublicPages();
  await testPillarPages();
  await testAssessmentPages();
  await testToolPages();
  await testProtectedPages();
  await testPublicAPIs();
  await testProtectedAPIs();
  await testContentExists();
  await testSampleContent();

  await printSummary();
}

main()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
