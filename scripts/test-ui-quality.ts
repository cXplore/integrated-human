/**
 * UI Quality & Polish Testing Script
 * Checks for common issues, missing content, broken links, etc.
 * Run with: npx tsx scripts/test-ui-quality.ts
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location?: string;
  suggestion?: string;
}

const issues: Issue[] = [];

function addIssue(issue: Issue) {
  issues.push(issue);
  const icon = issue.severity === 'critical' ? '🔴' :
               issue.severity === 'high' ? '🟠' :
               issue.severity === 'medium' ? '🟡' : '🟢';
  console.log(`${icon} [${issue.category}] ${issue.description}`);
  if (issue.suggestion) {
    console.log(`   💡 ${issue.suggestion}`);
  }
}

async function checkPage(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function checkNavigation() {
  console.log('\n📍 NAVIGATION CHECKS\n');

  const html = await checkPage('/');
  if (!html) {
    addIssue({
      severity: 'critical',
      category: 'Navigation',
      description: 'Homepage not loading',
    });
    return;
  }

  // Check for key navigation elements
  const navItems = [
    { text: 'Start Here', check: '/start-here' },
    { text: 'Explore', check: 'Explore' },
    { text: 'Learn', check: 'Learn' },
    { text: 'Tools', check: 'Tools' },
    { text: 'Community', check: 'Community' },
    { text: 'About', check: 'About' },
  ];

  for (const item of navItems) {
    if (!html.includes(item.check)) {
      addIssue({
        severity: 'medium',
        category: 'Navigation',
        description: `Missing nav item: ${item.text}`,
        location: 'Header navigation',
      });
    }
  }

  // Check footer links
  const footerLinks = ['Mind', 'Body', 'Soul', 'Relationships', 'Privacy', 'Terms'];
  for (const link of footerLinks) {
    if (!html.includes(`>${link}<`)) {
      addIssue({
        severity: 'low',
        category: 'Navigation',
        description: `Footer may be missing: ${link}`,
        location: 'Footer',
      });
    }
  }

  console.log('✅ Navigation structure verified');
}

async function checkHomepageContent() {
  console.log('\n🏠 HOMEPAGE CONTENT CHECKS\n');

  const html = await checkPage('/');
  if (!html) return;

  // Check hero section
  if (!html.includes('Integrated Human')) {
    addIssue({
      severity: 'high',
      category: 'Content',
      description: 'Missing main heading on homepage',
      location: 'Hero section',
    });
  }

  // Check for CTA
  if (!html.includes('/start-here') && !html.includes('Start Here')) {
    addIssue({
      severity: 'medium',
      category: 'UX',
      description: 'No clear CTA to Start Here on homepage',
      suggestion: 'Add prominent Start Here button',
    });
  }

  // Check for four pillars
  const pillars = ['Mind', 'Body', 'Soul', 'Relationships'];
  for (const pillar of pillars) {
    if (!html.includes(`href="/${pillar.toLowerCase()}"`) && !html.includes(`href=\\\"/${pillar.toLowerCase()}\\\"`)) {
      addIssue({
        severity: 'medium',
        category: 'Content',
        description: `Pillar link may be missing: ${pillar}`,
        location: 'Four Pillars section',
      });
    }
  }

  console.log('✅ Homepage content verified');
}

async function checkLoginPage() {
  console.log('\n🔐 LOGIN PAGE CHECKS\n');

  const html = await checkPage('/login');
  if (!html) {
    addIssue({
      severity: 'critical',
      category: 'Auth',
      description: 'Login page not loading',
    });
    return;
  }

  if (!html.includes('Google')) {
    addIssue({
      severity: 'critical',
      category: 'Auth',
      description: 'Google sign-in button not found',
      location: '/login',
    });
  }

  // Check for dev login in development
  if (!html.includes('Dev Login')) {
    addIssue({
      severity: 'low',
      category: 'Dev',
      description: 'Dev login button not visible (may be SSR issue)',
      location: '/login',
      suggestion: 'Check if isDev is being evaluated at build time',
    });
  }

  console.log('✅ Login page verified');
}

async function checkCoursesPage() {
  console.log('\n📚 COURSES PAGE CHECKS\n');

  const html = await checkPage('/courses');
  if (!html) {
    addIssue({
      severity: 'critical',
      category: 'Content',
      description: 'Courses page not loading',
    });
    return;
  }

  // Check for course categories
  const categories = ['Free', 'Mind', 'Body', 'Soul', 'Relationships'];
  let foundCategories = 0;
  for (const cat of categories) {
    if (html.includes(cat)) foundCategories++;
  }

  if (foundCategories < 3) {
    addIssue({
      severity: 'medium',
      category: 'Content',
      description: 'Not all course categories visible',
      location: '/courses',
    });
  }

  console.log('✅ Courses page verified');
}

async function checkChatPage() {
  console.log('\n💬 CHAT PAGE CHECKS\n');

  const html = await checkPage('/chat');
  if (!html) {
    addIssue({
      severity: 'high',
      category: 'Feature',
      description: 'Chat page not loading',
    });
    return;
  }

  // Check for AI companion elements
  if (!html.includes('AI Companion') && !html.includes('ChatInterface')) {
    addIssue({
      severity: 'medium',
      category: 'Feature',
      description: 'Chat interface may not be properly loaded',
      location: '/chat',
    });
  }

  console.log('✅ Chat page verified');
}

async function checkProfilePage() {
  console.log('\n👤 PROFILE PAGE CHECKS\n');

  const html = await checkPage('/profile');
  if (!html) {
    addIssue({
      severity: 'high',
      category: 'Feature',
      description: 'Profile page not loading',
    });
    return;
  }

  // Profile should have key sections (even if redirected)
  console.log('✅ Profile page loads (auth may redirect)');
}

async function checkAssessments() {
  console.log('\n📋 ASSESSMENT PAGES CHECKS\n');

  const assessments = [
    { path: '/archetypes', name: 'Archetype Quiz' },
    { path: '/attachment', name: 'Attachment Quiz' },
    { path: '/nervous-system-check', name: 'Nervous System Check' },
    { path: '/shadow-profile', name: 'Shadow Profile' },
  ];

  for (const assessment of assessments) {
    const html = await checkPage(assessment.path);
    if (!html) {
      addIssue({
        severity: 'high',
        category: 'Feature',
        description: `${assessment.name} not loading`,
        location: assessment.path,
      });
    }
  }

  console.log('✅ Assessment pages verified');
}

async function checkAPIEndpoints() {
  console.log('\n🔌 API ENDPOINT CHECKS\n');

  // Check courses API returns proper data
  try {
    const res = await fetch(`${BASE_URL}/api/courses`);
    const data = await res.json();
    const courses = Array.isArray(data) ? data : data.courses || [];

    if (courses.length === 0) {
      addIssue({
        severity: 'critical',
        category: 'API',
        description: 'Courses API returning empty',
        location: '/api/courses',
      });
    }

    // Check course structure
    if (courses.length > 0) {
      const course = courses[0];
      const requiredFields = ['id', 'title', 'category'];
      for (const field of requiredFields) {
        if (!course[field]) {
          addIssue({
            severity: 'medium',
            category: 'API',
            description: `Course missing field: ${field}`,
            location: '/api/courses',
          });
        }
      }
    }
  } catch (e) {
    addIssue({
      severity: 'critical',
      category: 'API',
      description: `Courses API error: ${e}`,
    });
  }

  // Check posts API
  try {
    const res = await fetch(`${BASE_URL}/api/posts`);
    const data = await res.json();
    const posts = Array.isArray(data) ? data : data.posts || [];

    if (posts.length === 0) {
      addIssue({
        severity: 'critical',
        category: 'API',
        description: 'Posts API returning empty',
        location: '/api/posts',
      });
    }
  } catch (e) {
    addIssue({
      severity: 'critical',
      category: 'API',
      description: `Posts API error: ${e}`,
    });
  }

  console.log('✅ API endpoints verified');
}

async function checkPerformanceIndicators() {
  console.log('\n⚡ PERFORMANCE INDICATORS\n');

  // Check homepage load time
  const start = Date.now();
  await checkPage('/');
  const loadTime = Date.now() - start;

  if (loadTime > 5000) {
    addIssue({
      severity: 'high',
      category: 'Performance',
      description: `Homepage slow: ${loadTime}ms`,
      suggestion: 'Consider optimizing images and reducing bundle size',
    });
  } else if (loadTime > 2000) {
    addIssue({
      severity: 'medium',
      category: 'Performance',
      description: `Homepage could be faster: ${loadTime}ms`,
    });
  } else {
    console.log(`✅ Homepage loads in ${loadTime}ms`);
  }

  // Check API response time
  const apiStart = Date.now();
  await fetch(`${BASE_URL}/api/courses`);
  const apiTime = Date.now() - apiStart;

  if (apiTime > 1000) {
    addIssue({
      severity: 'medium',
      category: 'Performance',
      description: `API slow: /api/courses took ${apiTime}ms`,
    });
  } else {
    console.log(`✅ API responds in ${apiTime}ms`);
  }
}

async function checkMobileNav() {
  console.log('\n📱 MOBILE NAVIGATION CHECKS\n');

  const html = await checkPage('/');
  if (!html) return;

  // Check for mobile nav component
  if (!html.includes('md:hidden') || !html.includes('MobileNav')) {
    addIssue({
      severity: 'low',
      category: 'Mobile',
      description: 'Mobile navigation may not be properly implemented',
      suggestion: 'Verify MobileNav component is rendering',
    });
  } else {
    console.log('✅ Mobile navigation present');
  }
}

async function checkTransparencyPages() {
  console.log('\n🔍 TRANSPARENCY PAGES CHECKS\n');

  const pages = [
    '/transparency',
    '/transparency/methodology',
    '/transparency/standards',
  ];

  for (const page of pages) {
    const html = await checkPage(page);
    if (!html) {
      addIssue({
        severity: 'low',
        category: 'Content',
        description: `Transparency page not loading: ${page}`,
      });
    }
  }

  console.log('✅ Transparency pages verified');
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 UI QUALITY SUMMARY');
  console.log('='.repeat(60) + '\n');

  const critical = issues.filter(i => i.severity === 'critical');
  const high = issues.filter(i => i.severity === 'high');
  const medium = issues.filter(i => i.severity === 'medium');
  const low = issues.filter(i => i.severity === 'low');

  console.log(`🔴 Critical: ${critical.length}`);
  console.log(`🟠 High: ${high.length}`);
  console.log(`🟡 Medium: ${medium.length}`);
  console.log(`🟢 Low: ${low.length}`);
  console.log(`📈 Total Issues: ${issues.length}`);

  if (issues.length === 0) {
    console.log('\n✨ No issues found! Platform looks good.');
  } else {
    if (critical.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES (fix immediately):');
      critical.forEach(i => console.log(`   - [${i.category}] ${i.description}`));
    }

    if (high.length > 0) {
      console.log('\n🟠 HIGH PRIORITY:');
      high.forEach(i => console.log(`   - [${i.category}] ${i.description}`));
    }

    if (medium.length > 0) {
      console.log('\n🟡 MEDIUM PRIORITY:');
      medium.forEach(i => console.log(`   - [${i.category}] ${i.description}`));
    }

    if (low.length > 0) {
      console.log('\n🟢 LOW PRIORITY (polish):');
      low.forEach(i => console.log(`   - [${i.category}] ${i.description}`));
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎨 INTEGRATED HUMAN - UI QUALITY TESTS');
  console.log('='.repeat(60));
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  // Check server
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    console.log('✅ Server is running\n');
  } catch {
    console.error('❌ Server is not running at', BASE_URL);
    process.exit(1);
  }

  await checkNavigation();
  await checkHomepageContent();
  await checkLoginPage();
  await checkCoursesPage();
  await checkChatPage();
  await checkProfilePage();
  await checkAssessments();
  await checkAPIEndpoints();
  await checkPerformanceIndicators();
  await checkMobileNav();
  await checkTransparencyPages();

  await printSummary();
}

main().catch(console.error);
