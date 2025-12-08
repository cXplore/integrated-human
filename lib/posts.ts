import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostMetadata {
  title: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  date: string;
  type?: 'article' | 'guide';
  series?: string;
  order?: number;
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
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        metadata: data as PostMetadata,
        content,
        readingTime: calculateReadingTime(content),
      };
    });

  return allPostsData.sort((a, b) => {
    if (a.metadata.date < b.metadata.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) =>
    post.metadata.categories.includes(category)
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
