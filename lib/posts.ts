import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/posts');

// Module-level cache for posts (persists across requests in the same Node.js process)
let postsCache: Post[] | null = null;
let postsCacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL in development

export interface PostMetadata {
  title: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  date: string;
  type?: 'article' | 'guide';
  series?: string;
  order?: number;
  image?: string;
}

export interface Post {
  slug: string;
  metadata: PostMetadata;
  content: string;
  readingTime: number;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function getAllPosts(): Post[] {
  // Return cached posts if available and not expired
  const now = Date.now();
  if (postsCache && (now - postsCacheTime) < CACHE_TTL) {
    return postsCache;
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      // Normalize frontmatter - handle different field names
      const rawData = data as Record<string, unknown>;

      // Handle excerpt vs description
      const excerpt = (rawData.excerpt || rawData.description || '') as string;

      // Handle categories vs category vs pillar
      let categories: string[] = [];
      if (Array.isArray(rawData.categories)) {
        categories = rawData.categories as string[];
      } else if (typeof rawData.category === 'string') {
        // Convert single category to capitalized array entry
        const cat = rawData.category as string;
        categories = [cat.charAt(0).toUpperCase() + cat.slice(1)];
      } else if (typeof rawData.pillar === 'string') {
        // Convert pillar to category
        const pillar = rawData.pillar as string;
        categories = [pillar.charAt(0).toUpperCase() + pillar.slice(1)];
      }

      // Handle tags
      const tags = Array.isArray(rawData.tags) ? rawData.tags as string[] : [];

      // Handle image - check if frontmatter has it, otherwise check if file exists
      let image = rawData.image as string | undefined;
      if (!image) {
        // Check if an image file exists for this post
        const possibleImagePath = path.join(process.cwd(), 'public/images/posts', `${slug}.jpg`);
        if (fs.existsSync(possibleImagePath)) {
          image = `/images/posts/${slug}.jpg`;
        }
      }

      const metadata: PostMetadata = {
        title: (rawData.title || slug) as string,
        excerpt,
        categories,
        tags,
        date: (rawData.date || new Date().toISOString()) as string,
        type: rawData.type as 'article' | 'guide' | undefined,
        series: rawData.series as string | undefined,
        order: rawData.order as number | undefined,
        image,
      };

      return {
        slug,
        metadata,
        content,
        readingTime: calculateReadingTime(content),
      };
    });

  const sortedPosts = allPostsData.sort((a, b) => {
    if (a.metadata.date < b.metadata.date) {
      return 1;
    } else {
      return -1;
    }
  });

  // Update cache
  postsCache = sortedPosts;
  postsCacheTime = now;

  return sortedPosts;
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) =>
    post.metadata.categories?.includes(category)
  );
}

export function getGuidesByCategory(category: string): Post[] {
  const posts = getPostsByCategory(category);
  return posts
    .filter((post) => post.metadata.type === 'guide')
    .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0));
}

export function getArticlesByCategory(category: string): Post[] {
  const posts = getPostsByCategory(category);
  return posts.filter((post) => post.metadata.type !== 'guide');
}

export function getPostsBySeries(series: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts
    .filter((post) => post.metadata.series === series)
    .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0));
}

export function getSeriesNavigation(currentSlug: string): { prev: Post | null; next: Post | null; series: string | null; total: number } {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost?.metadata.series) {
    return { prev: null, next: null, series: null, total: 0 };
  }

  const seriesPosts = getPostsBySeries(currentPost.metadata.series);
  const currentIndex = seriesPosts.findIndex(p => p.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
    next: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null,
    series: currentPost.metadata.series,
    total: seriesPosts.length,
  };
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): Post[] {
  const allPosts = getAllPosts();
  const currentPost = allPosts.find((post) => post.slug === currentSlug);

  if (!currentPost) return [];

  const currentCategories = currentPost.metadata.categories;
  const currentTags = currentPost.metadata.tags;

  // Score posts by shared categories and tags
  const scoredPosts = allPosts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => {
      let score = 0;

      // +2 points for each shared category
      post.metadata.categories.forEach((cat) => {
        if (currentCategories.includes(cat)) score += 2;
      });

      // +1 point for each shared tag
      post.metadata.tags.forEach((tag) => {
        if (currentTags.includes(tag)) score += 1;
      });

      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);

  return scoredPosts;
}

export function getAllTags(): { tag: string; count: number }[] {
  const allPosts = getAllPosts();
  const tagCounts: Record<string, number> = {};

  allPosts.forEach((post) => {
    post.metadata.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByTag(tag: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.metadata.tags.includes(tag));
}

export function getTagsByCategory(category: string): string[] {
  const posts = getArticlesByCategory(category);
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    post.metadata.tags.forEach((tag) => {
      tagSet.add(tag);
    });
  });

  return Array.from(tagSet).sort();
}

export function getSeriesPostsMinimal(series: string): { slug: string; title: string; order: number }[] {
  const posts = getPostsBySeries(series);
  return posts.map((post) => ({
    slug: post.slug,
    title: post.metadata.title,
    order: post.metadata.order || 0,
  }));
}

export function searchPosts(query: string): Post[] {
  const allPosts = getAllPosts();
  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  if (searchTerms.length === 0 || searchTerms[0] === '') {
    return [];
  }

  const scoredPosts = allPosts.map((post) => {
    let score = 0;
    const title = post.metadata.title.toLowerCase();
    const excerpt = post.metadata.excerpt.toLowerCase();
    const content = post.content.toLowerCase();
    const categories = post.metadata.categories.map(c => c.toLowerCase());
    const tags = post.metadata.tags.map(t => t.toLowerCase());

    searchTerms.forEach((term) => {
      // Title match (highest priority)
      if (title.includes(term)) score += 10;

      // Category match
      if (categories.some(c => c.includes(term))) score += 8;

      // Tag match
      if (tags.some(t => t.includes(term))) score += 6;

      // Excerpt match
      if (excerpt.includes(term)) score += 4;

      // Content match
      if (content.includes(term)) score += 2;
    });

    return { post, score };
  });

  return scoredPosts
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ post }) => post);
}

/**
 * Find posts related to a given category and tags.
 * Used to show related articles on course pages.
 */
export function getRelatedPostsForCourse(
  category: string,
  tags: string[],
  limit: number = 3
): Post[] {
  const allPosts = getAllPosts();

  const scoredPosts = allPosts.map((post) => {
    let score = 0;

    // Category match
    const postCategories = post.metadata.categories.map((c) => c.toLowerCase());
    if (postCategories.includes(category.toLowerCase())) {
      score += 3;
    }

    // Tag match
    const postTags = post.metadata.tags.map((t) => t.toLowerCase());
    tags.forEach((tag) => {
      const tagLower = tag.toLowerCase();
      if (postTags.some((pt) => pt.includes(tagLower) || tagLower.includes(pt))) {
        score += 2;
      }
    });

    return { post, score };
  });

  return scoredPosts
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}
