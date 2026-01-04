/**
 * Test Synthesis Classification System
 *
 * Tests the new professional synthesis analysis features:
 * - Cross-assessment pattern detection
 * - Developmental stage determination
 * - Integration priority generation
 * - Strength and blind spot identification
 */

import {
  classifySynthesis,
  detectPatterns,
  determineDevelopmentalStage,
  generateIntegrationPriorities,
  identifyStrengths,
  identifyBlindSpots,
  STAGE_GUIDANCE,
  APPROACH_PROMPTS,
} from '../lib/synthesis-analysis';
import type { ArchetypeData, AttachmentData, NervousSystemData } from '../lib/insights';

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

console.log('\n🔮 SYNTHESIS CLASSIFICATION TESTS\n');
console.log('='.repeat(50));

// Sample assessment data
const woundedWarrior: ArchetypeData = {
  primaryArchetype: 'Warrior',
  secondaryArchetype: 'King',
  gender: 'masculine',
  isWounded: true,
  isIntegrated: false,
};

const anxiousAttachment: AttachmentData = {
  style: 'anxious',
  styleName: 'Anxious-Preoccupied',
  anxietyPercent: 75,
  avoidancePercent: 20,
};

const avoidantAttachment: AttachmentData = {
  style: 'avoidant',
  styleName: 'Dismissive-Avoidant',
  anxietyPercent: 20,
  avoidancePercent: 80,
};

const disorganizedAttachment: AttachmentData = {
  style: 'disorganized',
  styleName: 'Fearful-Avoidant',
  anxietyPercent: 70,
  avoidancePercent: 70,
};

const secureAttachment: AttachmentData = {
  style: 'secure',
  styleName: 'Secure',
  anxietyPercent: 20,
  avoidancePercent: 20,
};

const sympatheticNS: NervousSystemData = {
  state: 'sympathetic',
  stateName: 'Fight/Flight',
  counts: { ventral: 3, sympathetic: 12, dorsal: 2 },
};

const dorsalNS: NervousSystemData = {
  state: 'dorsal',
  stateName: 'Shutdown',
  counts: { ventral: 2, sympathetic: 3, dorsal: 15 },
};

const ventralNS: NervousSystemData = {
  state: 'ventral',
  stateName: 'Social Engagement',
  counts: { ventral: 15, sympathetic: 3, dorsal: 2 },
};

// Test 1: Pattern Detection - Armored Warrior
console.log('\n## Pattern Detection\n');

const armoredWarriorPatterns = detectPatterns(woundedWarrior, avoidantAttachment, sympatheticNS);
test('Detects Armored Warrior pattern', 'true', String(armoredWarriorPatterns.some(p => p.pattern === 'Armored Warrior')));

// Test 2: Pattern Detection - Hypervigilant Relating
const hypervigilantPatterns = detectPatterns(null, anxiousAttachment, sympatheticNS);
test('Detects Hypervigilant Relating', 'true', String(hypervigilantPatterns.some(p => p.pattern === 'Hypervigilant Relating')));

// Test 3: Pattern Detection - Active Shadow
const shadowPatterns = detectPatterns(woundedWarrior, null, null);
test('Detects Active Shadow Material', 'true', String(shadowPatterns.some(p => p.pattern === 'Active Shadow Material')));

// Test 4: Developmental Stage - Collapse
console.log('\n## Developmental Stage Detection\n');

const collapseStage = determineDevelopmentalStage(null, disorganizedAttachment, dorsalNS);
test('Dorsal + Disorganized = Collapse', 'collapse', collapseStage);

// Test 5: Developmental Stage - Regulation
const regulationStage = determineDevelopmentalStage(null, anxiousAttachment, sympatheticNS);
test('Anxious + Sympathetic = Regulation', 'regulation', regulationStage);

// Test 6: Developmental Stage - Integration
const integrationStage = determineDevelopmentalStage(woundedWarrior, avoidantAttachment, ventralNS);
test('Wounded archetype = Integration', 'integration', integrationStage);

// Test 7: Developmental Stage - Embodiment
const integratedArchetype: ArchetypeData = {
  primaryArchetype: 'King',
  gender: 'masculine',
  isWounded: false,
  isIntegrated: true,
};
const embodimentStage = determineDevelopmentalStage(integratedArchetype, secureAttachment, ventralNS);
test('Integrated + Secure = Embodiment', 'embodiment', embodimentStage);

// Test 8: Integration Priorities
console.log('\n## Integration Priorities\n');

const dorsalPriorities = generateIntegrationPriorities(null, null, dorsalNS, []);
test('Dorsal generates NS priority', 'true', String(dorsalPriorities.some(p => p.area === 'Nervous System Regulation')));
test('Dorsal NS priority is immediate', 'immediate', dorsalPriorities.find(p => p.area === 'Nervous System Regulation')?.urgency || 'not found');

const disorganizedPriorities = generateIntegrationPriorities(null, disorganizedAttachment, null, []);
test('Disorganized generates attachment priority', 'true', String(disorganizedPriorities.some(p => p.area === 'Attachment Healing')));

const shadowPriorities = generateIntegrationPriorities(woundedWarrior, null, null, []);
test('Wounded archetype generates shadow priority', 'true', String(shadowPriorities.some(p => p.area.includes('Shadow'))));

// Test 9: Strengths Identification
console.log('\n## Strengths Identification\n');

const secureStrengths = identifyStrengths(null, secureAttachment, ventralNS);
test('Identifies secure attachment strength', 'true', String(secureStrengths.some(s => s.toLowerCase().includes('secure'))));
test('Identifies regulated NS strength', 'true', String(secureStrengths.some(s => s.toLowerCase().includes('regulated'))));

const warriorStrengths = identifyStrengths(woundedWarrior, null, null);
test('Identifies archetype capacity', 'true', String(warriorStrengths.some(s => s.toLowerCase().includes('discipline') || s.toLowerCase().includes('boundar'))));

// Test 10: Blind Spots Identification
console.log('\n## Blind Spots Identification\n');

const avoidantBlindSpots = identifyBlindSpots(null, avoidantAttachment, null);
test('Identifies avoidant blind spot', 'true', String(avoidantBlindSpots.some(b => b.toLowerCase().includes('dismiss'))));

const shadowBlindSpots = identifyBlindSpots(woundedWarrior, null, null);
test('Identifies shadow blind spot', 'true', String(shadowBlindSpots.some(b => b.toLowerCase().includes('shadow'))));

// Test 11: Full Classification
console.log('\n## Full Classification\n');

const fullClassification = classifySynthesis(woundedWarrior, anxiousAttachment, sympatheticNS);
test('Classification has stage', 'true', String(!!fullClassification.overallStage));
test('Classification has approach', 'true', String(!!fullClassification.suggestedApproach));
test('Classification has patterns', 'true', String(fullClassification.patterns.length > 0));
test('Classification has priorities', 'true', String(fullClassification.priorities.length > 0));

// Test 12: Classification Flags
console.log('\n## Classification Flags\n');

const collapseClassification = classifySynthesis(null, disorganizedAttachment, dorsalNS);
test('Collapse sets needsStabilization flag', 'true', String(collapseClassification.flags.needsStabilization));

const shadowClassification = classifySynthesis(woundedWarrior, null, sympatheticNS);
test('Shadow + dysregulation sets shadowEmergency', 'true', String(shadowClassification.flags.shadowEmergency));

// Test 13: Stage Guidance Exists
console.log('\n## Stage Guidance\n');

test('Collapse guidance exists', 'true', String(!!STAGE_GUIDANCE.collapse));
test('Regulation guidance exists', 'true', String(!!STAGE_GUIDANCE.regulation));
test('Integration guidance exists', 'true', String(!!STAGE_GUIDANCE.integration));
test('Embodiment guidance exists', 'true', String(!!STAGE_GUIDANCE.embodiment));
test('Optimization guidance exists', 'true', String(!!STAGE_GUIDANCE.optimization));

testIncludes('Collapse mentions safety', STAGE_GUIDANCE.collapse, 'safety');
testIncludes('Integration mentions shadow', STAGE_GUIDANCE.integration, 'shadow');

// Test 14: Approach Prompts Exist
console.log('\n## Approach Prompts\n');

test('Stabilize prompt exists', 'true', String(!!APPROACH_PROMPTS.stabilize));
test('Explore prompt exists', 'true', String(!!APPROACH_PROMPTS.explore));
test('Integrate prompt exists', 'true', String(!!APPROACH_PROMPTS.integrate));
test('Embody prompt exists', 'true', String(!!APPROACH_PROMPTS.embody));
test('Challenge prompt exists', 'true', String(!!APPROACH_PROMPTS.challenge));

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);

if (percentage === 100) {
  console.log('\n✅ All synthesis classification tests passed!');
} else {
  console.log('\n❌ Some tests failed:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - ${r.name}`);
  });
}

console.log('\n');
