/**
 * Test Dream Classification System
 *
 * Tests the new professional dream analysis features:
 * - Dream type classification
 * - Trauma detection
 * - Cultural context handling
 * - Active imagination prompts
 */

import {
  classifyDream,
  generateActiveImaginationPrompts,
  getEnhancedSymbol,
  CULTURAL_CONTEXT_PROMPTS,
  type DreamType,
} from '../lib/dream-analysis';

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

console.log('\n🌙 DREAM CLASSIFICATION TESTS\n');
console.log('='.repeat(50));

// Test 1: Nightmare detection
console.log('\n## Nightmare/Trauma Detection\n');

const nightmare1 = classifyDream(
  "I was being chased through a dark forest. I couldn't run fast enough. A dark figure was right behind me. I tried to scream but no voice came out.",
  ['terror', 'fear'],
  false,
  false
);
test('Nightmare detection - chase dream', 'nightmare', nightmare1.primaryType);
test('Trauma indicators flag', 'true', String(nightmare1.flags.traumaIndicators));
test('Intensity level', 'extreme', nightmare1.intensityLevel);

const nightmare2 = classifyDream(
  "I was drowning and couldn't breathe. People watched but wouldn't help. I felt paralyzed.",
  ['panic', 'helpless'],
  false,
  false
);
test('Nightmare detection - drowning', 'nightmare', nightmare2.primaryType);

// Test 2: Numinous dream detection
console.log('\n## Numinous/Spiritual Detection\n');

const numinous1 = classifyDream(
  "I was bathed in golden light. A wise old woman appeared and spoke words I couldn't understand but felt deeply true. I woke up feeling transformed.",
  ['awe', 'peace'],
  false,
  false
);
test('Numinous detection - light/guide', 'numinous', numinous1.primaryType);
test('Spiritual content flag', 'true', String(numinous1.flags.spiritualContent));

// Test 3: Processing/mundane detection
console.log('\n## Processing/Mundane Detection\n');

const processing1 = classifyDream(
  "I dreamed I was at work answering emails. My coworker asked about a meeting. Normal office stuff.",
  [],
  false,
  false
);
test('Processing detection - work dream', 'processing', processing1.primaryType);
test('Moderate or low intensity', 'true', String(['low', 'moderate'].includes(processing1.intensityLevel)));

// Test 4: Recurring dream handling
console.log('\n## Recurring Dream Handling\n');

const recurring1 = classifyDream(
  "I'm back in my childhood house. There's always a room I forgot existed.",
  ['curious'],
  true, // recurring
  false
);
test('Recurring flag respected', 'recurring', recurring1.primaryType);

// Test 5: Lucid dream handling
console.log('\n## Lucid Dream Handling\n');

const lucid1 = classifyDream(
  "I realized I was dreaming and decided to fly. I flew over mountains and felt free.",
  ['joy', 'free'],
  false,
  true // lucid
);
test('Lucid flag respected', 'lucid', lucid1.primaryType);

// Test 6: Visitation dream
console.log('\n## Visitation Dream Detection\n');

const visitation1 = classifyDream(
  "My grandmother who died last year came to me. She looked healthy and happy. She told me she was okay.",
  ['love', 'sadness'],
  false,
  false
);
test('Visitation detection', 'visitation', visitation1.primaryType);

// Test 7: Anxiety dream
console.log('\n## Anxiety Dream Detection\n');

const anxiety1 = classifyDream(
  "I was late for an exam. I couldn't find the room. I realized I hadn't studied all semester. I was naked.",
  ['anxiety', 'embarrassed'],
  false,
  false
);
test('Anxiety detection', 'anxiety', anxiety1.primaryType);

// Test 8: Somatic dream
console.log('\n## Somatic Dream Detection\n');

const somatic1 = classifyDream(
  "I felt pain in my chest. My body was heavy. I could feel my heart racing even in the dream.",
  ['fear'],
  false,
  false
);
test('Somatic content flag', 'true', String(somatic1.flags.somaticContent));

// Test 9: Active Imagination Prompts
console.log('\n## Active Imagination Prompts\n');

const dreamWithFigure = "A strange man in a hat stood at my door. He didn't speak but I felt he had a message.";
const classification = classifyDream(dreamWithFigure, ['curious'], false, false);
const prompts = generateActiveImaginationPrompts(dreamWithFigure, classification);

test('Generates prompts', 'true', String(prompts.length > 0));
if (prompts.length > 0) {
  test('Prompt has guidance', 'true', String(!!prompts[0].guidance));
}

// Test 10: No prompts for trauma
const traumaDream = classifyDream(
  "I was attacked. Blood everywhere. I couldn't escape.",
  ['terror'],
  false,
  false
);
const traumaPrompts = generateActiveImaginationPrompts(
  "I was attacked. Blood everywhere.",
  traumaDream
);
test('Limited prompts for trauma', 'true', String(traumaPrompts.length <= 1));
if (traumaPrompts.length > 0) {
  test('Trauma prompt is grounding', 'embodiment', traumaPrompts[0].type);
}

// Test 11: Enhanced Symbol Dictionary
console.log('\n## Enhanced Symbol Dictionary\n');

const waterSymbol = getEnhancedSymbol('water');
test('Water symbol found', 'true', String(!!waterSymbol));
if (waterSymbol) {
  test('Has Jungian perspective', 'true', String(!!waterSymbol.jungianPerspective));
  test('Has questions', 'true', String(waterSymbol.questions.length > 0));
}

const snakeSymbol = getEnhancedSymbol('snake');
test('Snake symbol found', 'true', String(!!snakeSymbol));

const unknownSymbol = getEnhancedSymbol('xyzzy');
test('Unknown symbol returns null', 'true', String(unknownSymbol === null));

// Test 12: Cultural Context Prompts
console.log('\n## Cultural Context Prompts\n');

test('Western secular exists', 'true', String(!!CULTURAL_CONTEXT_PROMPTS['western-secular']));
test('Islamic exists', 'true', String(!!CULTURAL_CONTEXT_PROMPTS['islamic']));
test('Buddhist exists', 'true', String(!!CULTURAL_CONTEXT_PROMPTS['buddhist']));
test('Indigenous exists', 'true', String(!!CULTURAL_CONTEXT_PROMPTS['indigenous']));

testIncludes('Islamic mentions ta\'bir', CULTURAL_CONTEXT_PROMPTS['islamic'], 'ta\'bir');
testIncludes('Buddhist mentions sankhara', CULTURAL_CONTEXT_PROMPTS['buddhist'], 'sankhara');

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} (${percentage}%)`);

if (percentage === 100) {
  console.log('\n✅ All dream classification tests passed!');
} else {
  console.log('\n❌ Some tests failed:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - ${r.name}`);
  });
}

console.log('\n');
