/**
 * Test Stuck Classification System
 *
 * Tests the new professional stuckness analysis features:
 * - Type classification
 * - Intensity detection
 * - Nervous system state
 * - Part explorations
 * - Protective function detection
 */

import {
  classifyStuckness,
  generatePartExplorations,
  extractStuckTheme,
  APPROACH_PROFILES,
  STAGE_GUIDANCE,
  type DevelopmentalStage,
} from '../lib/stuck-analysis';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];

function test(name: string, expected: string, actual: string): void {
  const passed = expected === actual;
  results.push({ name, passed, expected, actual });
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) {
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
  }
}

function testIncludes(name: string, text: string, substring: string): void {
  const passed = text.toLowerCase().includes(substring.toLowerCase());
  results.push({ name, passed, expected: `includes "${substring}"`, actual: text.slice(0, 100) });
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) {
    console.log(`   Expected to include: ${substring}`);
    console.log(`   Actual: ${text.slice(0, 100)}...`);
  }
}

console.log('\n🔒 STUCK CLASSIFICATION TESTS\n');
console.log('='.repeat(50));

// Test 1: Behavioral stuckness
console.log('\n## Behavioral Stuckness Detection\n');

const behavioral1 = classifyStuckness(
  "I keep procrastinating even though I know what I need to do. I can't stop scrolling on my phone. It's a pattern I can't break - I've tried everything and nothing works.",
  'integration'
);
test('Behavioral detection - procrastination', 'behavioral', behavioral1.primaryType);
test('Chronic pattern flag', 'true', String(behavioral1.flags.chronicPattern));

// Test 2: Emotional stuckness
console.log('\n## Emotional Stuckness Detection\n');

const emotional1 = classifyStuckness(
  "I feel so anxious all the time. The worry is overwhelming. I can't shake this sense of dread. It's been like this for years.",
  'regulation'
);
test('Emotional detection - anxiety', 'emotional', emotional1.primaryType);
test('Moderate+ intensity', 'true', String(['moderate', 'severe', 'crisis'].includes(emotional1.intensity)));

const emotional2 = classifyStuckness(
  "I'm stuck in grief. I miss my mother so much. The emptiness won't go away.",
  'integration'
);
test('Emotional detection - grief', 'emotional', emotional2.primaryType);

// Test 3: Cognitive stuckness
console.log('\n## Cognitive Stuckness Detection\n');

const cognitive1 = classifyStuckness(
  "I can't stop overthinking everything. I ruminate about decisions for days. Analysis paralysis.",
  'integration'
);
test('Cognitive detection - overthinking', 'cognitive', cognitive1.primaryType);

// Test 4: Relational stuckness
console.log('\n## Relational Stuckness Detection\n');

const relational1 = classifyStuckness(
  "My relationship is falling apart. I'm anxiously attached and my partner is avoidant. We keep having the same conflict.",
  'integration'
);
test('Relational detection - attachment', 'relational', relational1.primaryType);
test('Relational core flag', 'true', String(relational1.flags.relationalCore));

const relational2 = classifyStuckness(
  "I can't set boundaries with my family. I'm always people pleasing and then I feel resentful.",
  'integration'
);
test('Relational detection - boundaries', 'relational', relational2.primaryType);

// Test 5: Existential stuckness
console.log('\n## Existential Stuckness Detection\n');

const existential1 = classifyStuckness(
  "I don't know who I am anymore. What's my purpose? Life feels meaningless and I've lost my direction.",
  'integration'
);
test('Existential detection - meaning', 'existential', existential1.primaryType);

// Test 6: Somatic stuckness
console.log('\n## Somatic Stuckness Detection\n');

const somatic1 = classifyStuckness(
  "I feel frozen. My body won't move. There's chronic tension in my chest and I can't take a full breath.",
  'regulation'
);
test('Somatic detection - freeze', 'somatic', somatic1.primaryType);
test('Somatic component flag', 'true', String(somatic1.flags.somaticComponent));
test('Dorsal vagal state', 'dorsal-vagal', somatic1.nervousSystemState);

// Test 7: Crisis detection
console.log('\n## Crisis Detection\n');

const crisis1 = classifyStuckness(
  "I don't want to live anymore. I feel hopeless and like I can't go on.",
  'collapse'
);
test('Crisis indicators flag', 'true', String(crisis1.flags.crisisIndicators));
test('Crisis intensity', 'crisis', crisis1.intensity);
test('Stabilize approach for crisis', 'stabilize', crisis1.suggestedApproach);

// Test 8: Nervous system states
console.log('\n## Nervous System State Detection\n');

const sympathetic1 = classifyStuckness(
  "I'm so agitated and restless. Can't relax. Feel like I need to escape. Heart racing, on edge.",
  'integration'
);
test('Sympathetic state detection', 'sympathetic', sympathetic1.nervousSystemState);

const mixed1 = classifyStuckness(
  "I alternate between panic and shutdown. Racing thoughts then complete numbness. I can't escape but I'm also frozen.",
  'regulation'
);
test('Mixed state detection', 'mixed', mixed1.nervousSystemState);

// Test 9: Protective function detection
console.log('\n## Protective Function Detection\n');

const protective1 = classifyStuckness(
  "I avoid dealing with my emotions because I don't want to feel the pain. I keep myself safe by not going there.",
  'integration'
);
test('Protective function detected', 'true', String(!!protective1.protectiveFunction));
testIncludes('Protection function mentions feelings', protective1.protectiveFunction || '', 'feeling');

// Test 10: Part explorations
console.log('\n## Part Explorations\n');

const partClassification = classifyStuckness(
  "I know I should change but I keep doing the same thing. My inner critic is brutal.",
  'integration'
);
const parts = generatePartExplorations(partClassification, "I know I should change but I keep doing the same thing. My inner critic is brutal.");
test('Generates part explorations', 'true', String(parts.length > 0));
if (parts.length > 0) {
  test('Part has name', 'true', String(!!parts[0].name));
  test('Part has function', 'true', String(!!parts[0].possibleFunction));
  test('Part has question', 'true', String(!!parts[0].gentleQuestion));
}

// Test 11: No parts for crisis
const crisisParts = generatePartExplorations(crisis1, "I don't want to live anymore.");
test('No parts for crisis', 'true', String(crisisParts.length === 0));

// Test 12: Theme extraction
console.log('\n## Theme Extraction\n');

const theme1 = extractStuckTheme("I'm struggling with anxiety about my relationship and setting boundaries");
testIncludes('Theme includes anxiety', theme1, 'anxiety');
testIncludes('Theme includes boundaries', theme1, 'boundaries');

const theme2 = extractStuckTheme("I don't know my purpose in life");
testIncludes('Theme includes meaning', theme2, 'meaning');

// Test 13: Approach profiles exist
console.log('\n## Approach Profiles\n');

test('Stabilize profile exists', 'true', String(!!APPROACH_PROFILES.stabilize));
test('Explore profile exists', 'true', String(!!APPROACH_PROFILES.explore));
test('Challenge profile exists', 'true', String(!!APPROACH_PROFILES.challenge));
test('Integrate profile exists', 'true', String(!!APPROACH_PROFILES.integrate));

// Test 14: Stage guidance exists
console.log('\n## Stage Guidance\n');

test('Collapse guidance exists', 'true', String(!!STAGE_GUIDANCE.collapse));
test('Regulation guidance exists', 'true', String(!!STAGE_GUIDANCE.regulation));
test('Integration guidance exists', 'true', String(!!STAGE_GUIDANCE.integration));
test('Embodiment guidance exists', 'true', String(!!STAGE_GUIDANCE.embodiment));
test('Optimization guidance exists', 'true', String(!!STAGE_GUIDANCE.optimization));

testIncludes('Collapse mentions safety', STAGE_GUIDANCE.collapse, 'safety');
testIncludes('Integration mentions shadow', STAGE_GUIDANCE.integration, 'shadow');

// Test 15: Stage-appropriate approach selection
console.log('\n## Stage-Appropriate Approach\n');

const collapseStuck = classifyStuckness("I'm overwhelmed", 'collapse');
test('Collapse stage uses stabilize', 'stabilize', collapseStuck.suggestedApproach);

const embodimentStuck = classifyStuckness("I'm working on subtle patterns in my life", 'embodiment');
test('Embodiment stage can use challenge', 'true', String(['challenge', 'integrate', 'explore'].includes(embodimentStuck.suggestedApproach)));

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);

if (percentage === 100) {
  console.log('\n✅ All stuck classification tests passed!');
} else {
  console.log('\n❌ Some tests failed:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - ${r.name}`);
  });
}

console.log('\n');
