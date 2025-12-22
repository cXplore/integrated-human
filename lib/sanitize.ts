/**
 * Input sanitization for AI prompts
 * Defends against prompt injection attacks without breaking legitimate use
 */

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS = [
  // System prompt override attempts
  /\[system\]/i,
  /\[SYSTEM\]/,
  /<system>/i,
  /<<SYS>>/i,
  /\[\/INST\]/i,
  // Role switching attempts
  /^(assistant|system|user):\s*/im,
  // Instruction override patterns
  /ignore (all )?(previous|above|prior) (instructions|prompts?|commands?)/i,
  /disregard (all )?(previous|above|prior)/i,
  /forget (everything|all|your)/i,
  /new instructions:/i,
  /override:/i,
  // Jailbreak patterns
  /you are now/i,
  /pretend (to be|you are)/i,
  /act as if/i,
  /roleplay as/i,
  /DAN mode/i,
  /developer mode/i,
];

/**
 * Check if input contains potential prompt injection patterns
 */
export function containsInjectionPattern(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize user input for AI prompts
 * - Removes dangerous characters that could break prompt structure
 * - Truncates excessive length
 * - Warns about potential injection but doesn't block legitimate content
 */
export function sanitizeUserInput(
  input: string,
  options: { maxLength?: number; warnOnInjection?: boolean } = {}
): { sanitized: string; warnings: string[] } {
  const { maxLength = 4000, warnOnInjection = true } = options;
  const warnings: string[] = [];

  // Truncate if too long
  let sanitized = input.slice(0, maxLength);
  if (input.length > maxLength) {
    warnings.push(`Input truncated from ${input.length} to ${maxLength} characters`);
  }

  // Remove null bytes and other dangerous control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Check for injection patterns
  if (warnOnInjection && containsInjectionPattern(sanitized)) {
    warnings.push('Potential prompt injection pattern detected');
    // We don't block - just log. The system prompt should be robust enough
    // and blocking could affect legitimate use (e.g., discussing prompt engineering)
  }

  return { sanitized, warnings };
}

/**
 * Escape special characters for safe inclusion in prompts
 * Use this when embedding user content in a specific structure
 */
export function escapeForPrompt(input: string): string {
  return input
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

/**
 * Validate and sanitize message history
 * Ensures all messages have valid roles and reasonable content
 */
export function sanitizeMessageHistory(
  messages: Array<{ role: string; content: string }>,
  maxMessages = 20
): Array<{ role: string; content: string }> {
  const validRoles = ['user', 'assistant'];

  return messages
    .slice(-maxMessages)
    .filter(msg => validRoles.includes(msg.role))
    .map(msg => ({
      role: msg.role,
      content: sanitizeUserInput(msg.content, { maxLength: 2000 }).sanitized,
    }));
}

/**
 * Safe JSON parse with default value on failure
 * Use this for parsing user-stored JSON that might be corrupted
 */
export function safeJsonParse<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    console.warn('Failed to parse JSON:', json.slice(0, 100));
    return defaultValue;
  }
}
