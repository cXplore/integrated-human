import { describe, it, expect } from 'vitest';
import {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getGuidesByCategory,
  getArticlesByCategory,
  getPostsBySeries,
  getSeriesNavigation,
  getRelatedPosts,
  searchPosts,
  getAllTags,
  getPostsByTag,
  getRelatedPostsForCourse,
} from '@/lib/posts';

describe('getAllPosts', () => {
  it('should return an array of posts', () => {
    const posts = getAllPosts();
    expect(Array.isArray(posts)).toBe(true);
  });

  it('should have required metadata fields', () => {
    const posts = getAllPosts();
    if (posts.length > 0) {
      const post = posts[0];
      expect(post.slug).toBeDefined();
      expect(post.metadata.title).toBeDefined();
      expect(post.metadata.date).toBeDefined();
      expect(post.content).toBeDefined();
      expect(post.readingTime).toBeGreaterThan(0);
    }
  });

  it('should return posts with valid dates', () => {
    const posts = getAllPosts();
    posts.forEach((post) => {
      expect(post.metadata.date).toBeDefined();
      // Date should be parseable
      const date = new Date(post.metadata.date);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  it('should calculate reading time', () => {
    const posts = getAllPosts();
    posts.forEach((post) => {
      expect(typeof post.readingTime).toBe('number');
      expect(post.readingTime).toBeGreaterThan(0);
    });
  });
});

describe('getPostBySlug', () => {
  it('should return post when slug exists', () => {
    const posts = getAllPosts();
    if (posts.length > 0) {
      const slug = posts[0].slug;
      const post = getPostBySlug(slug);
      expect(post).toBeDefined();
      expect(post?.slug).toBe(slug);
    }
  });

  it('should return undefined for non-existent slug', () => {
    const post = getPostBySlug('this-post-does-not-exist-12345');
    expect(post).toBeUndefined();
  });
});

describe('getPostsByCategory', () => {
  it('should filter posts by Mind category', () => {
    const mindPosts = getPostsByCategory('Mind');
    mindPosts.forEach((post) => {
      expect(post.metadata.categories).toContain('Mind');
    });
  });

  it('should filter posts by Body category', () => {
    const bodyPosts = getPostsByCategory('Body');
    bodyPosts.forEach((post) => {
      expect(post.metadata.categories).toContain('Body');
    });
  });
});

describe('getGuidesByCategory and getArticlesByCategory', () => {
  it('should return only guides', () => {
    const guides = getGuidesByCategory('Mind');
    guides.forEach((guide) => {
      expect(guide.metadata.type).toBe('guide');
    });
  });

  it('should return only articles', () => {
    const articles = getArticlesByCategory('Mind');
    articles.forEach((article) => {
      expect(article.metadata.type).not.toBe('guide');
    });
  });

  it('should sort guides by order', () => {
    const guides = getGuidesByCategory('Mind');
    if (guides.length > 1) {
      for (let i = 1; i < guides.length; i++) {
        const prevOrder = guides[i - 1].metadata.order || 0;
        const currOrder = guides[i].metadata.order || 0;
        expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
      }
    }
  });
});

describe('getPostsBySeries', () => {
  it('should return posts in the same series', () => {
    const posts = getAllPosts();
    const seriesPost = posts.find((p) => p.metadata.series);
    if (seriesPost && seriesPost.metadata.series) {
      const seriesPosts = getPostsBySeries(seriesPost.metadata.series);
      seriesPosts.forEach((post) => {
        expect(post.metadata.series).toBe(seriesPost.metadata.series);
      });
    }
  });

  it('should return empty array for non-existent series', () => {
    const posts = getPostsBySeries('non-existent-series-12345');
    expect(posts).toEqual([]);
  });
});

describe('getSeriesNavigation', () => {
  it('should return navigation info for series post', () => {
    const posts = getAllPosts();
    const seriesPost = posts.find((p) => p.metadata.series);
    if (seriesPost) {
      const nav = getSeriesNavigation(seriesPost.slug);
      expect(nav.series).toBe(seriesPost.metadata.series);
      expect(nav.total).toBeGreaterThan(0);
    }
  });

  it('should return nulls for non-series post', () => {
    const posts = getAllPosts();
    const nonSeriesPost = posts.find((p) => !p.metadata.series);
    if (nonSeriesPost) {
      const nav = getSeriesNavigation(nonSeriesPost.slug);
      expect(nav.series).toBeNull();
      expect(nav.total).toBe(0);
    }
  });
});

describe('getRelatedPosts', () => {
  it('should return related posts excluding current', () => {
    const posts = getAllPosts();
    if (posts.length > 0) {
      const current = posts[0];
      const related = getRelatedPosts(current.slug, 3);
      related.forEach((post) => {
        expect(post.slug).not.toBe(current.slug);
      });
    }
  });

  it('should respect the limit parameter', () => {
    const posts = getAllPosts();
    if (posts.length > 0) {
      const related = getRelatedPosts(posts[0].slug, 2);
      expect(related.length).toBeLessThanOrEqual(2);
    }
  });
});

describe('searchPosts', () => {
  it('should return matching posts for valid query', () => {
    const results = searchPosts('anxiety');
    results.forEach((post) => {
      const searchText = [
        post.metadata.title,
        post.metadata.excerpt,
        post.content,
        ...post.metadata.categories,
        ...post.metadata.tags,
      ].join(' ').toLowerCase();
      expect(searchText).toContain('anxiety');
    });
  });

  it('should return empty array for empty query', () => {
    const results = searchPosts('');
    expect(results).toEqual([]);
  });

  it('should return empty array for whitespace query', () => {
    const results = searchPosts('   ');
    expect(results).toEqual([]);
  });
});

describe('getAllTags', () => {
  it('should return tags with counts', () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    tags.forEach((tag) => {
      expect(tag.tag).toBeDefined();
      expect(tag.count).toBeGreaterThan(0);
    });
  });

  it('should be sorted by count descending', () => {
    const tags = getAllTags();
    if (tags.length > 1) {
      for (let i = 1; i < tags.length; i++) {
        expect(tags[i].count).toBeLessThanOrEqual(tags[i - 1].count);
      }
    }
  });
});

describe('getPostsByTag', () => {
  it('should filter posts by tag', () => {
    const tags = getAllTags();
    if (tags.length > 0) {
      const tag = tags[0].tag;
      const posts = getPostsByTag(tag);
      posts.forEach((post) => {
        expect(post.metadata.tags).toContain(tag);
      });
    }
  });

  it('should return empty array for non-existent tag', () => {
    const posts = getPostsByTag('non-existent-tag-xyz-12345');
    expect(posts).toEqual([]);
  });
});

describe('getRelatedPostsForCourse', () => {
  it('should return posts matching category', () => {
    const related = getRelatedPostsForCourse('Mind', ['anxiety'], 5);
    expect(Array.isArray(related)).toBe(true);
  });

  it('should respect the limit parameter', () => {
    const related = getRelatedPostsForCourse('Mind', [], 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });
});
