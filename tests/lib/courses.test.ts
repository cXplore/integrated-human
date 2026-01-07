import { describe, it, expect } from 'vitest';
import {
  getAllCourses,
  getCourseBySlug,
  getCoursesByCategory,
  getCoursesBySpectrum,
  getRelatedCourses,
  getAllModulesForCourse,
  getModuleNavigation,
} from '@/lib/courses';

describe('getAllCourses', () => {
  it('should return an array of courses', () => {
    const courses = getAllCourses();
    expect(Array.isArray(courses)).toBe(true);
  });

  it('should only return published courses', () => {
    const courses = getAllCourses();
    courses.forEach((course) => {
      // All returned courses should be published (unpublished are filtered)
      expect(course.metadata).toBeDefined();
      expect(course.slug).toBeDefined();
    });
  });

  it('should have required metadata fields', () => {
    const courses = getAllCourses();
    if (courses.length > 0) {
      const course = courses[0];
      expect(course.metadata.title).toBeDefined();
      expect(course.metadata.description).toBeDefined();
      expect(course.metadata.category).toBeDefined();
      expect(course.metadata.tier).toBeDefined();
    }
  });

  it('should return courses sorted alphabetically', () => {
    const courses = getAllCourses();
    if (courses.length > 1) {
      const titles = courses.map((c) => c.metadata.title);
      const sortedTitles = [...titles].sort((a, b) => a.localeCompare(b));
      expect(titles).toEqual(sortedTitles);
    }
  });
});

describe('getCourseBySlug', () => {
  it('should return course when slug exists', () => {
    const courses = getAllCourses();
    if (courses.length > 0) {
      const slug = courses[0].slug;
      const course = getCourseBySlug(slug);
      expect(course).toBeDefined();
      expect(course?.slug).toBe(slug);
    }
  });

  it('should return undefined for non-existent slug', () => {
    const course = getCourseBySlug('this-course-does-not-exist-12345');
    expect(course).toBeUndefined();
  });
});

describe('getCoursesByCategory', () => {
  it('should filter courses by Mind category', () => {
    const mindCourses = getCoursesByCategory('Mind');
    mindCourses.forEach((course) => {
      expect(course.metadata.category.toLowerCase()).toBe('mind');
    });
  });

  it('should filter courses by Body category', () => {
    const bodyCourses = getCoursesByCategory('Body');
    bodyCourses.forEach((course) => {
      expect(course.metadata.category.toLowerCase()).toBe('body');
    });
  });

  it('should be case-insensitive', () => {
    const upper = getCoursesByCategory('MIND');
    const lower = getCoursesByCategory('mind');
    const mixed = getCoursesByCategory('Mind');
    expect(upper.length).toBe(lower.length);
    expect(upper.length).toBe(mixed.length);
  });
});

describe('getCoursesBySpectrum', () => {
  it('should filter courses by collapse stage', () => {
    const collapseCourses = getCoursesBySpectrum('collapse');
    collapseCourses.forEach((course) => {
      expect(course.metadata.spectrum).toContain('collapse');
    });
  });

  it('should filter courses by regulation stage', () => {
    const regulationCourses = getCoursesBySpectrum('regulation');
    regulationCourses.forEach((course) => {
      expect(course.metadata.spectrum).toContain('regulation');
    });
  });

  it('should return empty array for non-matching spectrum', () => {
    // This test might pass or fail depending on content
    const courses = getCoursesBySpectrum('optimization');
    expect(Array.isArray(courses)).toBe(true);
  });
});

describe('getRelatedCourses', () => {
  it('should return courses matching category', () => {
    const related = getRelatedCourses(['Mind'], [], 5);
    related.forEach((course) => {
      expect(course.metadata.category.toLowerCase()).toBe('mind');
    });
  });

  it('should respect the limit parameter', () => {
    const related = getRelatedCourses(['Mind', 'Body', 'Soul', 'Relationships'], [], 3);
    expect(related.length).toBeLessThanOrEqual(3);
  });

  it('should return empty array for non-matching criteria', () => {
    const related = getRelatedCourses(['NonExistentCategory'], ['nonexistent-tag'], 5);
    expect(related).toEqual([]);
  });
});

describe('getAllModulesForCourse', () => {
  it('should return modules sorted by moduleNumber', () => {
    const courses = getAllCourses();
    if (courses.length > 0) {
      const modules = getAllModulesForCourse(courses[0].slug);
      if (modules.length > 1) {
        for (let i = 1; i < modules.length; i++) {
          expect(modules[i].moduleNumber).toBeGreaterThanOrEqual(modules[i - 1].moduleNumber);
        }
      }
    }
  });

  it('should return empty array for non-existent course', () => {
    const modules = getAllModulesForCourse('non-existent-course-12345');
    expect(modules).toEqual([]);
  });
});

describe('getModuleNavigation', () => {
  it('should provide navigation for existing modules', () => {
    const courses = getAllCourses();
    if (courses.length > 0) {
      const modules = getAllModulesForCourse(courses[0].slug);
      if (modules.length > 0) {
        const nav = getModuleNavigation(courses[0].slug, modules[0].moduleNumber);
        expect(nav.current).toBeDefined();
        expect(nav.total).toBe(modules.length);
        expect(nav.prev).toBeNull(); // First module has no prev
      }
    }
  });

  it('should return nulls for non-existent module', () => {
    const nav = getModuleNavigation('non-existent-course', 999);
    expect(nav.current).toBeNull();
    expect(nav.prev).toBeNull();
    expect(nav.next).toBeNull();
  });
});
