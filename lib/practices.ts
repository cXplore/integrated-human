import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const practicesDirectory = path.join(process.cwd(), 'content/practices');

// Module-level cache for practices (persists across requests in the same Node.js process)
let practicesCache: Practice[] | null = null;
let practicesCacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL in development

export type PracticeCategory =
  | 'breathwork'
  | 'grounding'
  | 'meditation'
  | 'somatic'
  | 'shadow-work'
  | 'emotional-release'
  | 'journaling'
  | 'movement';

export type PracticeDuration = 'quick' | 'short' | 'medium' | 'long';
// quick: 1-3 min, short: 5-10 min, medium: 15-20 min, long: 30+ min

export type PracticeIntensity = 'gentle' | 'moderate' | 'activating' | 'intense';

export interface PracticeMetadata {
  slug: string;
  title: string;
  description: string;
  category: PracticeCategory;
  duration: PracticeDuration;
  durationMinutes: number;
  intensity: PracticeIntensity;
  tags: string[];
  // What this practice helps with
  helpssWith: string[];
  // Related content (courses, articles)
  relatedCourses?: string[];
  relatedArticles?: string[];
  // For nervous system / emotional state
  bestFor?: {
    nervousSystem?: ('ventral' | 'sympathetic' | 'dorsal')[];
    attachmentStyle?: ('anxious' | 'avoidant' | 'disorganized' | 'secure')[];
    emotions?: string[];
  };
  // Audio/video if available
  audioUrl?: string;
  videoUrl?: string;
  published: boolean;
}

export interface Practice {
  slug: string;
  metadata: PracticeMetadata;
  content: string;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 150; // Slower for practice instructions
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function getAllPractices(): Practice[] {
  // Return cached practices if available and not expired
  const now = Date.now();
  if (practicesCache && (now - practicesCacheTime) < CACHE_TTL) {
    return practicesCache;
  }

  if (!fs.existsSync(practicesDirectory)) {
    return [];
  }

  const files = fs.readdirSync(practicesDirectory).filter(f => f.endsWith('.mdx'));

  const practices = files
    .map((filename) => {
      const filePath = path.join(practicesDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      const metadata = data as PracticeMetadata;
      const slug = filename.replace(/\.mdx$/, '');

      if (!metadata.published) {
        return null;
      }

      return {
        slug,
        metadata: { ...metadata, slug },
        content,
      };
    })
    .filter((p): p is Practice => p !== null);

  // Update cache
  practicesCache = practices;
  practicesCacheTime = now;

  return practices;
}

export function getPracticeBySlug(slug: string): Practice | null {
  // Use cache if available
  const practices = getAllPractices();
  return practices.find(p => p.slug === slug) || null;
}

export function getPracticesByCategory(category: PracticeCategory): Practice[] {
  return getAllPractices().filter(p => p.metadata.category === category);
}

export function getPracticesForNervousSystemState(
  state: 'ventral' | 'sympathetic' | 'dorsal'
): Practice[] {
  return getAllPractices().filter(
    p => p.metadata.bestFor?.nervousSystem?.includes(state)
  );
}

export function getPracticesForAttachmentStyle(
  style: 'anxious' | 'avoidant' | 'disorganized' | 'secure'
): Practice[] {
  return getAllPractices().filter(
    p => p.metadata.bestFor?.attachmentStyle?.includes(style)
  );
}

export function getPracticesByTag(tag: string): Practice[] {
  return getAllPractices().filter(p => p.metadata.tags.includes(tag));
}

export function getPracticesByDuration(duration: PracticeDuration): Practice[] {
  return getAllPractices().filter(p => p.metadata.duration === duration);
}

export function getRelatedPractices(courseSlug: string): Practice[] {
  return getAllPractices().filter(
    p => p.metadata.relatedCourses?.includes(courseSlug)
  );
}

export function searchPractices(query: string): Practice[] {
  const lowerQuery = query.toLowerCase();
  return getAllPractices().filter(p => {
    const searchText = [
      p.metadata.title,
      p.metadata.description,
      ...p.metadata.tags,
      ...p.metadata.helpssWith,
    ].join(' ').toLowerCase();

    return searchText.includes(lowerQuery);
  });
}

// Get recommended practices based on user's assessment results
export function getRecommendedPractices(
  nervousSystemState?: 'ventral' | 'sympathetic' | 'dorsal',
  attachmentStyle?: 'anxious' | 'avoidant' | 'disorganized' | 'secure'
): Practice[] {
  const all = getAllPractices();

  // Score each practice based on relevance
  const scored = all.map(practice => {
    let score = 0;

    // Nervous system match
    if (nervousSystemState && practice.metadata.bestFor?.nervousSystem?.includes(nervousSystemState)) {
      score += 3;
    }

    // Attachment style match
    if (attachmentStyle && practice.metadata.bestFor?.attachmentStyle?.includes(attachmentStyle)) {
      score += 2;
    }

    return { practice, score };
  });

  // Return practices with score > 0, sorted by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.practice);
}
