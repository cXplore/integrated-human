/**
 * Test Somatic Classification System
 *
 * Tests the new somatic/body companion features:
 * - State classification
 * - Window of tolerance detection
 * - Body region identification
 * - Approach selection
 */

import {
  classifySomaticState,
  generateBodyPrompts,
  SOMATIC_APPROACHES,
} from '../lib/somatic-analysis';

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

console.log('\n🫀 SOMATIC CLASSIFICATION TESTS\n');
console.log('='.repeat(50));

// Test 1: Activation detection
console.log('\n## Activation State Detection\n');

const activated1 = classifySomaticState(
  "My heart is racing. I can't sit still. I feel shaky and sweaty. My muscles are so tense."
);
test('Detects activated state', 'activated', activated1.primaryState);
test('Hyper window', 'hyper', activated1.window);

// Test 2: Collapse detection
console.log('\n## Collapse State Detection\n');

const collapsed1 = classifySomaticState(
  "I feel so heavy. I can't move. Everything is foggy and slow. I'm exhausted and numb."
);
test('Detects collapsed state', 'collapsed', collapsed1.primaryState);
test('Hypo window', 'hypo', collapsed1.window);
test('Suggests resourcing', 'resource', collapsed1.suggestedApproach);

// Test 3: Dissociation detection
console.log('\n## Dissociation Detection\n');

const dissociated1 = classifySomaticState(
  "I feel like I'm watching myself from outside. I'm floating and detached. Can't feel my body."
);
test('Detects dissociated state', 'dissociated', dissociated1.primaryState);
test('Dissociation risk flag', 'true', String(dissociated1.flags.dissociationRisk));
test('Suggests grounding', 'ground', dissociated1.suggestedApproach);

// Test 4: Flooding detection
console.log('\n## Flooding Detection\n');

const flooded1 = classifySomaticState(
  "I'm overwhelmed. It's too much. Waves of intense sensation. I feel like I'm drowning and losing control."
);
test('Detects flooded state', 'flooded', flooded1.primaryState);
test('Flooding risk flag', 'true', String(flooded1.flags.floodingRisk));
test('Suggests containment', 'contain', flooded1.suggestedApproach);
test('Extreme intensity', 'extreme', flooded1.intensityLevel);

// Test 5: Armored detection
console.log('\n## Armored State Detection\n');

const armored1 = classifySomaticState(
  "I've had this tension for years. I'm always bracing and holding. I can't let it go. It's like armor."
);
test('Detects armored state', 'armored', armored1.primaryState);
test('Chronic pattern flag', 'true', String(armored1.flags.chronicPattern));
test('Suggests titration', 'titrate', armored1.suggestedApproach);

// Test 6: Body region detection
console.log('\n## Body Region Detection\n');

const regions1 = classifySomaticState(
  "I have tension in my shoulders and chest. My throat feels tight and there's a knot in my stomach."
);
test('Detects shoulder region', 'true', String(regions1.affectedRegions.includes('shoulders')));
test('Detects chest region', 'true', String(regions1.affectedRegions.includes('chest')));
test('Detects throat region', 'true', String(regions1.affectedRegions.includes('throat')));
test('Detects stomach region', 'true', String(regions1.affectedRegions.includes('stomach')));

// Test 7: Sensation detection
console.log('\n## Sensation Detection\n');

const sensations1 = classifySomaticState(
  "I feel tingling in my hands. There's a heavy pressure on my chest and some warmth spreading."
);
test('Detects tingling', 'true', String(sensations1.dominantSensations.includes('tingling')));
test('Detects pressure', 'true', String(sensations1.dominantSensations.includes('pressure')));
test('Detects heaviness', 'true', String(sensations1.dominantSensations.includes('heaviness')));
test('Detects warmth', 'true', String(sensations1.dominantSensations.includes('warmth')));

// Test 8: Trauma indicators
console.log('\n## Trauma Indicators\n');

const trauma1 = classifySomaticState(
  "I feel like my body remembers. This is a trauma response. I'm freezing and triggered."
);
test('Trauma indicators flag', 'true', String(trauma1.flags.traumaIndicators));

// Test 9: Professional referral
const professional1 = classifySomaticState(
  "I'm dissociating and can't feel anything. The abuse trauma is overwhelming. I'm detached and blank."
);
test('Needs professional flag', 'true', String(professional1.flags.needsProfessional));

// Test 10: Mixed states
console.log('\n## Mixed States\n');

const mixed1 = classifySomaticState(
  "I alternate between panic and shutdown. Racing heart then complete numbness. I'm both wired and exhausted."
);
test('Detects mixed state', 'mixed', mixed1.primaryState);

// Test 11: Body prompts generation
console.log('\n## Body Prompts\n');

const prompts1 = generateBodyPrompts(classifySomaticState("My chest feels tight and my heart is racing"));
test('Generates prompts', 'true', String(prompts1.length > 0));
if (prompts1.length > 0) {
  test('Prompt has purpose', 'true', String(!!prompts1[0].purpose));
}

// Test 12: Approach existence
console.log('\n## Approach Definitions\n');

test('Ground approach exists', 'true', String(!!SOMATIC_APPROACHES.ground));
test('Resource approach exists', 'true', String(!!SOMATIC_APPROACHES.resource));
test('Titrate approach exists', 'true', String(!!SOMATIC_APPROACHES.titrate));
test('Discharge approach exists', 'true', String(!!SOMATIC_APPROACHES.discharge));
test('Contain approach exists', 'true', String(!!SOMATIC_APPROACHES.contain));
test('Explore approach exists', 'true', String(!!SOMATIC_APPROACHES.explore));

// Test 13: Approach has techniques
test('Ground has techniques', 'true', String(SOMATIC_APPROACHES.ground.techniques.length > 0));
test('Ground has avoid list', 'true', String(SOMATIC_APPROACHES.ground.avoid.length > 0));

// Test 14: Grounded state (default)
console.log('\n## Grounded State\n');

const grounded1 = classifySomaticState(
  "I'm feeling pretty calm. My body is okay. Just curious about what I'm noticing."
);
test('Default to grounded', 'grounded', grounded1.primaryState);
test('Suggests exploration', 'explore', grounded1.suggestedApproach);
test('Within window', 'within', grounded1.window);

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);

if (percentage === 100) {
  console.log('\n✅ All somatic classification tests passed!');
} else {
  console.log('\n❌ Some tests failed:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - ${r.name}`);
  });
}

console.log('\n');
