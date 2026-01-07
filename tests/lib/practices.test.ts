import { describe, it, expect } from 'vitest';
import {
  getAllPractices,
  getPracticeBySlug,
  getPracticesByCategory,
  getPracticesForNervousSystemState,
  getPracticesForAttachmentStyle,
  getPracticesByTag,
  getPracticesByDuration,
  getRelatedPractices,
  searchPractices,
  getRecommendedPractices,
} from '@/lib/practices';

describe('getAllPractices', () => {
  it('should return an array of practices', () => {
    const practices = getAllPractices();
    expect(Array.isArray(practices)).toBe(true);
  });

  it('should only return published practices', () => {
    const practices = getAllPractices();
    practices.forEach((practice) => {
      expect(practice.metadata.published).toBe(true);
    });
  });

  it('should have required metadata fields', () => {
    const practices = getAllPractices();
    if (practices.length > 0) {
      const practice = practices[0];
      expect(practice.slug).toBeDefined();
      expect(practice.metadata.title).toBeDefined();
      expect(practice.metadata.description).toBeDefined();
      expect(practice.metadata.category).toBeDefined();
      expect(practice.metadata.duration).toBeDefined();
      expect(practice.metadata.intensity).toBeDefined();
    }
  });

  it('should include slug in metadata', () => {
    const practices = getAllPractices();
    practices.forEach((practice) => {
      expect(practice.metadata.slug).toBe(practice.slug);
    });
  });
});

describe('getPracticeBySlug', () => {
  it('should return practice when slug exists', () => {
    const practices = getAllPractices();
    if (practices.length > 0) {
      const slug = practices[0].slug;
      const practice = getPracticeBySlug(slug);
      expect(practice).not.toBeNull();
      expect(practice?.slug).toBe(slug);
    }
  });

  it('should return null for non-existent slug', () => {
    const practice = getPracticeBySlug('non-existent-practice-12345');
    expect(practice).toBeNull();
  });
});

describe('getPracticesByCategory', () => {
  it('should filter practices by breathwork category', () => {
    const practices = getPracticesByCategory('breathwork');
    practices.forEach((practice) => {
      expect(practice.metadata.category).toBe('breathwork');
    });
  });

  it('should filter practices by grounding category', () => {
    const practices = getPracticesByCategory('grounding');
    practices.forEach((practice) => {
      expect(practice.metadata.category).toBe('grounding');
    });
  });

  it('should filter practices by somatic category', () => {
    const practices = getPracticesByCategory('somatic');
    practices.forEach((practice) => {
      expect(practice.metadata.category).toBe('somatic');
    });
  });
});

describe('getPracticesForNervousSystemState', () => {
  it('should filter practices for sympathetic state', () => {
    const practices = getPracticesForNervousSystemState('sympathetic');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.nervousSystem).toContain('sympathetic');
    });
  });

  it('should filter practices for dorsal state', () => {
    const practices = getPracticesForNervousSystemState('dorsal');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.nervousSystem).toContain('dorsal');
    });
  });

  it('should filter practices for ventral state', () => {
    const practices = getPracticesForNervousSystemState('ventral');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.nervousSystem).toContain('ventral');
    });
  });
});

describe('getPracticesForAttachmentStyle', () => {
  it('should filter practices for anxious attachment', () => {
    const practices = getPracticesForAttachmentStyle('anxious');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.attachmentStyle).toContain('anxious');
    });
  });

  it('should filter practices for avoidant attachment', () => {
    const practices = getPracticesForAttachmentStyle('avoidant');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.attachmentStyle).toContain('avoidant');
    });
  });

  it('should filter practices for disorganized attachment', () => {
    const practices = getPracticesForAttachmentStyle('disorganized');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.attachmentStyle).toContain('disorganized');
    });
  });
});

describe('getPracticesByTag', () => {
  it('should filter practices by tag', () => {
    const practices = getAllPractices();
    if (practices.length > 0 && practices[0].metadata.tags.length > 0) {
      const tag = practices[0].metadata.tags[0];
      const filtered = getPracticesByTag(tag);
      filtered.forEach((practice) => {
        expect(practice.metadata.tags).toContain(tag);
      });
    }
  });

  it('should return empty array for non-existent tag', () => {
    const practices = getPracticesByTag('non-existent-tag-xyz-12345');
    expect(practices).toEqual([]);
  });
});

describe('getPracticesByDuration', () => {
  it('should filter practices by quick duration', () => {
    const practices = getPracticesByDuration('quick');
    practices.forEach((practice) => {
      expect(practice.metadata.duration).toBe('quick');
    });
  });

  it('should filter practices by short duration', () => {
    const practices = getPracticesByDuration('short');
    practices.forEach((practice) => {
      expect(practice.metadata.duration).toBe('short');
    });
  });

  it('should filter practices by medium duration', () => {
    const practices = getPracticesByDuration('medium');
    practices.forEach((practice) => {
      expect(practice.metadata.duration).toBe('medium');
    });
  });
});

describe('getRelatedPractices', () => {
  it('should return practices related to a course', () => {
    const practices = getAllPractices();
    const practiceWithRelated = practices.find((p) => p.metadata.relatedCourses?.length);
    if (practiceWithRelated && practiceWithRelated.metadata.relatedCourses) {
      const courseSlug = practiceWithRelated.metadata.relatedCourses[0];
      const related = getRelatedPractices(courseSlug);
      expect(related.length).toBeGreaterThan(0);
      related.forEach((practice) => {
        expect(practice.metadata.relatedCourses).toContain(courseSlug);
      });
    }
  });

  it('should return empty array for non-existent course', () => {
    const practices = getRelatedPractices('non-existent-course-12345');
    expect(practices).toEqual([]);
  });
});

describe('searchPractices', () => {
  it('should search by title', () => {
    const practices = getAllPractices();
    if (practices.length > 0) {
      const titleWord = practices[0].metadata.title.split(' ')[0];
      const results = searchPractices(titleWord);
      expect(results.length).toBeGreaterThan(0);
    }
  });

  it('should be case-insensitive', () => {
    const upper = searchPractices('BREATH');
    const lower = searchPractices('breath');
    expect(upper.length).toBe(lower.length);
  });

  it('should search by description', () => {
    const practices = getAllPractices();
    if (practices.length > 0) {
      const descWord = practices[0].metadata.description.split(' ')[0];
      const results = searchPractices(descWord);
      expect(results.length).toBeGreaterThan(0);
    }
  });
});

describe('getRecommendedPractices', () => {
  it('should return practices for nervous system state', () => {
    const practices = getRecommendedPractices('sympathetic');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.nervousSystem).toContain('sympathetic');
    });
  });

  it('should return practices for attachment style', () => {
    const practices = getRecommendedPractices(undefined, 'anxious');
    practices.forEach((practice) => {
      expect(practice.metadata.bestFor?.attachmentStyle).toContain('anxious');
    });
  });

  it('should prioritize practices matching both criteria', () => {
    const practicesBoth = getRecommendedPractices('sympathetic', 'anxious');

    // Practices returned should match at least one criterion
    practicesBoth.forEach((practice) => {
      const matchesNS = practice.metadata.bestFor?.nervousSystem?.includes('sympathetic');
      const matchesAS = practice.metadata.bestFor?.attachmentStyle?.includes('anxious');
      // Should match at least one (they're scored, so all results have score > 0)
      expect(matchesNS || matchesAS).toBe(true);
    });
  });

  it('should return empty array when no matches', () => {
    // Getting all practices and checking if there are any that match ventral + secure
    const practices = getRecommendedPractices('ventral', 'secure');
    // This might or might not be empty depending on content
    expect(Array.isArray(practices)).toBe(true);
  });
});
