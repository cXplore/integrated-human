/**
 * Health System Types (Client-safe)
 *
 * These types and constants can be safely imported in both server and client components.
 * Extracted from integration-health.ts to avoid Prisma dependency in client bundles.
 */

export type Pillar = 'mind' | 'body' | 'soul' | 'relationships';

export type SpectrumStage = 'collapse' | 'regulation' | 'integration' | 'embodiment' | 'optimization';

export const PILLAR_INFO: Record<Pillar, {
  name: string;
  description: string;
  icon: string;
  dimensions: string[];
}> = {
  mind: {
    name: 'Mind',
    description: 'Psychology, shadow work, emotional intelligence, pattern recognition',
    icon: '🧠',
    dimensions: ['Shadow Work', 'Emotional Intelligence', 'Cognitive Clarity'],
  },
  body: {
    name: 'Body',
    description: 'Nervous system, embodiment, physical vitality, somatic awareness',
    icon: '💪',
    dimensions: ['Nervous System', 'Physical Vitality', 'Embodiment'],
  },
  soul: {
    name: 'Soul',
    description: 'Meaning, spiritual practice, presence, inner stillness',
    icon: '✨',
    dimensions: ['Meaningfulness', 'Spiritual Practice', 'Presence'],
  },
  relationships: {
    name: 'Relationships',
    description: 'Attachment patterns, boundaries, intimacy, connection',
    icon: '💕',
    dimensions: ['Attachment Security', 'Boundaries', 'Intimacy'],
  },
};

export const SPECTRUM_STAGES: SpectrumStage[] = [
  'collapse',
  'regulation',
  'integration',
  'embodiment',
  'optimization',
];

export const STAGE_INFO: Record<SpectrumStage, {
  name: string;
  description: string;
  color: string;
  focus: string;
}> = {
  collapse: {
    name: 'Collapse',
    description: 'Crisis states requiring stabilization and safety',
    color: 'red',
    focus: 'Finding ground, establishing safety, crisis support',
  },
  regulation: {
    name: 'Regulation',
    description: 'Building capacity for nervous system regulation',
    color: 'orange',
    focus: 'Grounding practices, nervous system work, building resilience',
  },
  integration: {
    name: 'Integration',
    description: 'Core development work - shadow, patterns, emotional processing',
    color: 'yellow',
    focus: 'Shadow work, pattern recognition, emotional intelligence',
  },
  embodiment: {
    name: 'Embodiment',
    description: 'Living wisdom, sustainable practice, values alignment',
    color: 'green',
    focus: 'Deepening practice, living values, sustainable transformation',
  },
  optimization: {
    name: 'Optimization',
    description: 'Peak performance from solid foundations',
    color: 'blue',
    focus: 'Mastery, flow states, contribution, leadership',
  },
};
