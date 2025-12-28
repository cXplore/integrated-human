import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Common trigger patterns to detect in messages
const TRIGGER_INDICATORS: Record<string, { keywords: string[]; description: string }> = {
  'abandonment': {
    keywords: ['left me', 'abandoned', 'leaving me', 'alone', 'nobody cares', 'forgotten', 'deserted', "won't stay"],
    description: 'Fear of being left or forgotten',
  },
  'rejection': {
    keywords: ['rejected', 'turned down', 'not good enough', 'unwanted', "don't want me", 'pushed away', 'excluded'],
    description: 'Fear of being rejected or unwanted',
  },
  'criticism': {
    keywords: ['criticized', 'judged', 'wrong', 'stupid', 'failure', 'mistake', 'disappointed', "can't do anything right"],
    description: 'Sensitivity to criticism or judgment',
  },
  'conflict': {
    keywords: ['fight', 'argument', 'yelling', 'screaming', 'angry at me', 'tension', 'confrontation'],
    description: 'Discomfort with conflict or anger',
  },
  'control': {
    keywords: ['controlled', 'trapped', 'no choice', 'forced', 'powerless', 'helpless', 'stuck'],
    description: 'Feeling controlled or losing autonomy',
  },
  'shame': {
    keywords: ['ashamed', 'embarrassed', 'humiliated', 'exposed', 'foolish', 'worthless', 'disgusting'],
    description: 'Deep shame or unworthiness',
  },
  'betrayal': {
    keywords: ['betrayed', 'lied to', 'cheated', 'deceived', 'trust broken', "can't trust", 'stabbed in back'],
    description: 'Trust wounds and betrayal trauma',
  },
  'invalidation': {
    keywords: ['not listened to', 'dismissed', 'ignored', "don't matter", 'invisible', 'unimportant', 'not heard'],
    description: 'Feeling unseen or invalidated',
  },
  'perfectionism': {
    keywords: ['not perfect', 'not enough', 'should be better', 'high standards', 'never satisfied', 'imperfect'],
    description: 'Perfectionism and self-criticism',
  },
  'vulnerability': {
    keywords: ['scared to share', 'too much', 'burden', "can't open up", 'walls up', 'guard down'],
    description: 'Difficulty with emotional vulnerability',
  },
  'loss': {
    keywords: ['lost', 'death', 'died', 'gone forever', 'grief', 'mourning', 'missing them'],
    description: 'Grief and loss wounds',
  },
  'comparison': {
    keywords: ['not as good', 'everyone else', 'behind', 'failing compared', 'others have it', 'jealous'],
    description: 'Comparison and inadequacy',
  },
};

interface DetectedTrigger {
  trigger: string;
  description: string;
  matchedKeywords: string[];
  knownTrigger: boolean;
  intensity?: number;
  preferredResponse?: string | null;
}

/**
 * POST /api/chat/detect-triggers
 * Analyze a message for potential triggers
 * Used by the AI to be aware of sensitive topics
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, recordNew = false } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    const detected: DetectedTrigger[] = [];

    // Get user's known triggers
    const knownTriggers = await prisma.triggerPattern.findMany({
      where: { userId: session.user.id },
    });
    const knownTriggerMap = new Map(knownTriggers.map(t => [t.trigger, t]));

    // Check for trigger indicators in the message
    for (const [trigger, { keywords, description }] of Object.entries(TRIGGER_INDICATORS)) {
      const matchedKeywords = keywords.filter(kw => lowerMessage.includes(kw.toLowerCase()));

      if (matchedKeywords.length > 0) {
        const known = knownTriggerMap.get(trigger);
        detected.push({
          trigger,
          description,
          matchedKeywords,
          knownTrigger: !!known,
          intensity: known?.intensity,
          preferredResponse: known?.preferredResponse,
        });

        // Optionally record new triggers
        if (recordNew && !known) {
          await prisma.triggerPattern.create({
            data: {
              userId: session.user.id,
              trigger,
              intensity: 3,
              context: `Detected in message: "${message.slice(0, 100)}..."`,
              userConfirmed: false,
            },
          });
        } else if (known) {
          // Update occurrence count for known triggers
          await prisma.triggerPattern.update({
            where: { id: known.id },
            data: {
              occurrenceCount: { increment: 1 },
              lastTriggeredAt: new Date(),
            },
          });
        }
      }
    }

    // Also check for any custom triggers from the user's known list
    for (const known of knownTriggers) {
      if (!TRIGGER_INDICATORS[known.trigger]) {
        // Custom trigger - check if the trigger word appears in message
        if (lowerMessage.includes(known.trigger.toLowerCase())) {
          detected.push({
            trigger: known.trigger,
            description: known.context || 'User-identified trigger',
            matchedKeywords: [known.trigger],
            knownTrigger: true,
            intensity: known.intensity,
            preferredResponse: known.preferredResponse,
          });

          await prisma.triggerPattern.update({
            where: { id: known.id },
            data: {
              occurrenceCount: { increment: 1 },
              lastTriggeredAt: new Date(),
            },
          });
        }
      }
    }

    // Generate AI guidance based on detected triggers
    const guidance = generateTriggerGuidance(detected);

    return NextResponse.json({
      detected,
      guidance,
      hasActiveTriggers: detected.length > 0,
      highIntensityTriggers: detected.filter(d => d.intensity && d.intensity >= 4),
    });
  } catch (error) {
    console.error('Error detecting triggers:', error);
    return NextResponse.json({ error: 'Failed to detect triggers' }, { status: 500 });
  }
}

function generateTriggerGuidance(detected: DetectedTrigger[]): string {
  if (detected.length === 0) {
    return '';
  }

  const parts: string[] = ['TRIGGER AWARENESS:'];

  // High intensity triggers first
  const highIntensity = detected.filter(d => d.intensity && d.intensity >= 4);
  if (highIntensity.length > 0) {
    parts.push(`High-sensitivity topics detected: ${highIntensity.map(d => d.trigger).join(', ')}. Respond with extra care and grounding.`);
  }

  // Known triggers with preferred responses
  const withPreferences = detected.filter(d => d.preferredResponse);
  for (const trigger of withPreferences) {
    parts.push(`For "${trigger.trigger}": ${trigger.preferredResponse}`);
  }

  // General guidance for other triggers
  const otherTriggers = detected.filter(d => !d.preferredResponse && (!d.intensity || d.intensity < 4));
  if (otherTriggers.length > 0) {
    parts.push(`Also touching on: ${otherTriggers.map(d => d.trigger).join(', ')}. Be aware of emotional activation.`);
  }

  parts.push('Consider offering grounding if needed. Validate before exploring deeper.');

  return parts.join(' ');
}
