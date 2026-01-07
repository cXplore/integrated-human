import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { CourseTier } from './subscriptions';

const coursesDirectory = path.join(process.cwd(), 'content/courses');

// Module-level cache for courses (persists across requests in the same Node.js process)
let coursesCache: Course[] | null = null;
let coursesCacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL in development, effectively permanent in production build

export interface CourseModule {
  id: number;
  slug: string;
  title: string;
  description: string;
  duration: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CourseQuiz {
  passingScore: number;
  questions: QuizQuestion[];
}

// Development Spectrum stages
export type SpectrumStage = 'collapse' | 'regulation' | 'integration' | 'embodiment' | 'optimization';

export interface CourseMetadata {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  duration: string;
  level: string;
  category: string;
  tier: CourseTier;
  tags?: string[];
  instructor?: string;
  modules: CourseModule[];
  whatYouLearn: string[];
  requirements: string[];
  quiz?: CourseQuiz;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Development Spectrum - which stage(s) is this course appropriate for
  spectrum?: SpectrumStage[];
}

export interface Course {
  slug: string;
  metadata: CourseMetadata;
}

export interface ModuleContent {
  slug: string;
  courseSlug: string;
  title: string;
  moduleNumber: number;
  description: string;
  duration: string;
  content: string;
  readingTime: number;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function getAllCourses(): Course[] {
  // Return cached courses if available and not expired
  const now = Date.now();
  if (coursesCache && (now - coursesCacheTime) < CACHE_TTL) {
    return coursesCache;
  }

  if (!fs.existsSync(coursesDirectory)) {
    return [];
  }

  const courseDirectories = fs.readdirSync(coursesDirectory, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const courses = courseDirectories
    .map((dirName) => {
      const coursePath = path.join(coursesDirectory, dirName, 'course.json');

      if (!fs.existsSync(coursePath)) {
        return null;
      }

      const fileContents = fs.readFileSync(coursePath, 'utf8');
      let metadata: CourseMetadata;
      try {
        metadata = JSON.parse(fileContents) as CourseMetadata;
      } catch (error) {
        console.error(`Failed to parse course.json for ${dirName}:`, error);
        return null;
      }

      if (!metadata.published) {
        return null;
      }

      // Auto-detect image if not specified in metadata
      if (!metadata.image) {
        const possibleImagePath = path.join(process.cwd(), 'public/images/courses', `${dirName}.jpg`);
        if (fs.existsSync(possibleImagePath)) {
          metadata.image = `/images/courses/${dirName}.jpg`;
        }
      }

      return {
        slug: dirName,
        metadata,
      };
    })
    .filter((course): course is Course => course !== null);

  // Sort by title alphabetically if no createdAt date
  const sortedCourses = courses.sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));

  // Update cache
  coursesCache = sortedCourses;
  coursesCacheTime = now;

  return sortedCourses;
}

export function getCourseBySlug(slug: string): Course | undefined {
  const courses = getAllCourses();
  return courses.find((course) => course.slug === slug);
}

export function getCoursesByCategory(category: string): Course[] {
  const allCourses = getAllCourses();
  return allCourses.filter((course) =>
    course.metadata.category.toLowerCase() === category.toLowerCase()
  );
}

export function getModuleContent(courseSlug: string, moduleSlug: string): ModuleContent | undefined {
  const courseDir = path.join(coursesDirectory, courseSlug);

  if (!fs.existsSync(courseDir)) {
    return undefined;
  }

  // Find the module file
  const files = fs.readdirSync(courseDir)
    .filter(file => file.endsWith('.mdx'));

  for (const file of files) {
    const fullPath = path.join(courseDir, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Check if this module's slug matches (derive slug from title or use explicit slug)
    const derivedSlug = data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';

    // Also check filename pattern like 01-what-is-shadow.mdx
    const fileSlug = file.replace(/^\d+-/, '').replace('.mdx', '');

    if (fileSlug === moduleSlug || derivedSlug === moduleSlug) {
      return {
        slug: moduleSlug,
        courseSlug,
        title: data.title,
        moduleNumber: data.moduleNumber,
        description: data.description,
        duration: data.duration,
        content,
        readingTime: calculateReadingTime(content),
      };
    }
  }

  return undefined;
}

export function getAllModulesForCourse(courseSlug: string): ModuleContent[] {
  const courseDir = path.join(coursesDirectory, courseSlug);

  if (!fs.existsSync(courseDir)) {
    return [];
  }

  const files = fs.readdirSync(courseDir)
    .filter(file => file.endsWith('.mdx'))
    .sort(); // Sort to ensure order

  return files.map((file) => {
    const fullPath = path.join(courseDir, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const fileSlug = file.replace(/^\d+-/, '').replace('.mdx', '');

    return {
      slug: fileSlug,
      courseSlug,
      title: data.title,
      moduleNumber: data.moduleNumber,
      description: data.description,
      duration: data.duration,
      content,
      readingTime: calculateReadingTime(content),
    };
  }).sort((a, b) => a.moduleNumber - b.moduleNumber);
}

export function getModuleNavigation(courseSlug: string, currentModuleNumber: number): {
  prev: ModuleContent | null;
  next: ModuleContent | null;
  current: ModuleContent | null;
  total: number;
} {
  const modules = getAllModulesForCourse(courseSlug);
  const currentIndex = modules.findIndex(m => m.moduleNumber === currentModuleNumber);

  if (currentIndex === -1) {
    return { prev: null, next: null, current: null, total: modules.length };
  }

  return {
    prev: currentIndex > 0 ? modules[currentIndex - 1] : null,
    next: currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null,
    current: modules[currentIndex],
    total: modules.length,
  };
}

/**
 * Get courses filtered by Development Spectrum stage
 */
export function getCoursesBySpectrum(stage: SpectrumStage): Course[] {
  const allCourses = getAllCourses();
  return allCourses.filter((course) =>
    course.metadata.spectrum?.includes(stage)
  );
}

/**
 * Get courses matching any of the given spectrum stages
 */
export function getCoursesBySpectrumStages(stages: SpectrumStage[]): Course[] {
  const allCourses = getAllCourses();
  return allCourses.filter((course) =>
    course.metadata.spectrum?.some((s) => stages.includes(s))
  );
}

/**
 * Find courses related to a given set of categories and tags.
 * Used to show related courses on article pages.
 */
export function getRelatedCourses(
  categories: string[],
  tags: string[],
  limit: number = 3
): Course[] {
  const allCourses = getAllCourses();

  const scoredCourses = allCourses.map((course) => {
    let score = 0;

    // Category match (case-insensitive)
    const courseCategory = course.metadata.category.toLowerCase();
    categories.forEach((cat) => {
      if (courseCategory === cat.toLowerCase()) score += 3;
    });

    // Tag match
    const courseTags = (course.metadata.tags || []).map((t) => t.toLowerCase());
    tags.forEach((tag) => {
      const tagLower = tag.toLowerCase();
      if (courseTags.some((ct) => ct.includes(tagLower) || tagLower.includes(ct))) {
        score += 2;
      }
    });

    return { course, score };
  });

  return scoredCourses
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ course }) => course);
}
