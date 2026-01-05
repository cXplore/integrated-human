/**
 * Custom Learning Path Generator
 *
 * Generates personalized learning paths based on assessment results.
 * Analyzes dimension scores, identifies growth edges, and creates
 * a tailored journey of courses, articles, and practices.
 */

import { type PillarId } from './assessment/types';
import { type SpectrumStage } from './integration-health';
import { getContentForDimension } from './assessment/content-mapping';
import { getAllCourses, type Course } from './courses';
import { getAllPosts, type Post } from './posts';
import { getAllPractices, type Practice } from './practices';

// =============================================================================
// TYPES
// =============================================================================

export interface DimensionScore {
  pillarId: PillarId;
  dimensionId: string;
  dimensionName: string;
  score: number;
  stage: SpectrumStage;
}

export interface CustomPathStep {
  type: 'course' | 'article' | 'practice' | 'milestone' | 'reassessment';
  slug: string;
  title: string;
  description: string;
  duration?: string;
  priority: 'essential' | 'recommended' | 'optional';
  targetDimension: string;
  targetPillar: PillarId;
}

export interface CustomLearningPath {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  description: string;

  // What this path focuses on
  primaryPillar: PillarId;
  targetDimensions: string[];
  currentStage: SpectrumStage;

  // The journey
  steps: CustomPathStep[];
  estimatedDuration: string;

  // Outcomes
  expectedOutcomes: string[];

  // Meta
  generatedAt: Date;
  basedOnAssessment: string; // Assessment ID
}

export interface PathGenerationOptions {
  userId: string;
  assessmentId?: string;
  dimensionScores: DimensionScore[];
  maxSteps?: number; // Default 12
  focusPillar?: PillarId; // Optional: focus on specific pillar
  focusDimension?: string; // Optional: focus on specific dimension
  includeOptional?: boolean; // Include optional steps
}

// =============================================================================
// STAGE UTILITIES
// =============================================================================

function getStageFromScore(score: number): SpectrumStage {
  if (score <= 20) return 'collapse';
  if (score <= 40) return 'regulation';
  if (score <= 60) return 'integration';
  if (score <= 80) return 'embodiment';
  return 'optimization';
}

function getStageOrder(stage: SpectrumStage): number {
  const order: Record<SpectrumStage, number> = {
    collapse: 0,
    regulation: 1,
    integration: 2,
    embodiment: 3,
    optimization: 4,
  };
  return order[stage];
}

function getPillarName(pillarId: PillarId): string {
  const names: Record<PillarId, string> = {
    mind: 'Mind',
    body: 'Body',
    soul: 'Soul',
    relationships: 'Relationships',
  };
  return names[pillarId];
}

// =============================================================================
// PATH GENERATION
// =============================================================================

/**
 * Generate a custom learning path based on assessment results
 */
export function generateCustomPath(options: PathGenerationOptions): CustomLearningPath {
  const {
    userId,
    assessmentId,
    dimensionScores,
    maxSteps = 12,
    focusPillar,
    focusDimension,
    includeOptional = false,
  } = options;

  // 1. Identify growth edges (lowest-scoring dimensions)
  const growthEdges = identifyGrowthEdges(dimensionScores, focusPillar, focusDimension);

  // 2. Determine primary pillar and stage
  const primaryPillar = focusPillar || growthEdges[0]?.pillarId || 'mind';
  const currentStage = determineOverallStage(dimensionScores, primaryPillar);

  // 3. Get available content
  const courses = getAllCourses();
  const articles = getAllPosts();
  const practices = getAllPractices();

  // 4. Build the path steps
  const steps = buildPathSteps({
    growthEdges,
    currentStage,
    courses,
    articles,
    practices,
    maxSteps,
    includeOptional,
  });

  // 5. Calculate estimated duration
  const estimatedDuration = calculateDuration(steps);

  // 6. Generate outcomes
  const expectedOutcomes = generateOutcomes(growthEdges, currentStage);

  // 7. Build path metadata
  const targetDimensions = growthEdges.slice(0, 3).map(d => d.dimensionId);
  const title = generatePathTitle(primaryPillar, growthEdges[0]);
  const subtitle = generatePathSubtitle(currentStage, growthEdges);
  const description = generatePathDescription(growthEdges, currentStage);

  return {
    id: `custom-${userId}-${Date.now()}`,
    userId,
    title,
    subtitle,
    description,
    primaryPillar,
    targetDimensions,
    currentStage,
    steps,
    estimatedDuration,
    expectedOutcomes,
    generatedAt: new Date(),
    basedOnAssessment: assessmentId || 'manual',
  };
}

/**
 * Identify the dimensions most in need of development
 */
function identifyGrowthEdges(
  scores: DimensionScore[],
  focusPillar?: PillarId,
  focusDimension?: string
): DimensionScore[] {
  let filtered = [...scores];

  // Apply filters
  if (focusPillar) {
    filtered = filtered.filter(s => s.pillarId === focusPillar);
  }
  if (focusDimension) {
    filtered = filtered.filter(s => s.dimensionId === focusDimension);
  }

  // Sort by score (lowest first) - these are growth edges
  filtered.sort((a, b) => a.score - b.score);

  // Prioritize dimensions in crisis/regulation stages
  const criticalDimensions = filtered.filter(s =>
    s.stage === 'collapse' || s.stage === 'regulation'
  );

  const otherDimensions = filtered.filter(s =>
    s.stage !== 'collapse' && s.stage !== 'regulation'
  );

  // Return critical ones first, then others
  return [...criticalDimensions, ...otherDimensions].slice(0, 5);
}

/**
 * Determine the overall stage for a pillar
 */
function determineOverallStage(scores: DimensionScore[], pillarId: PillarId): SpectrumStage {
  const pillarScores = scores.filter(s => s.pillarId === pillarId);
  if (pillarScores.length === 0) return 'regulation';

  const avgScore = pillarScores.reduce((sum, s) => sum + s.score, 0) / pillarScores.length;
  return getStageFromScore(avgScore);
}

/**
 * Build the actual path steps from available content
 */
function buildPathSteps(params: {
  growthEdges: DimensionScore[];
  currentStage: SpectrumStage;
  courses: Course[];
  articles: Post[];
  practices: Practice[];
  maxSteps: number;
  includeOptional: boolean;
}): CustomPathStep[] {
  const { growthEdges, currentStage, courses, articles, practices, maxSteps, includeOptional } = params;
  const steps: CustomPathStep[] = [];
  const usedSlugs = new Set<string>();

  // For each growth edge, add relevant content
  for (const edge of growthEdges) {
    if (steps.length >= maxSteps) break;

    const dimensionContent = getContentForDimension(edge.pillarId, edge.dimensionId);
    if (!dimensionContent) continue;

    // Add an introductory article (if available)
    const relevantArticle = findBestArticle(
      articles,
      dimensionContent.articles,
      currentStage,
      usedSlugs
    );
    if (relevantArticle && steps.length < maxSteps) {
      steps.push({
        type: 'article',
        slug: relevantArticle.slug,
        title: relevantArticle.metadata.title,
        description: relevantArticle.metadata.excerpt.slice(0, 100) + '...',
        duration: `${relevantArticle.readingTime} min`,
        priority: 'recommended',
        targetDimension: edge.dimensionId,
        targetPillar: edge.pillarId,
      });
      usedSlugs.add(relevantArticle.slug);
    }

    // Add a practice (if in collapse/regulation, prioritize grounding)
    const relevantPractice = findBestPractice(
      practices,
      dimensionContent.practices,
      currentStage,
      usedSlugs
    );
    if (relevantPractice && steps.length < maxSteps) {
      steps.push({
        type: 'practice',
        slug: relevantPractice.slug,
        title: relevantPractice.metadata.title,
        description: relevantPractice.metadata.description,
        duration: relevantPractice.metadata.duration === 'quick' ? '5 min' : '15 min',
        priority: edge.stage === 'collapse' ? 'essential' : 'recommended',
        targetDimension: edge.dimensionId,
        targetPillar: edge.pillarId,
      });
      usedSlugs.add(relevantPractice.slug);
    }

    // Add the main course (essential)
    const relevantCourse = findBestCourse(
      courses,
      dimensionContent.courses,
      currentStage,
      usedSlugs
    );
    if (relevantCourse && steps.length < maxSteps) {
      steps.push({
        type: 'course',
        slug: relevantCourse.slug,
        title: relevantCourse.metadata.title,
        description: relevantCourse.metadata.description.slice(0, 100) + '...',
        duration: relevantCourse.metadata.duration,
        priority: 'essential',
        targetDimension: edge.dimensionId,
        targetPillar: edge.pillarId,
      });
      usedSlugs.add(relevantCourse.slug);
    }
  }

  // Add a milestone at the end
  if (steps.length > 0) {
    steps.push({
      type: 'milestone',
      slug: 'path-complete',
      title: 'Integration Milestone',
      description: 'Reflect on your journey and reassess your progress',
      duration: '15 min',
      priority: 'essential',
      targetDimension: growthEdges[0]?.dimensionId || 'general',
      targetPillar: growthEdges[0]?.pillarId || 'mind',
    });

    // Optionally add reassessment
    if (includeOptional) {
      steps.push({
        type: 'reassessment',
        slug: 'reassess-dimensions',
        title: 'Reassess Your Growth',
        description: 'Measure your progress in the targeted dimensions',
        duration: '10 min',
        priority: 'optional',
        targetDimension: growthEdges[0]?.dimensionId || 'general',
        targetPillar: growthEdges[0]?.pillarId || 'mind',
      });
    }
  }

  return steps;
}

/**
 * Find the best article for a dimension and stage
 */
function findBestArticle(
  allArticles: Post[],
  dimensionArticleSlugs: string[],
  stage: SpectrumStage,
  usedSlugs: Set<string>
): Post | undefined {
  // Filter to articles that match dimension and haven't been used
  const candidates = allArticles.filter(a =>
    dimensionArticleSlugs.includes(a.slug) && !usedSlugs.has(a.slug)
  );

  if (candidates.length === 0) return undefined;

  // Prefer shorter articles for collapse/regulation stages
  if (stage === 'collapse' || stage === 'regulation') {
    candidates.sort((a, b) => a.readingTime - b.readingTime);
  }

  return candidates[0];
}

/**
 * Find the best practice for a dimension and stage
 */
function findBestPractice(
  allPractices: Practice[],
  dimensionPracticeSlugs: string[],
  stage: SpectrumStage,
  usedSlugs: Set<string>
): Practice | undefined {
  // Filter to practices that match dimension and haven't been used
  const candidates = allPractices.filter(p =>
    dimensionPracticeSlugs.includes(p.slug) && !usedSlugs.has(p.slug)
  );

  if (candidates.length === 0) return undefined;

  // For collapse/regulation, prefer calming/grounding practices
  if (stage === 'collapse' || stage === 'regulation') {
    const calming = candidates.filter(p =>
      p.metadata.tags?.some((t: string) =>
        ['calming', 'grounding', 'beginner-friendly', 'anxiety-relief'].includes(t)
      )
    );
    if (calming.length > 0) return calming[0];
  }

  return candidates[0];
}

/**
 * Find the best course for a dimension and stage
 */
function findBestCourse(
  allCourses: Course[],
  dimensionCourseSlugs: string[],
  stage: SpectrumStage,
  usedSlugs: Set<string>
): Course | undefined {
  // Filter to courses that match dimension and haven't been used
  const candidates = allCourses.filter(c =>
    dimensionCourseSlugs.includes(c.slug) &&
    !usedSlugs.has(c.slug) &&
    c.metadata.published
  );

  if (candidates.length === 0) return undefined;

  // Check if course is appropriate for user's stage
  const stageOrder = getStageOrder(stage);
  const appropriate = candidates.filter(c => {
    const courseStages = c.metadata.spectrum || [];
    // Course is appropriate if it includes user's stage or adjacent stages
    return courseStages.some(s => {
      const courseStageOrder = getStageOrder(s as SpectrumStage);
      return Math.abs(courseStageOrder - stageOrder) <= 1;
    });
  });

  // Prefer stage-appropriate courses, otherwise return any candidate
  if (appropriate.length > 0) {
    // Prefer intro/beginner tiers for earlier stages
    if (stage === 'collapse' || stage === 'regulation') {
      const simpler = appropriate.filter(c =>
        c.metadata.tier === 'intro' || c.metadata.tier === 'beginner'
      );
      if (simpler.length > 0) return simpler[0];
    }
    return appropriate[0];
  }

  return candidates[0];
}

/**
 * Calculate total estimated duration
 */
function calculateDuration(steps: CustomPathStep[]): string {
  let totalMinutes = 0;

  for (const step of steps) {
    if (!step.duration) continue;

    // Parse duration string
    const match = step.duration.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (step.duration.includes('hour')) {
        totalMinutes += num * 60;
      } else {
        totalMinutes += num;
      }
    }
  }

  // Convert to readable format
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else if (totalMinutes < 180) {
    const hours = Math.round(totalMinutes / 60 * 10) / 10;
    return `${hours} hours`;
  } else {
    // Estimate as "days" or "weeks" based on 30 min/day practice
    const days = Math.ceil(totalMinutes / 30);
    if (days <= 7) {
      return `${days} days`;
    } else {
      const weeks = Math.ceil(days / 7);
      return `${weeks} weeks`;
    }
  }
}

/**
 * Generate expected outcomes based on growth edges
 */
function generateOutcomes(edges: DimensionScore[], stage: SpectrumStage): string[] {
  const outcomes: string[] = [];

  // Stage-specific outcomes
  switch (stage) {
    case 'collapse':
      outcomes.push('Establish basic stability and safety');
      outcomes.push('Develop emergency regulation tools');
      break;
    case 'regulation':
      outcomes.push('Build consistent self-regulation capacity');
      outcomes.push('Recognize patterns before they overwhelm');
      break;
    case 'integration':
      outcomes.push('Connect understanding with felt experience');
      outcomes.push('Integrate insights into daily life');
      break;
    case 'embodiment':
      outcomes.push('Express growth naturally without effort');
      outcomes.push('Support others from embodied knowing');
      break;
    case 'optimization':
      outcomes.push('Refine and deepen existing capacities');
      outcomes.push('Explore advanced practices and edge work');
      break;
  }

  // Dimension-specific outcomes
  for (const edge of edges.slice(0, 2)) {
    outcomes.push(`Develop capacity in ${edge.dimensionName.toLowerCase()}`);
  }

  return outcomes;
}

/**
 * Generate path title
 */
function generatePathTitle(pillar: PillarId, primaryEdge?: DimensionScore): string {
  if (primaryEdge) {
    return `Your ${primaryEdge.dimensionName} Journey`;
  }
  return `Your ${getPillarName(pillar)} Development Path`;
}

/**
 * Generate path subtitle
 */
function generatePathSubtitle(stage: SpectrumStage, edges: DimensionScore[]): string {
  const stageNames: Record<SpectrumStage, string> = {
    collapse: 'Finding stability',
    regulation: 'Building foundations',
    integration: 'Connecting the pieces',
    embodiment: 'Living your growth',
    optimization: 'Refining mastery',
  };

  return stageNames[stage];
}

/**
 * Generate path description
 */
function generatePathDescription(edges: DimensionScore[], stage: SpectrumStage): string {
  if (edges.length === 0) {
    return 'A personalized learning path based on your assessment results.';
  }

  const dimensionNames = edges.slice(0, 2).map(e => e.dimensionName.toLowerCase()).join(' and ');

  const stageIntro: Record<SpectrumStage, string> = {
    collapse: 'This path focuses on establishing safety and stability',
    regulation: 'This path builds your capacity to stay grounded',
    integration: 'This path helps you connect insight with experience',
    embodiment: 'This path supports natural expression of your growth',
    optimization: 'This path refines and deepens your existing capacities',
  };

  return `${stageIntro[stage]}, with special attention to ${dimensionNames}. ` +
    `Each step is chosen to meet you where you are and guide you forward at your own pace.`;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export interface SavedCustomPath {
  id: string;
  userId: string;
  pathData: CustomLearningPath;
  progress: {
    completedSteps: string[]; // Step slugs
    currentStepIndex: number;
    startedAt: Date;
    lastActivityAt: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note: Database model would be added to schema.prisma:
// model CustomLearningPath {
//   id              String   @id @default(cuid())
//   userId          String
//   pathData        String   @db.Text // JSON of CustomLearningPath
//   completedSteps  String   @db.Text // JSON array of slugs
//   currentStepIndex Int     @default(0)
//   isActive        Boolean  @default(true)
//   startedAt       DateTime @default(now())
//   lastActivityAt  DateTime @default(now())
//   createdAt       DateTime @default(now())
//   updatedAt       DateTime @updatedAt
//
//   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
//
//   @@index([userId])
//   @@index([userId, isActive])
// }
