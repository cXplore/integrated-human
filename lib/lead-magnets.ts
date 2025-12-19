import fs from 'fs';
import path from 'path';

const leadMagnetsDirectory = path.join(process.cwd(), 'content/lead-magnets');

export interface LeadMagnet {
  slug: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  content: string;
}

// Lead magnet metadata - matches file names
const leadMagnetMeta: Record<string, Omit<LeadMagnet, 'slug' | 'content'>> = {
  'shadow-work-prompts': {
    title: '5 Shadow Work Prompts That Actually Work',
    description: 'Uncover hidden parts of yourself with these powerful journaling prompts. Includes reflection questions and insights for deeper self-understanding.',
    category: 'Mind',
    image: '/images/lead-magnets/shadow-work-prompts.jpg',
  },
  'nervous-system-reset-checklist': {
    title: 'The Nervous System Reset Checklist',
    description: 'A printable quick-reference guide to identify your nervous system state and apply the right intervention. Includes daily maintenance practices.',
    category: 'Body',
    image: '/images/lead-magnets/nervous-system-checklist.jpg',
  },
  'integration-starter-kit': {
    title: 'The Integration Starter Kit',
    description: 'Your foundation guide to Mind, Body, Soul, and Relationships integration. The essential framework for becoming whole.',
    category: 'Soul',
    image: '/images/lead-magnets/integration-starter-kit.jpg',
  },
  'archetype-email-course': {
    title: '7-Day Archetype Discovery Email Course',
    description: 'A week-long journey into Jungian archetypes. Delivered to your inbox, one insight per day. Discover which archetypes are active in your life.',
    category: 'Mind',
    image: '/images/lead-magnets/archetype-course.jpg',
  },
};

export function getAllLeadMagnets(): LeadMagnet[] {
  if (!fs.existsSync(leadMagnetsDirectory)) {
    return [];
  }

  const files = fs.readdirSync(leadMagnetsDirectory)
    .filter(file => file.endsWith('.md'));

  return files.map((file) => {
    const slug = file.replace('.md', '');
    const fullPath = path.join(leadMagnetsDirectory, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const meta = leadMagnetMeta[slug] || {
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: '',
      category: 'General',
    };

    return {
      slug,
      content,
      ...meta,
    };
  });
}

export function getLeadMagnetBySlug(slug: string): LeadMagnet | undefined {
  const leadMagnets = getAllLeadMagnets();
  return leadMagnets.find(lm => lm.slug === slug);
}

export function getLeadMagnetContent(slug: string): string | undefined {
  const filePath = path.join(leadMagnetsDirectory, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return fs.readFileSync(filePath, 'utf8');
}
