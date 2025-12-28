import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllPosts, type Post } from '@/lib/posts';

// Map conversation topics to article tags/categories
const TOPIC_TO_TAGS: Record<string, string[]> = {
  // Emotional states
  anxiety: ['anxiety', 'nervous system', 'regulation', 'calm', 'stress'],
  anger: ['anger', 'emotions', 'rage', 'shadow'],
  sadness: ['grief', 'sadness', 'depression', 'loss', 'emotions'],
  fear: ['fear', 'safety', 'nervous system', 'trauma'],
  shame: ['shame', 'guilt', 'self-compassion', 'shadow'],

  // Topics
  relationships: ['relationships', 'attachment', 'intimacy', 'connection', 'love'],
  boundaries: ['boundaries', 'assertiveness', 'people pleasing', 'codependency'],
  shadow: ['shadow', 'shadow work', 'darkness', 'integration', 'unconscious'],
  trauma: ['trauma', 'healing', 'nervous system', 'somatic'],
  family: ['family', 'childhood', 'parents', 'attachment', 'inner child'],
  work: ['work', 'career', 'purpose', 'burnout', 'meaning'],
  spirituality: ['spirituality', 'soul', 'meaning', 'meditation', 'presence'],
  dreams: ['dreams', 'unconscious', 'symbols', 'jung'],
  body: ['body', 'somatic', 'embodiment', 'nervous system'],
  perfectionism: ['perfectionism', 'self-criticism', 'self-compassion', 'shadow'],
  selfworth: ['self-worth', 'confidence', 'self-esteem', 'inner critic'],
  grief: ['grief', 'loss', 'death', 'mourning'],
  sleep: ['sleep', 'rest', 'nervous system', 'regulation'],
  meditation: ['meditation', 'mindfulness', 'presence', 'stillness'],
  creativity: ['creativity', 'expression', 'art', 'flow'],
};

// Keywords to detect topics in conversation
const TOPIC_KEYWORDS: Record<string, string[]> = {
  anxiety: ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'overwhelmed', 'stressed', 'racing thoughts'],
  anger: ['angry', 'anger', 'rage', 'frustrated', 'resentment', 'irritated', 'furious'],
  sadness: ['sad', 'depressed', 'down', 'hopeless', 'lonely', 'empty', 'crying'],
  fear: ['scared', 'afraid', 'fear', 'terrified', 'frightened'],
  shame: ['ashamed', 'shame', 'embarrassed', 'humiliated', 'guilty', 'worthless'],
  relationships: ['relationship', 'partner', 'marriage', 'dating', 'connection', 'intimacy'],
  boundaries: ['boundary', 'boundaries', 'say no', 'people pleasing', 'taken advantage'],
  shadow: ['shadow', 'dark side', 'hidden', 'unconscious', 'denied', 'repressed'],
  trauma: ['trauma', 'traumatic', 'ptsd', 'triggered', 'flashback'],
  family: ['family', 'mother', 'father', 'parent', 'childhood', 'upbringing', 'siblings'],
  work: ['work', 'job', 'career', 'boss', 'burnout', 'profession'],
  spirituality: ['spiritual', 'soul', 'divine', 'sacred', 'transcendent', 'awakening'],
  dreams: ['dream', 'dreamed', 'nightmare', 'dreaming'],
  body: ['body', 'tension', 'sensation', 'physical', 'somatic'],
  perfectionism: ['perfect', 'perfectionist', 'not good enough', 'high standards', 'failure'],
  selfworth: ['self-worth', 'self-esteem', 'confidence', 'not worthy', 'deserve'],
  grief: ['grief', 'loss', 'died', 'death', 'mourning', 'passed away'],
  sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep'],
  meditation: ['meditate', 'meditation', 'mindful', 'mindfulness', 'present'],
  creativity: ['creative', 'art', 'express', 'create', 'artist'],
};

interface ArticleSuggestion {
  slug: string;
  title: string;
  excerpt: string;
  readingTime: string;
  relevance: string;
}

/**
 * POST /api/chat/suggest-articles
 * Suggest articles based on conversation content
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Fetch conversation messages
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { content: true, role: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get user's reading history to avoid suggesting already-read articles
    const readArticles = await prisma.articleProgress.findMany({
      where: { userId: session.user.id, completed: true },
      select: { slug: true },
    });
    const readSlugs = new Set(readArticles.map(a => a.slug));

    // Combine all user messages for analysis
    const userText = conversation.messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ')
      .toLowerCase();

    // Detect topics in conversation
    const detectedTopics: Array<{ topic: string; score: number }> = [];

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = userText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > 0) {
        detectedTopics.push({ topic, score });
      }
    }

    if (detectedTopics.length === 0) {
      return NextResponse.json({ suggestedArticles: [] });
    }

    // Sort by score and take top 3 topics
    detectedTopics.sort((a, b) => b.score - a.score);
    const topTopics = detectedTopics.slice(0, 3);

    // Get all posts
    const allPosts = getAllPosts();

    // Score articles based on detected topics
    const scoredArticles: Array<{
      post: Post;
      score: number;
      matchedTopic: string;
    }> = [];

    for (const post of allPosts) {
      // Skip already read
      if (readSlugs.has(post.slug)) continue;

      const categories = post.metadata.categories || [];
      const tags = post.metadata.tags || [];
      const allTags = [...categories.map(c => c.toLowerCase()), ...tags.map(t => t.toLowerCase())];

      let bestScore = 0;
      let bestTopic = '';

      for (const { topic, score: topicScore } of topTopics) {
        const relevantTags = TOPIC_TO_TAGS[topic] || [];
        const matchCount = relevantTags.filter(t =>
          allTags.some(at => at.includes(t.toLowerCase()))
        ).length;

        if (matchCount > 0) {
          const articleScore = matchCount * topicScore;
          if (articleScore > bestScore) {
            bestScore = articleScore;
            bestTopic = topic;
          }
        }
      }

      if (bestScore > 0) {
        scoredArticles.push({ post, score: bestScore, matchedTopic: bestTopic });
      }
    }

    // Sort by score and take top 2
    scoredArticles.sort((a, b) => b.score - a.score);
    const topArticles = scoredArticles.slice(0, 2);

    const suggestions: ArticleSuggestion[] = topArticles.map(({ post, matchedTopic }) => ({
      slug: post.slug,
      title: post.metadata.title,
      excerpt: post.metadata.excerpt || '',
      readingTime: typeof post.readingTime === 'number'
        ? `${post.readingTime} min read`
        : post.readingTime || '5 min read',
      relevance: generateRelevanceMessage(matchedTopic),
    }));

    return NextResponse.json({ suggestedArticles: suggestions });
  } catch (error) {
    console.error('Error suggesting articles:', error);
    return NextResponse.json({ error: 'Failed to suggest articles' }, { status: 500 });
  }
}

function generateRelevanceMessage(topic: string): string {
  const messages: Record<string, string> = {
    anxiety: 'Related to managing anxiety',
    anger: 'Explores working with anger',
    sadness: 'Addresses feelings of sadness',
    fear: 'Helps with understanding fear',
    shame: 'About healing shame',
    relationships: 'Explores relationship dynamics',
    boundaries: 'About setting healthy boundaries',
    shadow: 'Dives into shadow work',
    trauma: 'Addresses trauma healing',
    family: 'Explores family patterns',
    work: 'Related to work and purpose',
    spirituality: 'Explores spiritual growth',
    dreams: 'About dream work',
    body: 'Focuses on body awareness',
    perfectionism: 'Addresses perfectionism',
    selfworth: 'About building self-worth',
    grief: 'Supports grief processing',
    sleep: 'Helps with sleep and rest',
    meditation: 'Explores meditation practice',
    creativity: 'About creative expression',
  };

  return messages[topic] || 'Related to what you shared';
}
