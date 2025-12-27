'use client';

import { useState } from 'react';
import Link from 'next/link';

type Path = 'quiz' | 'explore' | 'archetype' | null;

interface Recommendation {
  type: 'article' | 'course';
  title: string;
  slug: string;
  reason: string;
  category?: string;
  isFree?: boolean;
}

interface Question {
  id: string;
  text: string;
  subtext?: string;
  options: {
    label: string;
    tags: string[];
  }[];
}

const questions: Question[] = [
  {
    id: 'state',
    text: 'Where are you right now?',
    subtext: 'There\'s no wrong answer.',
    options: [
      { label: 'Struggling — things feel hard', tags: ['healing', 'crisis', 'anxiety', 'grief'] },
      { label: 'Stable — looking to grow', tags: ['growth', 'self-awareness', 'practices'] },
      { label: 'In transition — something is shifting', tags: ['change', 'identity', 'integration'] },
      { label: 'Curious — just exploring', tags: ['philosophy', 'meditation', 'meaning'] },
    ],
  },
  {
    id: 'focus',
    text: 'What\'s calling for attention?',
    options: [
      { label: 'My inner world — thoughts, emotions, patterns', tags: ['psychology', 'shadow-work', 'emotions'] },
      { label: 'My body — energy, health, nervous system', tags: ['nervous-system', 'embodiment', 'body'] },
      { label: 'My relationships — connection, intimacy', tags: ['attachment', 'relationships', 'intimacy'] },
      { label: 'My sense of meaning — purpose, depth', tags: ['meaning', 'spirituality', 'soul'] },
    ],
  },
  {
    id: 'depth',
    text: 'How deep do you want to go?',
    options: [
      { label: 'I\'m new to this — start with basics', tags: ['beginner', 'foundational'] },
      { label: 'I have some experience — go deeper', tags: ['intermediate', 'practices'] },
      { label: 'I\'ve done a lot of work — show me the advanced stuff', tags: ['advanced', 'shadow-work', 'integration'] },
    ],
  },
];

// Mapping from tags to content
const recommendations: Record<string, Recommendation[]> = {
  'healing': [
    { type: 'article', title: 'Anxiety Is Not Your Enemy', slug: 'anxiety-is-not-your-enemy', reason: 'Working with anxiety, not against it' },
    { type: 'course', title: 'Anxiety First Aid', slug: 'anxiety-first-aid', reason: 'Immediate tools for overwhelm', isFree: true },
  ],
  'crisis': [
    { type: 'article', title: 'The Grief You Carry', slug: 'the-grief-you-carry', reason: 'Processing what you haven\'t mourned' },
    { type: 'course', title: 'Nervous System Mastery', slug: 'nervous-system-mastery', reason: 'Regulating when everything feels like too much' },
  ],
  'anxiety': [
    { type: 'article', title: 'Understanding Your Nervous System', slug: 'understanding-your-nervous-system', reason: 'Why your body reacts the way it does' },
    { type: 'course', title: 'Breaking Free from Anxiety', slug: 'breaking-free-anxiety', reason: 'A comprehensive approach to anxiety' },
  ],
  'psychology': [
    { type: 'article', title: 'Shadow Work: A Beginner\'s Guide', slug: 'shadow-work-beginners-guide', reason: 'Meeting the parts you\'ve hidden' },
    { type: 'course', title: 'Shadow Work Foundations', slug: 'shadow-work-foundations', reason: 'A structured journey into the shadow' },
  ],
  'shadow-work': [
    { type: 'article', title: 'The Parts of You That Want to Be Seen', slug: 'the-parts-that-want-to-be-seen', reason: 'Why shadow work matters' },
    { type: 'course', title: 'Shadow Work Foundations', slug: 'shadow-work-foundations', reason: 'Deep dive into shadow integration' },
  ],
  'emotions': [
    { type: 'article', title: 'How to Actually Feel Your Emotions', slug: 'how-to-actually-feel-your-emotions', reason: 'Stop intellectualizing, start feeling' },
    { type: 'course', title: 'Mastering Emotions', slug: 'mastering-emotions', reason: 'The full spectrum of emotional intelligence' },
  ],
  'nervous-system': [
    { type: 'article', title: 'Understanding Your Nervous System', slug: 'understanding-your-nervous-system', reason: 'The foundation of regulation' },
    { type: 'course', title: 'Nervous System Mastery', slug: 'nervous-system-mastery', reason: 'Complete nervous system training' },
  ],
  'embodiment': [
    { type: 'article', title: 'Coming Home to Your Body', slug: 'coming-home-to-your-body', reason: 'Reconnecting with physical presence' },
    { type: 'course', title: 'Embodiment Basics', slug: 'embodiment-basics', reason: 'Learning to live in your body' },
  ],
  'attachment': [
    { type: 'article', title: 'Attachment Styles in Real-Life Dating', slug: 'attachment-styles-real-life-dating', reason: 'How your patterns show up' },
    { type: 'course', title: 'Attachment Repair', slug: 'attachment-repair', reason: 'Healing attachment wounds' },
  ],
  'relationships': [
    { type: 'article', title: 'Communication in Conflict', slug: 'communication-in-conflict', reason: 'Fighting without destroying' },
    { type: 'course', title: 'Conscious Relationship', slug: 'conscious-relationship', reason: 'Building healthy connection' },
  ],
  'intimacy': [
    { type: 'article', title: 'Desire Without Grasping', slug: 'desire-without-grasping', reason: 'Healthy wanting' },
    { type: 'course', title: 'Sexuality and Intimacy', slug: 'sexuality-and-intimacy', reason: 'Deepening physical connection' },
  ],
  'meaning': [
    { type: 'article', title: 'Finding Meaning When Nothing Makes Sense', slug: 'finding-meaning-when-nothing-makes-sense', reason: 'Purpose beyond achievement' },
    { type: 'course', title: 'Meaning and Purpose', slug: 'meaning-and-purpose', reason: 'Discovering what matters' },
  ],
  'spirituality': [
    { type: 'article', title: 'When the Seeking Stops', slug: 'when-the-seeking-stops', reason: 'From searching to settling' },
    { type: 'course', title: 'Spiritual Development', slug: 'spiritual-development', reason: 'A grounded approach to the transcendent' },
  ],
  'meditation': [
    { type: 'article', title: 'Meditation Without the Mysticism', slug: 'meditation-without-the-mysticism', reason: 'Practical approach to sitting' },
    { type: 'course', title: 'Mindfulness Basics', slug: 'mindfulness-basics', reason: 'Start a sustainable practice', isFree: true },
  ],
  'philosophy': [
    { type: 'article', title: 'Befriending Death', slug: 'befriending-death', reason: 'Using mortality as a teacher' },
  ],
  'beginner': [
    { type: 'article', title: 'Understanding Your Nervous System', slug: 'understanding-your-nervous-system', reason: 'A foundational read' },
    { type: 'course', title: 'Mindfulness Basics', slug: 'mindfulness-basics', reason: 'Perfect starting point', isFree: true },
  ],
  'integration': [
    { type: 'article', title: 'After the Breakthrough', slug: 'after-the-breakthrough', reason: 'Making experiences stick' },
    { type: 'course', title: 'The Integration Path', slug: 'the-integration-path', reason: 'A comprehensive journey' },
  ],
  'advanced': [
    { type: 'course', title: 'The Integrated Self', slug: 'the-integrated-self', reason: 'Deep work on wholeness', category: 'Flagship' },
    { type: 'course', title: 'The Embodied Man', slug: 'the-embodied-man', reason: 'Advanced masculine development', category: 'Flagship' },
  ],
};

export default function StartHereFlow() {
  const [path, setPath] = useState<Path>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (tags: string[]) => {
    const newTags = [...selectedTags, ...tags];
    setSelectedTags(newTags);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const getRecommendations = (): Recommendation[] => {
    const tagCounts: Record<string, number> = {};
    selectedTags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const seen = new Set<string>();
    const result: Recommendation[] = [];

    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag]) => {
        const recs = recommendations[tag] || [];
        recs.forEach((rec) => {
          const key = `${rec.type}-${rec.slug}`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push(rec);
          }
        });
      });

    return result.slice(0, 6);
  };

  const reset = () => {
    setPath(null);
    setCurrentQuestion(0);
    setSelectedTags([]);
    setShowResults(false);
  };

  // Initial choice screen
  if (!path) {
    return (
      <div className="space-y-6">
        {/* Primary CTA: Integration Assessment */}
        <Link
          href="/assessment"
          className="block w-full p-8 text-left bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/10 flex items-center justify-center flex-shrink-0 rounded-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-xl text-white group-hover:text-gray-200 transition-colors">
                  Integration Assessment
                </h3>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Recommended</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                A comprehensive assessment that reveals where you are on the development spectrum
                and across the four pillars of integration.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>15-25 minutes</span>
                <span>•</span>
                <span>Personalized portrait</span>
                <span>•</span>
                <span>Guided recommendations</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-zinc-950 text-gray-600 text-xs uppercase tracking-wide">Or try these</span>
          </div>
        </div>

        <button
          onClick={() => setPath('quiz')}
          className="w-full p-6 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 transition-colors">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-xl text-white mb-1 group-hover:text-gray-300 transition-colors">
                Quick recommendations
              </h3>
              <p className="text-gray-500 text-sm">
                Answer 3 quick questions for content suggestions (2 min)
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setPath('explore')}
          className="w-full p-6 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 transition-colors">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-xl text-white mb-1 group-hover:text-gray-300 transition-colors">
                Browse by pillar
              </h3>
              <p className="text-gray-500 text-sm">
                Explore Mind, Body, Soul, or Relationships directly
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setPath('archetype')}
          className="w-full p-6 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 transition-colors">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-xl text-white mb-1 group-hover:text-gray-300 transition-colors">
                Archetype quiz
              </h3>
              <p className="text-gray-500 text-sm">
                Discover your archetypal patterns
              </p>
            </div>
          </div>
        </button>

        <div className="pt-8 text-center border-t border-zinc-800">
          <p className="text-gray-500 text-sm mb-4">
            Already know what you're looking for?
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/courses" className="text-gray-400 hover:text-white transition-colors text-sm">
              Courses
            </Link>
            <span className="text-gray-700">·</span>
            <Link href="/learning-paths" className="text-gray-400 hover:text-white transition-colors text-sm">
              Learning Paths
            </Link>
            <span className="text-gray-700">·</span>
            <Link href="/mind" className="text-gray-400 hover:text-white transition-colors text-sm">
              All Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Browse by topic
  if (path === 'explore') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setPath(null)}
          className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          ← Back
        </button>

        <h2 className="font-serif text-2xl text-white text-center mb-8">
          Choose your focus
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/mind"
            className="p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-center group"
          >
            <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">Mind</h3>
            <p className="text-gray-500 text-sm">Psychology, shadow, emotions</p>
          </Link>
          <Link
            href="/body"
            className="p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-center group"
          >
            <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">Body</h3>
            <p className="text-gray-500 text-sm">Training, breath, sleep</p>
          </Link>
          <Link
            href="/soul"
            className="p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-center group"
          >
            <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">Soul</h3>
            <p className="text-gray-500 text-sm">Meditation, meaning, depth</p>
          </Link>
          <Link
            href="/relationships"
            className="p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors text-center group"
          >
            <h3 className="font-serif text-xl text-white mb-2 group-hover:text-gray-300 transition-colors">Relationships</h3>
            <p className="text-gray-500 text-sm">Attachment, intimacy, conflict</p>
          </Link>
        </div>
      </div>
    );
  }

  // Archetype quiz redirect
  if (path === 'archetype') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setPath(null)}
          className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="text-center py-8">
          <h2 className="font-serif text-2xl text-white mb-4">
            The Archetype Quiz
          </h2>
          <p className="text-gray-400 mb-8">
            Discover which archetypes are most active in your psyche—and which are in shadow.
            Understanding your archetypal patterns helps you see what's driving your behavior.
          </p>
          <Link
            href="/archetypes"
            className="inline-block px-8 py-3 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
          >
            Take the Quiz
          </Link>
        </div>
      </div>
    );
  }

  // Quiz flow - show results
  if (showResults) {
    const recs = getRecommendations();

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-white mb-2">Your Starting Points</h2>
          <p className="text-gray-400">Based on where you are, we recommend:</p>
        </div>

        <div className="space-y-4">
          {recs.map((rec, index) => (
            <Link
              key={`${rec.type}-${rec.slug}`}
              href={rec.type === 'article' ? `/posts/${rec.slug}` : `/courses/${rec.slug}`}
              className="block p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 text-gray-400 font-medium transition-colors">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs uppercase tracking-wide ${rec.type === 'course' ? 'text-amber-500' : 'text-gray-500'}`}>
                      {rec.type === 'course' ? 'Course' : 'Article'}
                    </span>
                    {rec.isFree && (
                      <span className="text-xs text-green-500">Free</span>
                    )}
                    {rec.category && (
                      <span className="text-xs text-purple-400">{rec.category}</span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{rec.reason}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            onClick={reset}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Start Over
          </button>
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors text-center"
          >
            Create a Profile
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm">
          Create a profile for personalized recommendations based on your journey.
        </p>
      </div>
    );
  }

  // Quiz flow - questions
  const question = questions[currentQuestion];

  return (
    <div>
      <button
        onClick={() => {
          if (currentQuestion === 0) {
            setPath(null);
          } else {
            setCurrentQuestion(currentQuestion - 1);
            setSelectedTags(selectedTags.slice(0, -questions[currentQuestion - 1].options[0].tags.length));
          }
        }}
        className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-2 mb-8"
      >
        ← Back
      </button>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 transition-colors ${
              index <= currentQuestion ? 'bg-white' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mb-8 text-center">
        <p className="text-sm text-gray-500 mb-2">
          {currentQuestion + 1} of {questions.length}
        </p>
        <h2 className="font-serif text-2xl text-white mb-2">{question.text}</h2>
        {question.subtext && (
          <p className="text-gray-500">{question.subtext}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option.tags)}
            className="w-full p-4 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-colors text-gray-300 hover:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
