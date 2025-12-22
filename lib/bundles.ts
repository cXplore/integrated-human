import fs from 'fs';
import path from 'path';
import { getAllCourses, Course } from './courses';

export interface Bundle {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  courses: string[]; // course slugs
  originalPrice: number;
  bundlePrice: number;
  savings: number;
  featured: boolean;
  category: string;
}

export interface BundleWithCourses extends Bundle {
  courseDetails: Course[];
}

const bundlesPath = path.join(process.cwd(), 'content/bundles.json');

export function getAllBundles(): Bundle[] {
  if (!fs.existsSync(bundlesPath)) {
    return [];
  }

  try {
    const fileContents = fs.readFileSync(bundlesPath, 'utf8');
    return JSON.parse(fileContents) as Bundle[];
  } catch (error) {
    console.error('Failed to parse bundles.json:', error);
    return [];
  }
}

export function getBundleById(id: string): Bundle | undefined {
  const bundles = getAllBundles();
  return bundles.find((bundle) => bundle.id === id);
}

export function getBundleWithCourses(id: string): BundleWithCourses | undefined {
  const bundle = getBundleById(id);
  if (!bundle) return undefined;

  const allCourses = getAllCourses();
  const courseDetails = bundle.courses
    .map((slug) => allCourses.find((c) => c.slug === slug))
    .filter((c): c is Course => c !== undefined);

  return {
    ...bundle,
    courseDetails,
  };
}

export function getAllBundlesWithCourses(): BundleWithCourses[] {
  const bundles = getAllBundles();
  const allCourses = getAllCourses();

  return bundles.map((bundle) => {
    const courseDetails = bundle.courses
      .map((slug) => allCourses.find((c) => c.slug === slug))
      .filter((c): c is Course => c !== undefined);

    return {
      ...bundle,
      courseDetails,
    };
  });
}

export function getFeaturedBundles(): BundleWithCourses[] {
  return getAllBundlesWithCourses().filter((b) => b.featured);
}

export function getBundlesByCategory(category: string): BundleWithCourses[] {
  return getAllBundlesWithCourses().filter(
    (b) => b.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Check if a course is part of any bundle
 */
export function getBundlesContainingCourse(courseSlug: string): Bundle[] {
  const bundles = getAllBundles();
  return bundles.filter((bundle) => bundle.courses.includes(courseSlug));
}
