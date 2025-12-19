import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const coursesDirectory = path.join(process.cwd(), 'content/courses');

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
  tags?: string[];
  instructor?: string;
  modules: CourseModule[];
  whatYouLearn: string[];
  requirements: string[];
  quiz?: CourseQuiz;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
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
      const metadata = JSON.parse(fileContents) as CourseMetadata;

      if (!metadata.published) {
        return null;
      }

      return {
        slug: dirName,
        metadata,
      };
    })
    .filter((course): course is Course => course !== null);

  // Sort by title alphabetically if no createdAt date
  return courses.sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));
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
