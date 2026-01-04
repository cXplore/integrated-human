/**
 * Tests for Classification Utilities
 *
 * Tests the unified classification utilities used across all AI tools.
 */

import {
  calculateIntensity,
  calculateConfidence,
  detectCrisis,
  detectDimensions,
  detectNervousSystemState,
  detectPartsWork,
  extractThemes,
  getStageIndex,
  isEarlierStage,
} from '../lib/classification-utils';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected true');
  }
}

function assertContains(arr: string[], item: string, message?: string) {
  if (!arr.includes(item)) {
    throw new Error(message || `Expected array to contain "${item}"`);
  }
}

// =============================================================================
// DEVELOPMENTAL STAGES
// =============================================================================

console.log('\n=== Developmental Stages ===\n');

test('getStageIndex returns correct order', () => {
  assertEqual(getStageIndex('collapse'), 0);
  assertEqual(getStageIndex('regulation'), 1);
  assertEqual(getStageIndex('integration'), 2);
  assertEqual(getStageIndex('embodiment'), 3);
  assertEqual(getStageIndex('optimization'), 4);
});

test('isEarlierStage compares correctly', () => {
  assertTrue(isEarlierStage('collapse', 'regulation'));
  assertTrue(isEarlierStage('regulation', 'integration'));
  assertTrue(!isEarlierStage('embodiment', 'regulation'));
  assertTrue(!isEarlierStage('integration', 'integration'));
});

// =============================================================================
// INTENSITY LEVELS
// =============================================================================

console.log('\n=== Intensity Levels ===\n');

test('calculateIntensity returns correct levels', () => {
  assertEqual(calculateIntensity(0), 'low');
  assertEqual(calculateIntensity(2), 'low');
  assertEqual(calculateIntensity(3), 'moderate');
  assertEqual(calculateIntensity(5), 'high');
  assertEqual(calculateIntensity(8), 'extreme');
  assertEqual(calculateIntensity(10), 'extreme');
});

test('calculateIntensity respects custom thresholds', () => {
  assertEqual(calculateIntensity(3, { moderate: 5 }), 'low');
  assertEqual(calculateIntensity(6, { high: 7 }), 'moderate');
});

// =============================================================================
// CONFIDENCE SCORING
// =============================================================================

console.log('\n=== Confidence Scoring ===\n');

test('calculateConfidence returns correct values', () => {
  const conf1 = calculateConfidence(0, 10);
  assertEqual(conf1.value, 0);
  assertEqual(conf1.level, 'low');

  const conf2 = calculateConfidence(5, 10);
  assertEqual(conf2.value, 0.5);
  assertEqual(conf2.level, 'medium');

  const conf3 = calculateConfidence(8, 10);
  assertTrue(conf3.value >= 0.7);
  assertEqual(conf3.level, 'high');
});

test('calculateConfidence caps at 1', () => {
  const conf = calculateConfidence(15, 10);
  assertEqual(conf.value, 1);
});

// =============================================================================
// CRISIS DETECTION
// =============================================================================

console.log('\n=== Crisis Detection ===\n');

test('detectCrisis identifies suicidal ideation', () => {
  const crisis = detectCrisis("I want to kill myself");
  assertTrue(crisis.hasCrisisIndicators);
  assertEqual(crisis.severity, 'critical');
  assertContains(crisis.indicators, 'suicidal_ideation');
  assertEqual(crisis.recommendedAction, 'crisis_intervention');
});

test('detectCrisis identifies self-harm', () => {
  const crisis = detectCrisis("I've been cutting myself again");
  assertTrue(crisis.hasCrisisIndicators);
  assertEqual(crisis.severity, 'severe');
  assertContains(crisis.indicators, 'self_harm');
});

test('detectCrisis identifies severe distress', () => {
  const crisis = detectCrisis("I can't take it anymore, I'm at my breaking point");
  assertTrue(crisis.hasCrisisIndicators);
  assertEqual(crisis.severity, 'moderate');
  assertContains(crisis.indicators, 'severe_distress');
});

test('detectCrisis identifies dissociation', () => {
  const crisis = detectCrisis("Nothing feels real, I feel like I'm watching myself from outside");
  assertTrue(crisis.hasCrisisIndicators);
  assertContains(crisis.indicators, 'dissociation');
});

test('detectCrisis identifies abuse', () => {
  const crisis = detectCrisis("Someone is hurting me, I'm not safe at home");
  assertTrue(crisis.hasCrisisIndicators);
  assertEqual(crisis.severity, 'critical');
  assertContains(crisis.indicators, 'abuse_indicators');
});

test('detectCrisis returns none for safe content', () => {
  const crisis = detectCrisis("I had a good day at work and enjoyed my lunch");
  assertTrue(!crisis.hasCrisisIndicators);
  assertEqual(crisis.severity, 'none');
  assertEqual(crisis.recommendedAction, 'none');
});

// =============================================================================
// DIMENSION DETECTION
// =============================================================================

console.log('\n=== Dimension Detection ===\n');

test('detectDimensions finds emotional-regulation', () => {
  const dims = detectDimensions("I'm struggling with managing my emotions and feeling overwhelmed");
  const found = dims.find(d => d.dimensionId === 'emotional-regulation');
  assertTrue(found !== undefined, 'Should find emotional-regulation');
  assertEqual(found?.pillarId, 'mind');
});

test('detectDimensions finds nervous-system', () => {
  const dims = detectDimensions("My nervous system feels dysregulated, I'm in fight or flight");
  const found = dims.find(d => d.dimensionId === 'nervous-system');
  assertTrue(found !== undefined, 'Should find nervous-system');
  assertEqual(found?.pillarId, 'body');
});

test('detectDimensions finds attachment-patterns', () => {
  const dims = detectDimensions("I have anxious attachment and fear of abandonment");
  const found = dims.find(d => d.dimensionId === 'attachment-patterns');
  assertTrue(found !== undefined, 'Should find attachment-patterns');
  assertEqual(found?.pillarId, 'relationships');
});

test('detectDimensions finds meaning-purpose', () => {
  const dims = detectDimensions("I'm searching for my purpose and calling in life");
  const found = dims.find(d => d.dimensionId === 'meaning-purpose');
  assertTrue(found !== undefined, 'Should find meaning-purpose');
  assertEqual(found?.pillarId, 'soul');
});

test('detectDimensions respects limit', () => {
  const dims = detectDimensions("Emotions, nervous system, attachment, meaning, boundaries", 2);
  assertTrue(dims.length <= 2, 'Should respect limit');
});

// =============================================================================
// NERVOUS SYSTEM STATE
// =============================================================================

console.log('\n=== Nervous System State ===\n');

test('detectNervousSystemState identifies ventral', () => {
  const ns = detectNervousSystemState("I feel calm, peaceful, grounded and connected");
  assertEqual(ns.state, 'ventral');
  assertTrue(ns.ventral > 0);
});

test('detectNervousSystemState identifies sympathetic', () => {
  const ns = detectNervousSystemState("I'm racing, panicking, can't relax, on edge and wired");
  assertEqual(ns.state, 'sympathetic');
  assertTrue(ns.sympathetic > 0);
});

test('detectNervousSystemState identifies dorsal', () => {
  const ns = detectNervousSystemState("I feel shutdown, collapsed, frozen, numb and disconnected");
  assertEqual(ns.state, 'dorsal');
  assertTrue(ns.dorsal > 0);
});

test('detectNervousSystemState identifies mixed', () => {
  const ns = detectNervousSystemState("I'm racing but also feel frozen and numb");
  assertTrue(ns.sympathetic > 0);
  assertTrue(ns.dorsal > 0);
});

// =============================================================================
// PARTS WORK DETECTION
// =============================================================================

console.log('\n=== Parts Work Detection ===\n');

test('detectPartsWork identifies inner critic', () => {
  const parts = detectPartsWork("My inner critic is so harsh, always judging me");
  assertTrue(parts.hasPartsLanguage);
  assertTrue(parts.protectorIndicators);
  assertContains(parts.suggestedParts, 'Inner Critic');
});

test('detectPartsWork identifies inner child', () => {
  const parts = detectPartsWork("My inner child feels wounded and abandoned");
  assertTrue(parts.hasPartsLanguage);
  assertTrue(parts.exileIndicators);
  assertContains(parts.suggestedParts, 'Inner Child');
});

test('detectPartsWork identifies people-pleaser', () => {
  const parts = detectPartsWork("I'm such a people-pleaser and caretaker");
  assertTrue(parts.protectorIndicators);
  assertContains(parts.suggestedParts, 'People-Pleaser');
});

test('detectPartsWork identifies Self energy', () => {
  const parts = detectPartsWork("I'm feeling curious and compassionate, just witnessing");
  assertTrue(parts.selfEnergyIndicators);
});

test('detectPartsWork handles no parts language', () => {
  const parts = detectPartsWork("I went to the store and bought groceries");
  assertTrue(!parts.hasPartsLanguage);
  assertEqual(parts.suggestedParts.length, 0);
});

// =============================================================================
// THEME EXTRACTION
// =============================================================================

console.log('\n=== Theme Extraction ===\n');

test('extractThemes finds relationships', () => {
  const themes = extractThemes("My relationship with my partner is struggling, love is hard");
  const found = themes.find(t => t.theme === 'relationships');
  assertTrue(found !== undefined);
});

test('extractThemes finds anxiety', () => {
  const themes = extractThemes("I'm feeling anxious and worried about everything");
  const found = themes.find(t => t.theme === 'anxiety');
  assertTrue(found !== undefined);
});

test('extractThemes finds family', () => {
  const themes = extractThemes("Issues with my mother from childhood keep coming up");
  const found = themes.find(t => t.theme === 'family');
  assertTrue(found !== undefined);
});

test('extractThemes finds grief', () => {
  const themes = extractThemes("I'm mourning the loss, still grieving and missing them");
  const found = themes.find(t => t.theme === 'grief');
  assertTrue(found !== undefined);
});

test('extractThemes respects limit', () => {
  const themes = extractThemes("relationships, work, anxiety, family, grief, meaning", 3);
  assertTrue(themes.length <= 3);
});

// =============================================================================
// RESULTS
// =============================================================================

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}
