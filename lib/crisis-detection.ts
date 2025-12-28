/**
 * Crisis Detection & De-escalation
 *
 * Detects crisis signals in user messages and provides appropriate
 * grounding responses and resources. This is a safety-critical feature.
 */

export type CrisisSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface CrisisSignal {
  severity: CrisisSeverity;
  indicators: string[];
  immediateActions: string[];
  resources: CrisisResource[];
  promptModification: string;
}

export interface CrisisResource {
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'professional' | 'grounding';
  description: string;
  contact?: string;
  url?: string;
}

// Crisis keyword patterns with severity levels
const CRISIS_PATTERNS: Array<{ pattern: RegExp; severity: CrisisSeverity; indicator: string }> = [
  // Critical - immediate danger
  { pattern: /\b(kill myself|end my life|suicide|suicidal)\b/i, severity: 'critical', indicator: 'suicidal ideation' },
  { pattern: /\b(want to die|don'?t want to (be here|exist|live))\b/i, severity: 'critical', indicator: 'death wish' },
  { pattern: /\b(hurt myself|self[- ]?harm|cutting myself|harming myself)\b/i, severity: 'critical', indicator: 'self-harm' },
  { pattern: /\b(end it all|no point (in )?living)\b/i, severity: 'critical', indicator: 'suicidal thoughts' },
  { pattern: /\b(made a plan|have a plan to|going to kill)\b/i, severity: 'critical', indicator: 'suicide plan' },

  // High - serious distress
  { pattern: /\b(can'?t go on|can'?t take (it|this) anymore)\b/i, severity: 'high', indicator: 'overwhelm' },
  { pattern: /\b(everyone would be better off without me)\b/i, severity: 'high', indicator: 'worthlessness' },
  { pattern: /\b(no reason to live|nothing to live for)\b/i, severity: 'high', indicator: 'hopelessness' },
  { pattern: /\b(want to disappear|wish I was (dead|gone|never born))\b/i, severity: 'high', indicator: 'passive ideation' },
  { pattern: /\b(thought about (hurting|harming) myself)\b/i, severity: 'high', indicator: 'self-harm thoughts' },

  // Medium - significant distress
  { pattern: /\b(hopeless|no hope|completely lost)\b/i, severity: 'medium', indicator: 'hopelessness' },
  { pattern: /\b(can'?t cope|falling apart|breaking down)\b/i, severity: 'medium', indicator: 'crisis state' },
  { pattern: /\b(so (scared|terrified|panicked))\b/i, severity: 'medium', indicator: 'severe anxiety' },
  { pattern: /\b(I'?m in (danger|trouble|crisis))\b/i, severity: 'medium', indicator: 'stated crisis' },
  { pattern: /\b(abuse|being abused|abusing me)\b/i, severity: 'medium', indicator: 'abuse situation' },

  // Low - distress signals worth noting
  { pattern: /\b(really struggling|barely (holding on|functioning))\b/i, severity: 'low', indicator: 'struggling' },
  { pattern: /\b(don'?t know what to do|at my wit'?s end)\b/i, severity: 'low', indicator: 'overwhelm' },
  { pattern: /\b(never get better|always be this way)\b/i, severity: 'low', indicator: 'catastrophizing' },
];

// Severity level ordering for comparison
const SEVERITY_ORDER: Record<CrisisSeverity, number> = {
  'none': 0,
  'low': 1,
  'medium': 2,
  'high': 3,
  'critical': 4,
};

// Default crisis resources
const CRISIS_RESOURCES: Record<CrisisSeverity, CrisisResource[]> = {
  'none': [],
  'low': [
    {
      name: 'Grounding Exercise',
      type: 'grounding',
      description: '5-4-3-2-1 sensory grounding technique',
    },
  ],
  'medium': [
    {
      name: 'Crisis Text Line',
      type: 'text',
      description: 'Free 24/7 crisis support via text',
      contact: 'Text HOME to 741741',
    },
    {
      name: 'Grounding Exercise',
      type: 'grounding',
      description: 'Box breathing and grounding',
    },
  ],
  'high': [
    {
      name: 'National Suicide Prevention Lifeline',
      type: 'hotline',
      description: 'Free 24/7 support for people in distress',
      contact: '988 (US)',
    },
    {
      name: 'Crisis Text Line',
      type: 'text',
      description: 'Free 24/7 crisis support via text',
      contact: 'Text HOME to 741741',
    },
    {
      name: 'Seek Professional Help',
      type: 'professional',
      description: 'Consider reaching out to a therapist or counselor',
    },
  ],
  'critical': [
    {
      name: 'National Suicide Prevention Lifeline',
      type: 'hotline',
      description: 'Free 24/7 support - call or text',
      contact: '988 (US)',
    },
    {
      name: 'International Crisis Lines',
      type: 'hotline',
      description: 'Find crisis support in your country',
      url: 'https://findahelpline.com/',
    },
    {
      name: 'Crisis Text Line',
      type: 'text',
      description: 'Text-based crisis support',
      contact: 'Text HOME to 741741',
    },
    {
      name: 'Emergency Services',
      type: 'hotline',
      description: 'If you are in immediate danger',
      contact: '911 (US) or your local emergency number',
    },
  ],
};

// Prompt modifications for crisis situations
const CRISIS_PROMPTS: Record<CrisisSeverity, string> = {
  'none': '',
  'low': `
IMPORTANT: The user is showing signs of distress. Respond with:
- Extra warmth and validation
- Gentle grounding (e.g., "Take a breath with me")
- Acknowledgment of their struggle
- Do not push for deeper exploration right now
`,
  'medium': `
CRISIS PROTOCOL - MEDIUM:
The user is in significant distress. Your response MUST:
1. Validate their feelings immediately ("What you're feeling is real and hard")
2. Offer grounding ("Let's pause together. Can you feel your feet on the ground?")
3. Gently assess: "Are you safe right now?"
4. Provide one resource naturally at the end
5. Keep response focused and calming - no exploratory questions
6. Do NOT attempt therapy or deep exploration
`,
  'high': `
CRISIS PROTOCOL - HIGH:
The user is expressing serious distress. Your response MUST:
1. Lead with validation and presence ("I hear you. I'm here with you right now.")
2. Assess safety directly but gently: "I want to make sure you're safe. Are you thinking about hurting yourself?"
3. Provide grounding: "Before we go further, let's take one slow breath together."
4. ALWAYS include crisis resources at the end of your response
5. Keep response short, warm, and grounding
6. Do NOT explore deeper content - focus on safety and connection
`,
  'critical': `
CRISIS PROTOCOL - CRITICAL:
The user has expressed thoughts of suicide or self-harm. This is the highest priority.

Your response MUST:
1. Express genuine care: "I'm really glad you told me this. You matter, and I'm here with you."
2. Assess immediate safety: "Are you safe right now? Do you have access to means to hurt yourself?"
3. Do NOT minimize or dismiss: Take their words seriously
4. Provide resources prominently:
   - 988 Suicide & Crisis Lifeline (call or text 988)
   - Crisis Text Line (text HOME to 741741)
   - Emergency services if in immediate danger
5. Stay present: "I'm not going anywhere. Let's stay connected."
6. Encourage professional support without pressure
7. Keep response focused ONLY on safety and connection

Remember: Your role is to be a caring presence and connect them with help - not to provide therapy.
`,
};

/**
 * Detect crisis signals in a message
 */
export function detectCrisisSignals(message: string): CrisisSignal {
  const lowerMessage = message.toLowerCase();
  let maxSeverity: CrisisSeverity = 'none';
  const foundIndicators: string[] = [];

  // Check all patterns
  for (const { pattern, severity, indicator } of CRISIS_PATTERNS) {
    if (pattern.test(lowerMessage)) {
      foundIndicators.push(indicator);
      if (SEVERITY_ORDER[severity] > SEVERITY_ORDER[maxSeverity]) {
        maxSeverity = severity;
      }
    }
  }

  // Build response based on severity
  const immediateActions = buildImmediateActions(maxSeverity);
  const resources = CRISIS_RESOURCES[maxSeverity];
  const promptModification = CRISIS_PROMPTS[maxSeverity];

  return {
    severity: maxSeverity,
    indicators: foundIndicators,
    immediateActions,
    resources,
    promptModification,
  };
}

/**
 * Build immediate action recommendations based on severity
 */
function buildImmediateActions(severity: CrisisSeverity): string[] {
  switch (severity) {
    case 'critical':
      return [
        'Validate and express care immediately',
        'Assess immediate safety',
        'Provide crisis resources prominently',
        'Stay present and connected',
        'Do not end the conversation abruptly',
      ];
    case 'high':
      return [
        'Lead with validation',
        'Gently assess safety',
        'Offer grounding techniques',
        'Include crisis resources',
        'Keep response focused on safety',
      ];
    case 'medium':
      return [
        'Validate feelings',
        'Offer grounding',
        'Check on their safety',
        'Mention support resources naturally',
      ];
    case 'low':
      return [
        'Extra validation',
        'Gentle grounding',
        'Warm, supportive tone',
      ];
    default:
      return [];
  }
}

/**
 * Format crisis resources for display in response
 */
export function formatCrisisResources(resources: CrisisResource[]): string {
  if (resources.length === 0) return '';

  const lines: string[] = ['\n---', 'Support resources:'];

  for (const resource of resources) {
    if (resource.contact) {
      lines.push(`- **${resource.name}**: ${resource.contact}`);
    } else if (resource.url) {
      lines.push(`- **${resource.name}**: ${resource.url}`);
    } else {
      lines.push(`- **${resource.name}**: ${resource.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Check if crisis detection should modify the AI's behavior
 */
export function shouldModifyPrompt(signal: CrisisSignal): boolean {
  return signal.severity !== 'none';
}

/**
 * Get the grounding technique to offer based on context
 */
export function getGroundingTechnique(severity: CrisisSeverity): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'Take one slow breath with me. Feel your feet on the ground. You are here, right now, and you are not alone.';
    case 'medium':
      return 'Let\'s pause for a moment. Can you name 3 things you can see right now? This can help ground you.';
    case 'low':
      return 'Take a breath if you need to. There\'s no rush here.';
    default:
      return '';
  }
}
