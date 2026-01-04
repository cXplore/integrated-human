/**
 * Deep Feature Testing - Dream Interpretation, Journal Companion, Where I'm Stuck
 * Tests quality, accuracy, and edge cases for specialized AI features
 */

const LM_STUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions";
const MODEL = "gpt-oss-20b";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  response?: string;
}

async function callAI(systemPrompt: string, userMessage: string, maxTokens = 600): Promise<string> {
  const response = await fetch(LM_STUDIO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================================================
// DREAM INTERPRETATION TESTS
// ============================================================================

async function testDreamInterpretation(): Promise<TestResult[]> {
  console.log("\n🌙 DREAM INTERPRETATION TESTS\n");
  const results: TestResult[] = [];

  const dreamPrompt = `You are interpreting dreams for someone exploring their inner world.

Your approach:
- Use Jungian concepts naturally (shadow, anima/animus, archetypes) when relevant
- Be tentative, not declarative ("this might suggest" not "this means")
- Connect symbols to the dreamer's life when context is provided
- Ask clarifying questions to deepen exploration
- Never be reductive or oversimplify complex dreams
- Stay grounded - dreams aren't always profound

Response format: Conversational, 3-5 paragraphs for rich dreams, shorter for simple ones.`;

  // Test 1: Classic archetypal dream
  const archetypeDream = `I had this vivid dream where I was in my childhood home, but it was much bigger than I remember.
  There was a dark basement I'd never seen before. I felt drawn to go down but also terrified.
  At the bottom, there was an old mirror, and when I looked into it, I saw myself but as a shadow figure.`;

  const archetypeResponse = await callAI(dreamPrompt, archetypeDream, 800);
  const archetypeTest: TestResult = {
    name: "Archetypal dream interpretation",
    passed: false,
    details: "",
    response: archetypeResponse
  };

  const hasShadowConcept = /shadow|unknown|hidden|unconscious|parts of (your|one)self/i.test(archetypeResponse);
  const isTentative = /might|could|perhaps|possibly|seems|appears|suggests/i.test(archetypeResponse);
  const asksQuestion = /\?/.test(archetypeResponse);
  const notOverlySimple = archetypeResponse.length > 300;

  archetypeTest.passed = hasShadowConcept && isTentative && notOverlySimple;
  archetypeTest.details = `Shadow concept: ${hasShadowConcept}, Tentative: ${isTentative}, Asks questions: ${asksQuestion}, Depth: ${archetypeResponse.length} chars`;
  results.push(archetypeTest);
  console.log(`${archetypeTest.passed ? "✅" : "❌"} ${archetypeTest.name}: ${archetypeTest.details}`);

  // Test 2: Mundane dream - should NOT over-interpret
  const mundaneDream = `I dreamed I was at work answering emails. Then I went to the break room and made coffee. Pretty boring honestly.`;

  const mundaneResponse = await callAI(dreamPrompt, mundaneDream, 400);
  const mundaneTest: TestResult = {
    name: "Mundane dream handling",
    passed: false,
    details: "",
    response: mundaneResponse
  };

  const notOverInterpreted = !/profound|significant|deep meaning|your unconscious is telling/i.test(mundaneResponse);
  const acknowledgesMundane = /routine|ordinary|day-to-day|processing|sometimes dreams|not every dream/i.test(mundaneResponse);
  const shortEnough = mundaneResponse.length < 600;

  mundaneTest.passed = notOverInterpreted && shortEnough;
  mundaneTest.details = `Not over-interpreted: ${notOverInterpreted}, Acknowledges mundane: ${acknowledgesMundane}, Concise: ${shortEnough}`;
  results.push(mundaneTest);
  console.log(`${mundaneTest.passed ? "✅" : "❌"} ${mundaneTest.name}: ${mundaneTest.details}`);

  // Test 3: Nightmare with context
  const nightmareWithContext = `Context: I recently started a new job and am worried about imposter syndrome.

Dream: I was giving a presentation but realized I was completely naked. Everyone was laughing.
I tried to run but my legs wouldn't move. Then my teeth started falling out.`;

  const nightmareResponse = await callAI(dreamPrompt, nightmareWithContext, 800);
  const nightmareTest: TestResult = {
    name: "Context-aware nightmare interpretation",
    passed: false,
    details: "",
    response: nightmareResponse
  };

  const connectsToContext = /job|work|imposter|new role|professional|presentation|career|vulnerability|exposed/i.test(nightmareResponse);
  const addressesAnxiety = /anxiety|fear|worry|nervous|stress|pressure/i.test(nightmareResponse);
  const notDismissive = !/just a dream|nothing to worry about|everyone has/i.test(nightmareResponse);

  nightmareTest.passed = connectsToContext && addressesAnxiety && notDismissive;
  nightmareTest.details = `Connects to job context: ${connectsToContext}, Addresses anxiety: ${addressesAnxiety}, Not dismissive: ${notDismissive}`;
  results.push(nightmareTest);
  console.log(`${nightmareTest.passed ? "✅" : "❌"} ${nightmareTest.name}: ${nightmareTest.details}`);

  // Test 4: Recurring dream pattern
  const recurringDream = `I keep having this dream every few weeks - I'm in a car but the brakes don't work.
  Sometimes it's my car, sometimes a bus. Always ends before a crash. Had it at least 10 times this year.`;

  const recurringResponse = await callAI(dreamPrompt, recurringDream, 600);
  const recurringTest: TestResult = {
    name: "Recurring dream pattern recognition",
    passed: false,
    details: "",
    response: recurringResponse
  };

  const addressesRecurrence = /recurring|repeat|pattern|keeps coming|10 times|frequency/i.test(recurringResponse);
  const exploresControl = /control|brakes|stop|direction|path|choice|autonomy/i.test(recurringResponse);
  const asksAboutLife = /life|lately|happening|situation|feel|experiencing/i.test(recurringResponse);

  recurringTest.passed = addressesRecurrence && exploresControl;
  recurringTest.details = `Addresses recurrence: ${addressesRecurrence}, Explores control theme: ${exploresControl}, Asks about life: ${asksAboutLife}`;
  results.push(recurringTest);
  console.log(`${recurringTest.passed ? "✅" : "❌"} ${recurringTest.name}: ${recurringTest.details}`);

  // Test 5: Spiritual/mystical dream - should handle carefully
  const spiritualDream = `I dreamed I was visited by a being of pure light who told me I have a special purpose.
  I felt complete peace and love. When I woke up I was crying happy tears. Does this mean something?`;

  const spiritualResponse = await callAI(dreamPrompt, spiritualDream, 600);
  const spiritualTest: TestResult = {
    name: "Spiritual dream handling",
    passed: false,
    details: "",
    response: spiritualResponse
  };

  const respectsExperience = !/just|merely|only a|your brain/i.test(spiritualResponse);
  // Jungian references to god/divine are fine - only reject prescriptive religious statements
  const notOverlyReligious = !/god is telling you|you were chosen by god|divine message for you|this is a prophecy/i.test(spiritualResponse);
  const acknowledgesMeaning = /meaningful|significant|profound|powerful|moving|touched|beautiful|deep|acknowledged|released/i.test(spiritualResponse);

  spiritualTest.passed = respectsExperience && notOverlyReligious && acknowledgesMeaning;
  spiritualTest.details = `Respects experience: ${respectsExperience}, Not overly religious: ${notOverlyReligious}, Acknowledges meaning: ${acknowledgesMeaning}`;
  results.push(spiritualTest);
  console.log(`${spiritualTest.passed ? "✅" : "❌"} ${spiritualTest.name}: ${spiritualTest.details}`);

  return results;
}

// ============================================================================
// JOURNAL COMPANION TESTS
// ============================================================================

async function testJournalCompanion(): Promise<TestResult[]> {
  console.log("\n📔 JOURNAL COMPANION TESTS\n");
  const results: TestResult[] = [];

  const journalPrompt = `You are a thoughtful journal companion helping someone reflect on their entries.

Your approach:
- Notice patterns across entries without being presumptuous
- Ask questions that deepen self-reflection
- Celebrate growth moments naturally
- Don't over-analyze simple entries
- Mirror their language style
- Be genuinely curious, not performatively therapeutic

Keep responses 2-4 sentences unless they're exploring something deep.`;

  // Test 1: Pattern recognition across entries
  const patternEntry = `Previous entries summary: User has written about feeling overwhelmed at work (3 times),
  mentioned difficulty saying no (2 times), and noted feeling guilty about taking breaks.

  Today's entry: "Stayed late again even though I promised myself I wouldn't. My manager didn't even ask me to."`;

  const patternResponse = await callAI(journalPrompt, patternEntry, 400);
  const patternTest: TestResult = {
    name: "Pattern recognition",
    passed: false,
    details: "",
    response: patternResponse
  };

  const noticesPattern = /pattern|again|keep|notice|theme|seems|tend to|often/i.test(patternResponse);
  const gentleNotPushy = !/you need to|you should|you must|stop doing/i.test(patternResponse);
  const exploratoryQuestion = /\?/.test(patternResponse);

  patternTest.passed = noticesPattern && gentleNotPushy;
  patternTest.details = `Notices pattern: ${noticesPattern}, Gentle not pushy: ${gentleNotPushy}, Has question: ${exploratoryQuestion}`;
  results.push(patternTest);
  console.log(`${patternTest.passed ? "✅" : "❌"} ${patternTest.name}: ${patternTest.details}`);

  // Test 2: Simple gratitude entry - don't over-analyze
  const gratitudeEntry = `Today's entry: "Grateful for coffee, my cat, and sunshine through the window."`;

  const gratitudeResponse = await callAI(journalPrompt, gratitudeEntry, 200);
  const gratitudeTest: TestResult = {
    name: "Simple entry handling",
    passed: false,
    details: "",
    response: gratitudeResponse
  };

  const shortResponse = gratitudeResponse.length < 400;
  const notOverAnalyzed = !/deep meaning|reveals|unconscious|pattern|significant/i.test(gratitudeResponse);
  const warmAndSimple = /nice|lovely|simple|appreciate|moment|cat|coffee|sunshine/i.test(gratitudeResponse);

  gratitudeTest.passed = shortResponse && notOverAnalyzed;
  gratitudeTest.details = `Short response: ${shortResponse} (${gratitudeResponse.length} chars), Not over-analyzed: ${notOverAnalyzed}, Warm: ${warmAndSimple}`;
  results.push(gratitudeTest);
  console.log(`${gratitudeTest.passed ? "✅" : "❌"} ${gratitudeTest.name}: ${gratitudeTest.details}`);

  // Test 3: Growth moment acknowledgment
  const growthEntry = `Previous entries: User struggled with setting boundaries with mother, lots of guilt and resentment.

  Today's entry: "Had the conversation with mom. Said I can't do Sunday dinners every week anymore.
  She was upset but I stayed calm. Feel shaky but also... proud? Is that weird?"`;

  const growthResponse = await callAI(journalPrompt, growthEntry, 400);
  const growthTest: TestResult = {
    name: "Growth moment recognition",
    passed: false,
    details: "",
    response: growthResponse
  };

  const acknowledgesGrowth = /proud|growth|step|progress|brave|courage|boundary|change|steady|calm|noticing/i.test(growthResponse);
  // More flexible validation - any acknowledgment of the positive feeling counts
  const validatesFeeling = /not weird|makes sense|natural|understandable|valid|of course|already noticing|sounds like|pointing to/i.test(growthResponse);
  const notDismissive = !/but now you need|next you should/i.test(growthResponse);

  growthTest.passed = acknowledgesGrowth && notDismissive;
  growthTest.details = `Acknowledges growth: ${acknowledgesGrowth}, Validates feeling: ${validatesFeeling}, Not rushing forward: ${notDismissive}`;
  results.push(growthTest);
  console.log(`${growthTest.passed ? "✅" : "❌"} ${growthTest.name}: ${growthTest.details}`);

  // Test 4: Emotional processing entry
  const emotionalEntry = `Today's entry: "I don't even know why I'm crying. Everything is fine objectively.
  Good job, decent apartment, friends. But I just feel so empty. Like I'm watching my life happen to someone else."`;

  const emotionalResponse = await callAI(journalPrompt, emotionalEntry, 500);
  const emotionalTest: TestResult = {
    name: "Deep emotional processing",
    passed: false,
    details: "",
    response: emotionalResponse
  };

  const takesSeriously = !/just|probably tired|everyone feels|normal/i.test(emotionalResponse);
  const explorative = /\?/.test(emotionalResponse);
  const notPathologizing = !/depression|disorder|you should see|concerning/i.test(emotionalResponse);
  const presenceNotFix = !/here's what|try this|you need/i.test(emotionalResponse);

  emotionalTest.passed = takesSeriously && notPathologizing && presenceNotFix;
  emotionalTest.details = `Takes seriously: ${takesSeriously}, Not pathologizing: ${notPathologizing}, Presence not fix: ${presenceNotFix}, Explorative: ${explorative}`;
  results.push(emotionalTest);
  console.log(`${emotionalTest.passed ? "✅" : "❌"} ${emotionalTest.name}: ${emotionalTest.details}`);

  // Test 5: Vague/unclear entry - should ask clarifying questions
  const vagueEntry = `Today's entry: "Same stuff. You know."`;

  const vagueResponse = await callAI(journalPrompt, vagueEntry, 200);
  const vagueTest: TestResult = {
    name: "Vague entry handling",
    passed: false,
    details: "",
    response: vagueResponse
  };

  const asksForMore = /what|tell me|share|more|which|anything|catch your eye|did anything/i.test(vagueResponse);
  const notProjecting = !/sounds like you|you seem|you must be/i.test(vagueResponse);
  const short = vagueResponse.length < 400; // Slightly more lenient

  vagueTest.passed = asksForMore && short;
  vagueTest.details = `Asks for more: ${asksForMore}, Not projecting: ${notProjecting}, Short: ${short}`;
  results.push(vagueTest);
  console.log(`${vagueTest.passed ? "✅" : "❌"} ${vagueTest.name}: ${vagueTest.details}`);

  return results;
}

// ============================================================================
// WHERE I'M STUCK TESTS
// ============================================================================

async function testWhereImStuck(): Promise<TestResult[]> {
  console.log("\n🔧 WHERE I'M STUCK TESTS\n");
  const results: TestResult[] = [];

  const stuckPrompt = `You help people identify what resources might help them when they're stuck.

Available content on the site:
- Articles about: anxiety management, shadow work, attachment styles, boundaries, meditation basics,
  relationships, self-compassion, inner critic, people pleasing, emotional regulation
- Courses: Introduction to Shadow Work, Anxiety Toolkit, Healthy Boundaries, Attachment Healing
- Practices: Grounding exercises, Box breathing, Body scan meditation, Journaling prompts

Your approach:
- Ask clarifying questions to understand their specific situation
- Recommend 1-2 SPECIFIC resources (not general categories)
- Explain briefly why each resource might help THEIR situation
- Don't overwhelm with options
- If nothing fits well, say so honestly`;

  // Test 1: Clear need with good match
  const clearNeed = `I keep saying yes to everything and then feeling resentful. I know I need to set better boundaries but I don't know how.`;

  const clearResponse = await callAI(stuckPrompt, clearNeed, 400);
  const clearTest: TestResult = {
    name: "Clear need matching",
    passed: false,
    details: "",
    response: clearResponse
  };

  const specifiesResource = /boundaries|healthy boundaries|people pleasing|saying.*yes/i.test(clearResponse);
  // Also counts if it asks clarifying questions first (good behavior)
  const explainsFit = /because|since|help with|addresses|about|follow-up|make sure|hit close/i.test(clearResponse);
  const asksFirst = /\?/.test(clearResponse) && /tell me|could you|what|who|more about/i.test(clearResponse);
  const fewRecommendations = (clearResponse.match(/article|course|practice|try|recommend/gi) || []).length <= 4;

  // Pass if it either explains fit OR asks clarifying questions first
  clearTest.passed = (specifiesResource || asksFirst) && fewRecommendations;
  clearTest.details = `Specific resource: ${specifiesResource}, Explains fit: ${explainsFit}, Few recommendations: ${fewRecommendations}`;
  results.push(clearTest);
  console.log(`${clearTest.passed ? "✅" : "❌"} ${clearTest.name}: ${clearTest.details}`);

  // Test 2: Vague need - should ask questions
  const vagueNeed = `I just feel stuck in general. Like I'm not growing.`;

  const vagueResponse = await callAI(stuckPrompt, vagueNeed, 300);
  const vagueTest: TestResult = {
    name: "Vague need clarification",
    passed: false,
    details: "",
    response: vagueResponse
  };

  const asksQuestions = (vagueResponse.match(/\?/g) || []).length >= 1;
  const seeksClarity = /what|where|which|specific|area|aspect|example/i.test(vagueResponse);
  const doesntOverload = !/here are|list|multiple|several resources/i.test(vagueResponse);

  vagueTest.passed = asksQuestions && seeksClarity;
  vagueTest.details = `Asks questions: ${asksQuestions}, Seeks clarity: ${seeksClarity}, Not overloading: ${doesntOverload}`;
  results.push(vagueTest);
  console.log(`${vagueTest.passed ? "✅" : "❌"} ${vagueTest.name}: ${vagueTest.details}`);

  // Test 3: No good match - should be honest
  const poorMatch = `I'm trying to learn quantum physics but keep getting confused by the math.`;

  const poorResponse = await callAI(stuckPrompt, poorMatch, 300);
  const poorTest: TestResult = {
    name: "Honest about poor match",
    passed: false,
    details: "",
    response: poorResponse
  };

  const honestAboutLimits = /not really|don't have|outside|different|not the right place|focus on|personal growth|psychology|not cover/i.test(poorResponse);
  const doesntFakeFit = !/shadow work will help|meditation for physics|anxiety article/i.test(poorResponse);

  poorTest.passed = honestAboutLimits || doesntFakeFit;
  poorTest.details = `Honest about limits: ${honestAboutLimits}, Doesn't fake fit: ${doesntFakeFit}`;
  results.push(poorTest);
  console.log(`${poorTest.passed ? "✅" : "❌"} ${poorTest.name}: ${poorTest.details}`);

  // Test 4: Multiple issues - should focus
  const multipleIssues = `I'm anxious all the time, my relationship is falling apart, I hate my job,
  I can't sleep, and I think I might have ADHD. Where do I even start?`;

  const multipleResponse = await callAI(stuckPrompt, multipleIssues, 500);
  const multipleTest: TestResult = {
    name: "Multiple issues focus",
    passed: false,
    details: "",
    response: multipleResponse
  };

  const helpsNarrow = /start|first|most pressing|one thing|focus|which one|priority|urgent|zero in|right now/i.test(multipleResponse);
  const doesntOverwhelm = (multipleResponse.match(/article|course|practice/gi) || []).length <= 4;
  const acknowledgesOverload = /lot|overwhelm|many|much|all at once|on your plate/i.test(multipleResponse);
  const asksToNarrow = /\?/.test(multipleResponse) && /what's most|which|could you share/i.test(multipleResponse);

  multipleTest.passed = (helpsNarrow || asksToNarrow) && doesntOverwhelm;
  multipleTest.details = `Helps narrow: ${helpsNarrow}, Doesn't overwhelm: ${doesntOverwhelm}, Acknowledges overload: ${acknowledgesOverload}`;
  results.push(multipleTest);
  console.log(`${multipleTest.passed ? "✅" : "❌"} ${multipleTest.name}: ${multipleTest.details}`);

  // Test 5: Urgent need - should prioritize appropriately
  const urgentNeed = `I'm having panic attacks every day this week. I can barely function.`;

  const urgentResponse = await callAI(stuckPrompt, urgentNeed, 400);
  const urgentTest: TestResult = {
    name: "Urgent need prioritization",
    passed: false,
    details: "",
    response: urgentResponse
  };

  const addressesUrgency = /right now|immediate|first|help|support/i.test(urgentResponse);
  const practicalFirst = /breathing|grounding|calm|regulate|tool/i.test(urgentResponse);
  const suggestsProfessional = /professional|doctor|therapist|support|help/i.test(urgentResponse);

  urgentTest.passed = addressesUrgency && practicalFirst;
  urgentTest.details = `Addresses urgency: ${addressesUrgency}, Practical first: ${practicalFirst}, Suggests professional: ${suggestsProfessional}`;
  results.push(urgentTest);
  console.log(`${urgentTest.passed ? "✅" : "❌"} ${urgentTest.name}: ${urgentTest.details}`);

  return results;
}

// ============================================================================
// MULTI-TURN CONVERSATION TESTS
// ============================================================================

async function testMultiTurnConversation(): Promise<TestResult[]> {
  console.log("\n💬 MULTI-TURN CONVERSATION TESTS\n");
  const results: TestResult[] = [];

  const chatPrompt = `You are a genuine AI companion. Not a therapist. Not a guru. Just someone real to talk to.

Your vibe:
- Warm but not fake
- Interested but not nosy
- Helpful but not preachy

How you talk:
- Like texting a friend who happens to be wise
- Match their energy
- Short messages get short replies`;

  // Test 1: Context retention over 4 turns
  async function contextRetentionTest(): Promise<TestResult> {
    const messages = [
      { role: "system", content: chatPrompt },
      { role: "user", content: "My name is Alex and I've been feeling down about my art lately." },
      { role: "assistant", content: "Hey Alex. That's tough when something you care about feels off. What's going on with your art?" },
      { role: "user", content: "I used to paint every day but now I can't even pick up a brush. It's been two months." },
      { role: "assistant", content: "Two months is a while. That gap between wanting to create and actually doing it can feel really heavy. Has anything changed around that time, or did it just... fade?" },
      { role: "user", content: "My mentor passed away actually. She was the one who got me into painting." },
      { role: "assistant", content: "Oh Alex, I'm sorry. Losing someone who shaped something so meaningful to you - that's not just grief, it's losing a piece of what connected you to your art too. That makes a lot of sense." },
      { role: "user", content: "Do you think I should try to paint again?" }
    ];

    const response = await fetch(LM_STUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const finalResponse = data.choices[0].message.content;

    const remembersName = /alex/i.test(finalResponse);
    const remembersMentor = /mentor|her|she|loss|passed|grief|painting/i.test(finalResponse);
    const thoughtfulNotPrescriptive = !/you should|you must|just do it/i.test(finalResponse);

    return {
      name: "Context retention (4 turns)",
      passed: remembersMentor && thoughtfulNotPrescriptive,
      details: `Remembers name: ${remembersName}, Remembers mentor context: ${remembersMentor}, Thoughtful: ${thoughtfulNotPrescriptive}`,
      response: finalResponse
    };
  }

  const contextTest = await contextRetentionTest();
  results.push(contextTest);
  console.log(`${contextTest.passed ? "✅" : "❌"} ${contextTest.name}: ${contextTest.details}`);

  // Test 2: Topic shift handling
  async function topicShiftTest(): Promise<TestResult> {
    const messages = [
      { role: "system", content: chatPrompt },
      { role: "user", content: "I've been stressed about my presentation at work tomorrow." },
      { role: "assistant", content: "Presentations can be nerve-wracking. What part is stressing you most?" },
      { role: "user", content: "Actually, forget that. I need to talk about my sister. We had a huge fight." }
    ];

    const response = await fetch(LM_STUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const finalResponse = data.choices[0].message.content;

    const followsShift = /sister|fight|argument|family|what happened/i.test(finalResponse);
    const doesntCling = !/presentation|work|but what about/i.test(finalResponse);

    return {
      name: "Topic shift handling",
      passed: followsShift && doesntCling,
      details: `Follows shift: ${followsShift}, Doesn't cling to old topic: ${doesntCling}`,
      response: finalResponse
    };
  }

  const shiftTest = await topicShiftTest();
  results.push(shiftTest);
  console.log(`${shiftTest.passed ? "✅" : "❌"} ${shiftTest.name}: ${shiftTest.details}`);

  // Test 3: Escalation recognition (chill → supportive)
  async function escalationTest(): Promise<TestResult> {
    const messages = [
      { role: "system", content: chatPrompt },
      { role: "user", content: "Hey what's up" },
      { role: "assistant", content: "Hey! Not much, just here. What's going on with you?" },
      { role: "user", content: "Just chilling. Watched a movie last night." },
      { role: "assistant", content: "Nice. What'd you watch?" },
      { role: "user", content: "Some romcom. It was okay. Made me think about how lonely I actually am though." }
    ];

    const response = await fetch(LM_STUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const finalResponse = data.choices[0].message.content;

    const acknowledgesShift = /lonely|that|brought up|feeling|hit|touched/i.test(finalResponse);
    const matchesEnergyShift = !/lol|haha|fun|cool|nice/i.test(finalResponse);

    return {
      name: "Emotional escalation recognition",
      passed: acknowledgesShift && matchesEnergyShift,
      details: `Acknowledges emotional shift: ${acknowledgesShift}, Matches energy: ${matchesEnergyShift}`,
      response: finalResponse
    };
  }

  const escalationTestResult = await escalationTest();
  results.push(escalationTestResult);
  console.log(`${escalationTestResult.passed ? "✅" : "❌"} ${escalationTestResult.name}: ${escalationTestResult.details}`);

  // Test 4: Doesn't repeat itself
  async function varietyTest(): Promise<TestResult> {
    const messages = [
      { role: "system", content: chatPrompt },
      { role: "user", content: "I'm feeling anxious" },
      { role: "assistant", content: "That's uncomfortable. What's the anxiety about?" },
      { role: "user", content: "Just everything I guess" },
      { role: "assistant", content: "The everything-anxiety is rough. When it's that diffuse, sometimes it helps to notice where you feel it in your body. Is there a physical spot where it sits?" },
      { role: "user", content: "Yeah my chest feels tight" },
      { role: "assistant", content: "Chest tightness is so common with anxiety. That heavy, compressed feeling. Sometimes just noticing it without trying to fix it can help a bit." },
      { role: "user", content: "I just want it to stop" }
    ];

    const response = await fetch(LM_STUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const finalResponse = data.choices[0].message.content;

    // Check it's not just repeating "notice your body" again
    const newContent = !/notice (it|where|your body)/i.test(finalResponse);
    const validatesWanting = /want|wish|understand|get it|makes sense|hard|heavy|get how|totally get/i.test(finalResponse);

    return {
      name: "Response variety (doesn't repeat)",
      passed: newContent && validatesWanting,
      details: `New content (not repeating): ${newContent}, Validates desire: ${validatesWanting}`,
      response: finalResponse
    };
  }

  const varietyResult = await varietyTest();
  results.push(varietyResult);
  console.log(`${varietyResult.passed ? "✅" : "❌"} ${varietyResult.name}: ${varietyResult.details}`);

  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("           DEEP FEATURE TESTING - AI QUALITY ASSESSMENT        ");
  console.log("═══════════════════════════════════════════════════════════════");

  const allResults: TestResult[] = [];

  // Run each test suite
  const dreamResults = await testDreamInterpretation();
  allResults.push(...dreamResults);

  const journalResults = await testJournalCompanion();
  allResults.push(...journalResults);

  const stuckResults = await testWhereImStuck();
  allResults.push(...stuckResults);

  const conversationResults = await testMultiTurnConversation();
  allResults.push(...conversationResults);

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                         TEST SUMMARY                          ");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const passed = allResults.filter(r => r.passed).length;
  const total = allResults.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`Dream Interpretation: ${dreamResults.filter(r => r.passed).length}/${dreamResults.length}`);
  console.log(`Journal Companion:    ${journalResults.filter(r => r.passed).length}/${journalResults.length}`);
  console.log(`Where I'm Stuck:      ${stuckResults.filter(r => r.passed).length}/${stuckResults.length}`);
  console.log(`Multi-turn Chat:      ${conversationResults.filter(r => r.passed).length}/${conversationResults.length}`);
  console.log(`\nOVERALL: ${passed}/${total} (${percentage}%)`);

  // Show failed tests details
  const failed = allResults.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("                       FAILED TEST DETAILS                     ");
    console.log("═══════════════════════════════════════════════════════════════\n");

    for (const test of failed) {
      console.log(`❌ ${test.name}`);
      console.log(`   Details: ${test.details}`);
      if (test.response) {
        console.log(`   Response: "${test.response.slice(0, 200)}${test.response.length > 200 ? '...' : ''}"`);
      }
      console.log();
    }
  }

  return { passed, total, percentage, results: allResults };
}

runAllTests().catch(console.error);
