/**
 * Content Coverage Analysis Script
 *
 * Analyzes how well the platform's content (articles, courses, practices)
 * covers the 150 dimension-stage combinations (30 dimensions × 5 stages).
 *
 * Run with: npx tsx scripts/analyze-content-coverage.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Development stages
const STAGES = ['collapse', 'regulation', 'integration', 'embodiment', 'optimization'] as const;
type Stage = typeof STAGES[number];

// All 30 dimensions organized by pillar
const DIMENSIONS = {
  mind: [
    'emotional-regulation',
    'cognitive-flexibility',
    'self-awareness',
    'present-moment',
    'thought-patterns',
    'psychological-safety',
    'self-relationship',
    'meaning-purpose',
  ],
  body: [
    'interoception',
    'stress-physiology',
    'sleep-restoration',
    'energy-vitality',
    'movement-capacity',
    'nourishment',
    'embodied-presence',
  ],
  soul: [
    'authenticity',
    'existential-grounding',
    'transcendence',
    'shadow-integration',
    'creative-expression',
    'life-engagement',
    'inner-wisdom',
    'spiritual-practice',
  ],
  relationships: [
    'attachment-patterns',
    'communication',
    'boundaries',
    'conflict-repair',
    'trust-vulnerability',
    'empathy-attunement',
    'intimacy-depth',
    'social-connection',
    'relational-patterns',
  ],
} as const;

type Pillar = keyof typeof DIMENSIONS;

// Keywords that map to dimensions (for content analysis)
const DIMENSION_KEYWORDS: Record<string, string[]> = {
  'emotional-regulation': ['emotion', 'emotional regulation', 'feelings', 'affect', 'mood', 'distress', 'overwhelm'],
  'cognitive-flexibility': ['cognitive', 'thinking', 'perspective', 'mindset', 'beliefs', 'reframe'],
  'self-awareness': ['self-awareness', 'insight', 'patterns', 'self-knowledge', 'metacognition'],
  'present-moment': ['present', 'mindfulness', 'attention', 'awareness', 'meditation', 'now'],
  'thought-patterns': ['thoughts', 'rumination', 'catastrophizing', 'inner critic', 'self-talk'],
  'psychological-safety': ['safety', 'nervous system', 'vagus', 'polyvagal', 'regulation', 'window of tolerance'],
  'self-relationship': ['self-compassion', 'self-acceptance', 'self-trust', 'self-esteem', 'self-worth'],
  'meaning-purpose': ['meaning', 'purpose', 'values', 'direction', 'why', 'mission'],
  'interoception': ['body awareness', 'interoception', 'body signals', 'somatic', 'felt sense'],
  'stress-physiology': ['stress', 'cortisol', 'HPA', 'fight or flight', 'chronic tension', 'recovery'],
  'sleep-restoration': ['sleep', 'rest', 'circadian', 'insomnia', 'restoration', 'recovery'],
  'energy-vitality': ['energy', 'vitality', 'fatigue', 'exhaustion', 'aliveness'],
  'movement-capacity': ['movement', 'exercise', 'mobility', 'physical', 'strength', 'flexibility'],
  'nourishment': ['nutrition', 'eating', 'food', 'hunger', 'nourishment', 'diet'],
  'embodied-presence': ['embodiment', 'body', 'inhabit', 'grounding', 'physical presence'],
  'authenticity': ['authenticity', 'true self', 'genuine', 'mask', 'persona', 'real'],
  'existential-grounding': ['existential', 'mortality', 'death', 'meaning of life', 'uncertainty'],
  'transcendence': ['transcendence', 'awe', 'wonder', 'spiritual', 'connection', 'larger'],
  'shadow-integration': ['shadow', 'shadow work', 'disowned', 'projection', 'jung'],
  'creative-expression': ['creativity', 'creative', 'expression', 'art', 'create'],
  'life-engagement': ['engagement', 'aliveness', 'participation', 'vitality', 'living fully'],
  'inner-wisdom': ['intuition', 'inner wisdom', 'knowing', 'gut feeling', 'guidance'],
  'spiritual-practice': ['spiritual', 'practice', 'meditation', 'contemplative', 'sacred'],
  'attachment-patterns': ['attachment', 'anxious attachment', 'avoidant', 'secure', 'bonding'],
  'communication': ['communication', 'express', 'listen', 'conversation', 'dialogue'],
  'boundaries': ['boundaries', 'limits', 'no', 'assertive', 'protect'],
  'conflict-repair': ['conflict', 'repair', 'rupture', 'fight', 'disagreement', 'resolution'],
  'trust-vulnerability': ['trust', 'vulnerability', 'open', 'risk', 'exposure'],
  'empathy-attunement': ['empathy', 'attunement', 'understand', 'compassion', 'feel with'],
  'intimacy-depth': ['intimacy', 'depth', 'closeness', 'connection', 'deep relationship'],
  'social-connection': ['social', 'belonging', 'community', 'friends', 'network', 'loneliness'],
  'relational-patterns': ['patterns', 'relationship patterns', 'dynamics', 'repetition'],
};

// Stage indicators in content
const STAGE_INDICATORS: Record<Stage, string[]> = {
  collapse: ['crisis', 'survival', 'overwhelmed', 'can\'t function', 'falling apart', 'breaking down', 'emergency'],
  regulation: ['stabilize', 'basics', 'foundation', 'beginning', 'start', 'first steps', 'coping', 'manage'],
  integration: ['understand', 'connect', 'synthesize', 'pattern', 'deeper', 'why', 'meaning'],
  embodiment: ['natural', 'automatic', 'flow', 'embody', 'effortless', 'mastery', 'teach'],
  optimization: ['refine', 'subtle', 'nuance', 'advanced', 'optimize', 'fine-tune', 'edge'],
};

interface ContentItem {
  slug: string;
  title: string;
  type: 'article' | 'course' | 'practice';
  pillar?: string;
  dimensions: string[];
  stages: Stage[];
  path: string;
}

interface CoverageCell {
  dimension: string;
  stage: Stage;
  content: ContentItem[];
  score: number; // 0-3: none, weak, moderate, strong
}

function readMdxFiles(dir: string, type: 'article' | 'course' | 'practice'): ContentItem[] {
  const items: ContentItem[] = [];

  if (!fs.existsSync(dir)) {
    return items;
  }

  const files = fs.readdirSync(dir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(dir, file.toString());
    if (!filePath.endsWith('.mdx') && !filePath.endsWith('.md')) continue;
    if (fs.statSync(filePath).isDirectory()) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(content);

      const fullText = `${data.title || ''} ${data.description || ''} ${body}`.toLowerCase();

      // Detect dimensions
      const detectedDimensions: string[] = [];
      for (const [dim, keywords] of Object.entries(DIMENSION_KEYWORDS)) {
        for (const keyword of keywords) {
          if (fullText.includes(keyword.toLowerCase())) {
            if (!detectedDimensions.includes(dim)) {
              detectedDimensions.push(dim);
            }
            break;
          }
        }
      }

      // Detect stages
      const detectedStages: Stage[] = [];
      for (const [stage, indicators] of Object.entries(STAGE_INDICATORS)) {
        for (const indicator of indicators) {
          if (fullText.includes(indicator.toLowerCase())) {
            if (!detectedStages.includes(stage as Stage)) {
              detectedStages.push(stage as Stage);
            }
            break;
          }
        }
      }

      // Default to integration/regulation if no stage detected
      if (detectedStages.length === 0) {
        detectedStages.push('integration', 'regulation');
      }

      const slug = path.basename(filePath, path.extname(filePath));

      items.push({
        slug,
        title: data.title || slug,
        type,
        pillar: data.pillar || data.category,
        dimensions: detectedDimensions,
        stages: detectedStages,
        path: filePath,
      });
    } catch (e) {
      console.error(`Error processing ${filePath}:`, e);
    }
  }

  return items;
}

function analyzeCoverage(content: ContentItem[]): Map<string, CoverageCell> {
  const coverage = new Map<string, CoverageCell>();

  // Initialize all cells
  for (const [pillar, dims] of Object.entries(DIMENSIONS)) {
    for (const dim of dims) {
      for (const stage of STAGES) {
        const key = `${dim}:${stage}`;
        coverage.set(key, {
          dimension: dim,
          stage,
          content: [],
          score: 0,
        });
      }
    }
  }

  // Populate with content
  for (const item of content) {
    for (const dim of item.dimensions) {
      for (const stage of item.stages) {
        const key = `${dim}:${stage}`;
        const cell = coverage.get(key);
        if (cell) {
          cell.content.push(item);
        }
      }
    }
  }

  // Calculate scores
  for (const cell of coverage.values()) {
    const count = cell.content.length;
    const hasArticle = cell.content.some(c => c.type === 'article');
    const hasCourse = cell.content.some(c => c.type === 'course');
    const hasPractice = cell.content.some(c => c.type === 'practice');

    if (count === 0) {
      cell.score = 0;
    } else if (count <= 2 || (!hasArticle && !hasCourse)) {
      cell.score = 1;
    } else if (count <= 5 || !(hasArticle && hasCourse)) {
      cell.score = 2;
    } else {
      cell.score = 3;
    }
  }

  return coverage;
}

function generateReport(coverage: Map<string, CoverageCell>): string {
  const lines: string[] = [];

  lines.push('# Content Coverage Analysis');
  lines.push(`\nGenerated: ${new Date().toISOString()}\n`);

  // Summary statistics
  let total = 0;
  let none = 0;
  let weak = 0;
  let moderate = 0;
  let strong = 0;

  for (const cell of coverage.values()) {
    total++;
    switch (cell.score) {
      case 0: none++; break;
      case 1: weak++; break;
      case 2: moderate++; break;
      case 3: strong++; break;
    }
  }

  lines.push('## Summary\n');
  lines.push(`- **Total combinations**: ${total} (30 dimensions × 5 stages)`);
  lines.push(`- **No coverage**: ${none} (${(none/total*100).toFixed(1)}%)`);
  lines.push(`- **Weak coverage**: ${weak} (${(weak/total*100).toFixed(1)}%)`);
  lines.push(`- **Moderate coverage**: ${moderate} (${(moderate/total*100).toFixed(1)}%)`);
  lines.push(`- **Strong coverage**: ${strong} (${(strong/total*100).toFixed(1)}%)`);
  lines.push('');

  // Coverage matrix by pillar
  for (const [pillar, dims] of Object.entries(DIMENSIONS)) {
    lines.push(`\n## ${pillar.charAt(0).toUpperCase() + pillar.slice(1)} Pillar\n`);

    // Header
    lines.push('| Dimension | Collapse | Regulation | Integration | Embodiment | Optimization |');
    lines.push('|-----------|----------|------------|-------------|------------|--------------|');

    for (const dim of dims) {
      const row = [dim];
      for (const stage of STAGES) {
        const key = `${dim}:${stage}`;
        const cell = coverage.get(key)!;
        const emoji = ['❌', '🟡', '🟢', '✅'][cell.score];
        row.push(`${emoji} ${cell.content.length}`);
      }
      lines.push(`| ${row.join(' | ')} |`);
    }
  }

  // Gaps analysis
  lines.push('\n## Content Gaps (Priority Areas)\n');

  const gaps: CoverageCell[] = [];
  for (const cell of coverage.values()) {
    if (cell.score === 0) {
      gaps.push(cell);
    }
  }

  if (gaps.length === 0) {
    lines.push('No complete gaps found!');
  } else {
    lines.push(`Found ${gaps.length} dimension-stage combinations with no content:\n`);

    // Group by stage
    for (const stage of STAGES) {
      const stageGaps = gaps.filter(g => g.stage === stage);
      if (stageGaps.length > 0) {
        lines.push(`### ${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage Gaps\n`);
        for (const gap of stageGaps) {
          lines.push(`- ${gap.dimension}`);
        }
        lines.push('');
      }
    }
  }

  // Weak coverage
  lines.push('\n## Weak Coverage (Needs Improvement)\n');

  const weakCoverage: CoverageCell[] = [];
  for (const cell of coverage.values()) {
    if (cell.score === 1) {
      weakCoverage.push(cell);
    }
  }

  if (weakCoverage.length === 0) {
    lines.push('No weak coverage areas!');
  } else {
    lines.push(`Found ${weakCoverage.length} dimension-stage combinations with weak coverage:\n`);

    for (const stage of STAGES) {
      const stageWeak = weakCoverage.filter(g => g.stage === stage);
      if (stageWeak.length > 0) {
        lines.push(`### ${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage\n`);
        for (const item of stageWeak) {
          lines.push(`- ${item.dimension} (${item.content.length} item${item.content.length !== 1 ? 's' : ''})`);
        }
        lines.push('');
      }
    }
  }

  // Content recommendations
  lines.push('\n## Recommended New Content\n');
  lines.push('Based on gaps and weak coverage, prioritize creating content for:\n');

  const priorities: { dimension: string; stage: Stage; reason: string }[] = [];

  // Prioritize collapse stage (crisis content important)
  for (const cell of coverage.values()) {
    if (cell.stage === 'collapse' && cell.score <= 1) {
      priorities.push({
        dimension: cell.dimension,
        stage: cell.stage,
        reason: 'Crisis-stage content is critical for users in distress',
      });
    }
  }

  // Then regulation (foundation building)
  for (const cell of coverage.values()) {
    if (cell.stage === 'regulation' && cell.score === 0) {
      priorities.push({
        dimension: cell.dimension,
        stage: cell.stage,
        reason: 'Foundational content for early development',
      });
    }
  }

  // Then integration (largest user segment)
  for (const cell of coverage.values()) {
    if (cell.stage === 'integration' && cell.score === 0) {
      priorities.push({
        dimension: cell.dimension,
        stage: cell.stage,
        reason: 'Core content for main user segment',
      });
    }
  }

  // Limit to top 20
  const topPriorities = priorities.slice(0, 20);
  for (const p of topPriorities) {
    lines.push(`1. **${p.dimension}** (${p.stage}): ${p.reason}`);
  }

  return lines.join('\n');
}

// Main execution
async function main() {
  console.log('Analyzing content coverage...\n');

  const projectRoot = path.resolve(__dirname, '..');
  const contentDir = path.join(projectRoot, 'content');

  // Read all content
  const articles = readMdxFiles(path.join(contentDir, 'posts'), 'article');
  const practices = readMdxFiles(path.join(contentDir, 'practices'), 'practice');

  // Read courses (nested structure)
  const coursesDir = path.join(contentDir, 'courses');
  const courses: ContentItem[] = [];
  if (fs.existsSync(coursesDir)) {
    for (const courseDir of fs.readdirSync(coursesDir)) {
      const coursePath = path.join(coursesDir, courseDir);
      if (fs.statSync(coursePath).isDirectory()) {
        courses.push(...readMdxFiles(coursePath, 'course'));
      }
    }
  }

  const allContent = [...articles, ...practices, ...courses];

  console.log(`Found ${articles.length} articles`);
  console.log(`Found ${courses.length} course modules`);
  console.log(`Found ${practices.length} practices`);
  console.log(`Total: ${allContent.length} content items\n`);

  // Analyze coverage
  const coverage = analyzeCoverage(allContent);

  // Generate report
  const report = generateReport(coverage);

  // Save report
  const reportPath = path.join(projectRoot, 'docs', 'content-coverage-analysis.md');
  fs.writeFileSync(reportPath, report);
  console.log(`Report saved to: ${reportPath}`);

  // Print summary to console
  console.log('\n--- Summary ---\n');
  let total = 0;
  let none = 0;
  for (const cell of coverage.values()) {
    total++;
    if (cell.score === 0) none++;
  }
  console.log(`Coverage gaps: ${none}/${total} combinations have no content`);
  console.log(`See full report at: docs/content-coverage-analysis.md`);
}

main().catch(console.error);
