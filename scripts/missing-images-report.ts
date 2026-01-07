/**
 * Missing Images Report
 *
 * Generates a report of all content missing images with suggested prompts.
 * Run: npx tsx scripts/missing-images-report.ts
 */

import fs from 'fs';
import path from 'path';

// Support running from any directory by using __dirname
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename.startsWith('/') && process.platform === 'win32' ? __filename.slice(1) : __filename);
const BASE_DIR = path.resolve(__dirname, '..');
const COURSES_DIR = path.join(BASE_DIR, 'content/courses');
const COURSE_IMAGES_DIR = path.join(BASE_DIR, 'public/images/courses');

interface CourseInfo {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
}

function getCourseInfo(slug: string): CourseInfo | null {
  const courseJsonPath = path.join(COURSES_DIR, slug, 'course.json');
  if (!fs.existsSync(courseJsonPath)) return null;

  try {
    const content = JSON.parse(fs.readFileSync(courseJsonPath, 'utf-8'));
    return {
      slug,
      title: content.title,
      subtitle: content.subtitle,
      description: content.description,
      category: content.category,
    };
  } catch {
    return null;
  }
}

function getMissingCourseImages(): CourseInfo[] {
  const courses = fs.readdirSync(COURSES_DIR).filter(f => {
    const stat = fs.statSync(path.join(COURSES_DIR, f));
    return stat.isDirectory();
  });

  const images = fs.readdirSync(COURSE_IMAGES_DIR).map(f => path.parse(f).name);

  const missing: CourseInfo[] = [];

  for (const course of courses) {
    if (!images.includes(course)) {
      const info = getCourseInfo(course);
      if (info) missing.push(info);
    }
  }

  return missing;
}

function generateImagePrompt(course: CourseInfo): string {
  // Generate a prompt suitable for AI image generation
  const themes: Record<string, string> = {
    'Mind': 'ethereal light, neural networks, calm meditation, abstract thoughts',
    'Body': 'organic forms, flowing energy, embodied presence, natural elements',
    'Soul': 'cosmic, transcendent, mystical light, spiritual symbols',
    'Relationships': 'connected silhouettes, warm tones, intertwined forms',
    'Flagship': 'comprehensive, integrated, transformational journey',
  };

  const themeHint = themes[course.category] || 'psychological depth, transformation';

  return `Create a cinematic, moody, dark-toned artistic image representing "${course.title}" - ${course.subtitle || course.description.slice(0, 100)}. Style: ${themeHint}. Dark background with subtle glowing elements, abstract, no text, suitable for a course thumbnail. 1200x800 pixels.`;
}

// Main execution
console.log('='.repeat(80));
console.log('MISSING COURSE IMAGES REPORT');
console.log('='.repeat(80));
console.log();

const missingCourses = getMissingCourseImages();

console.log(`Total courses: ${fs.readdirSync(COURSES_DIR).filter(f => fs.statSync(path.join(COURSES_DIR, f)).isDirectory()).length}`);
console.log(`Courses with images: ${fs.readdirSync(COURSE_IMAGES_DIR).length}`);
console.log(`Missing images: ${missingCourses.length}`);
console.log();

if (missingCourses.length === 0) {
  console.log('All courses have images!');
} else {
  console.log('MISSING IMAGES:');
  console.log('-'.repeat(80));

  for (const course of missingCourses) {
    console.log();
    console.log(`COURSE: ${course.title}`);
    console.log(`Slug: ${course.slug}`);
    console.log(`Category: ${course.category}`);
    console.log(`File needed: public/images/courses/${course.slug}.jpg`);
    console.log();
    console.log('SUGGESTED PROMPT:');
    console.log(generateImagePrompt(course));
    console.log();
    console.log('-'.repeat(80));
  }
}

// Generate JSON output for programmatic use
const jsonOutput = {
  generatedAt: new Date().toISOString(),
  totalCourses: fs.readdirSync(COURSES_DIR).filter(f => fs.statSync(path.join(COURSES_DIR, f)).isDirectory()).length,
  totalImages: fs.readdirSync(COURSE_IMAGES_DIR).length,
  missingImages: missingCourses.map(c => ({
    slug: c.slug,
    title: c.title,
    filePath: `public/images/courses/${c.slug}.jpg`,
    prompt: generateImagePrompt(c),
  })),
};

const outputPath = path.join(BASE_DIR, 'scripts/missing-images.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
console.log();
console.log(`JSON report saved to: ${outputPath}`);
