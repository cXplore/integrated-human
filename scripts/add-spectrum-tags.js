/**
 * Script to add Development Spectrum tags to all course.json files
 *
 * Spectrum stages:
 * - collapse: Crisis states, overwhelm, acute distress
 * - regulation: Nervous system work, stabilization, building safety
 * - integration: Shadow work, pattern recognition, emotional processing
 * - embodiment: Practice, consistency, living values
 * - optimization: Peak performance, flow, mastery
 */

const fs = require('fs');
const path = require('path');

const coursesDir = path.join(__dirname, '../content/courses');

// Mapping of course IDs to their spectrum stages
// Based on course content and appropriate audience
const spectrumMapping = {
  // COLLAPSE-FOCUSED (crisis support, stabilization)
  'anxiety-first-aid': ['collapse', 'regulation'],
  'anxiety-and-panic': ['collapse', 'regulation'],
  'no-contact-recovery': ['collapse', 'regulation'],
  'grief-and-loss': ['collapse', 'regulation', 'integration'],

  // REGULATION-FOCUSED (nervous system, grounding, safety)
  'nervous-system-mastery': ['regulation', 'integration'],
  'breathwork-mastery': ['regulation', 'integration', 'embodiment'],
  'breath-mastery': ['regulation', 'integration'],
  'stress-resilience-mastery': ['regulation', 'integration'],
  'trauma-informed-self-care': ['regulation', 'integration'],
  'trauma-informed-healing': ['regulation', 'integration'],
  'embodiment-basics': ['regulation', 'integration'],
  'somatic-healing': ['regulation', 'integration', 'embodiment'],
  'movement-fundamentals': ['regulation', 'embodiment'],
  'sleep-mastery': ['regulation', 'embodiment'],
  'sleep-optimization': ['regulation', 'embodiment', 'optimization'],
  'mindfulness-basics': ['regulation', 'integration'],
  'meditation-fundamentals': ['regulation', 'integration'],
  'presence-practices': ['regulation', 'integration', 'embodiment'],
  'breaking-free-anxiety': ['regulation', 'integration'],
  'overthinking-to-clarity': ['regulation', 'integration'],
  'ocd-and-intrusive-thoughts': ['regulation', 'integration'],
  'adhd-and-the-overwhelmed-mind': ['regulation', 'integration'],
  'chronic-pain-and-the-mind': ['regulation', 'integration'],
  'depression-a-different-approach': ['collapse', 'regulation', 'integration'],
  'emotional-release': ['regulation', 'integration'],

  // INTEGRATION-FOCUSED (processing, shadow work, healing)
  'shadow-work-foundations': ['integration'],
  'the-integrated-self': ['integration', 'embodiment'],
  'the-integration-path': ['integration', 'embodiment'],
  'parts-work': ['integration'],
  'inner-critic-work': ['integration'],
  'healing-inner-child': ['integration'],
  'self-worth-foundations': ['integration'],
  'self-worth-and-shame': ['integration', 'embodiment'],
  'self-sabotage-recovery': ['integration'],
  'perfectionism-recovery': ['integration'],
  'people-pleasing-recovery': ['integration'],
  'people-pleasing-deep-dive': ['integration'],
  'forgiveness': ['integration', 'embodiment'],
  'codependency-recovery': ['integration'],
  'addiction-and-compulsion': ['regulation', 'integration'],
  'anger-and-aggression': ['regulation', 'integration'],
  'jealousy-and-trust': ['integration'],
  'attachment-repair': ['integration', 'embodiment'],
  'boundaries': ['integration', 'embodiment'],
  'family-systems': ['integration'],
  'family-systems-healing': ['integration', 'embodiment'],
  'body-image-healing': ['integration'],
  'intimacy-after-trauma': ['integration', 'embodiment'],
  'ending-relationships-well': ['integration'],
  'mastering-emotions': ['integration', 'embodiment'],
  'intro-emotional-intelligence': ['integration'],
  'loneliness': ['integration'],
  'psychedelic-integration': ['integration', 'embodiment'],

  // EMBODIMENT-FOCUSED (practice, consistency, living values)
  'mindfulness-meditation-mastery': ['integration', 'embodiment'],
  'conscious-relationship': ['integration', 'embodiment'],
  'conscious-relationship-mastery': ['embodiment', 'optimization'],
  'relationship-mastery': ['embodiment', 'optimization'],
  'healing-relationships-101': ['integration', 'embodiment'],
  'communication-mastery': ['embodiment', 'optimization'],
  'conflict-as-connection': ['integration', 'embodiment'],
  'conscious-dating': ['integration', 'embodiment'],
  'dating-for-men': ['integration', 'embodiment'],
  'dating-for-women': ['integration', 'embodiment'],
  'attraction-fundamentals': ['integration', 'embodiment'],
  'sexuality-and-intimacy': ['integration', 'embodiment'],
  'friendship-in-adulthood': ['embodiment'],
  'building-authentic-confidence': ['integration', 'embodiment'],
  'confidence-quickstart': ['regulation', 'integration'],
  'the-embodied-man': ['integration', 'embodiment'],
  'the-sovereign-woman': ['integration', 'embodiment'],
  'masculine-wholeness': ['integration', 'embodiment'],
  'feminine-reclamation': ['integration', 'embodiment'],
  'ritual-and-practice': ['embodiment'],
  'nature-connection': ['regulation', 'embodiment'],
  'procrastination': ['integration', 'embodiment'],
  'art-of-self-discipline': ['embodiment', 'optimization'],

  // OPTIMIZATION-FOCUSED (peak performance, mastery, flow)
  'energy-and-vitality': ['embodiment', 'optimization'],
  'life-purpose': ['integration', 'embodiment'],
  'life-purpose-discovery': ['integration', 'embodiment'],
  'finding-your-path': ['integration', 'embodiment'],
  'finding-your-why': ['integration'],
  'career-and-purpose': ['embodiment', 'optimization'],
  'meaning-and-purpose': ['integration', 'embodiment'],
  'creativity-and-spirit': ['embodiment', 'optimization'],
  'money-and-worth': ['integration', 'embodiment'],

  // CONSCIOUSNESS/SPIRITUAL (spans multiple stages)
  'intro-to-consciousness': ['integration'],
  'foundations-of-consciousness': ['integration', 'embodiment'],
  'spiritual-emergence': ['integration', 'embodiment'],
  'death-and-mortality': ['integration', 'embodiment'],
  'death-contemplation': ['integration', 'embodiment'],
  'psychedelic-deep-work': ['integration', 'embodiment'],
  'consciousness-and-the-psychedelic-experience': ['integration', 'embodiment'],
};

// Process all course.json files
function addSpectrumTags() {
  const courseDirs = fs.readdirSync(coursesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let updated = 0;
  let skipped = 0;
  let notMapped = [];

  for (const dir of courseDirs) {
    const coursePath = path.join(coursesDir, dir, 'course.json');

    if (!fs.existsSync(coursePath)) {
      continue;
    }

    const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
    const courseId = courseData.id || dir;

    // Check if we have a mapping for this course
    if (spectrumMapping[courseId]) {
      courseData.spectrum = spectrumMapping[courseId];
      fs.writeFileSync(coursePath, JSON.stringify(courseData, null, 2) + '\n');
      updated++;
      console.log(`Updated: ${courseId} -> ${spectrumMapping[courseId].join(', ')}`);
    } else {
      // Default to integration for unmapped courses (most common)
      courseData.spectrum = ['integration'];
      fs.writeFileSync(coursePath, JSON.stringify(courseData, null, 2) + '\n');
      notMapped.push(courseId);
      console.log(`Defaulted: ${courseId} -> integration (not mapped)`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Updated with specific mapping: ${updated}`);
  console.log(`Defaulted to integration: ${notMapped.length}`);

  if (notMapped.length > 0) {
    console.log('\nCourses that were defaulted (review these):');
    notMapped.forEach(id => console.log(`  - ${id}`));
  }
}

addSpectrumTags();
