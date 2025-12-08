'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  options: {
    label: string;
    tags: string[];
  }[];
}

const questions: Question[] = [
  {
    id: 'focus',
    text: "What's calling for your attention most right now?",
    options: [
      { label: 'My inner world—thoughts, emotions, patterns', tags: ['psychology', 'shadow-work', 'emotions', 'self-awareness'] },
      { label: 'My body—health, energy, physical wellbeing', tags: ['training', 'recovery', 'breathwork', 'sleep'] },
      { label: 'My relationships—connection, intimacy, conflict', tags: ['attachment', 'intimacy', 'communication', 'boundaries'] },
      { label: 'My sense of meaning—purpose, depth, spirituality', tags: ['meaning', 'meditation', 'presence', 'philosophy'] },
    ],
  },
  {
    id: 'state',
    text: 'Which describes where you are?',
    options: [
      { label: "I'm struggling—things feel hard right now", tags: ['healing', 'grief', 'anxiety', 'recovery'] },
      { label: "I'm stable—looking to grow and understand more", tags: ['self-awareness', 'practices', 'clarity'] },
      { label: "I'm in transition—something big is shifting", tags: ['change', 'identity', 'integration'] },
      { label: "I'm curious—exploring what's possible", tags: ['philosophy', 'psychedelics', 'meditation'] },
    ],
  },
  {
    id: 'style',
    text: 'What kind of content resonates with you?',
    options: [
      { label: 'Practical how-to guides', tags: ['practices', 'training', 'breathwork'] },
      { label: 'Deep psychological exploration', tags: ['psychology', 'shadow-work', 'attachment'] },
      { label: 'Philosophy and meaning-making', tags: ['philosophy', 'meaning', 'presence'] },
      { label: 'Relationship and intimacy insights', tags: ['intimacy', 'communication', 'attraction'] },
    ],
  },
];

interface Recommendation {
  title: string;
  slug: string;
  reason: string;
}

const articleRecommendations: Record<string, Recommendation> = {
  'psychology': { title: 'Understanding Your Nervous System', slug: 'understanding-your-nervous-system', reason: 'Foundation for understanding your patterns' },
  'shadow-work': { title: "Shadow Work: A Beginner's Guide", slug: 'shadow-work-beginners-guide', reason: 'Exploring the parts of yourself you hide' },
  'emotions': { title: 'How to Actually Feel Your Emotions', slug: 'how-to-actually-feel-your-emotions', reason: 'Stop intellectualizing, start feeling' },
  'self-awareness': { title: 'Soul vs Nervous System', slug: 'soul-vs-nervous-system', reason: 'Understanding what drives your reactions' },
  'training': { title: 'Strength Training Fundamentals', slug: 'strength-training-fundamentals', reason: 'Build a foundation of physical strength' },
  'recovery': { title: 'Recovery Is Not Lazy', slug: 'recovery-is-not-lazy', reason: 'Why rest is essential, not optional' },
  'breathwork': { title: 'Breathwork Basics', slug: 'breathwork-basics', reason: 'Your breath as a tool for regulation' },
  'sleep': { title: 'Sleep: The Foundation You Ignore', slug: 'sleep-the-foundation-you-ignore', reason: 'The most underrated health intervention' },
  'attachment': { title: 'Attachment Styles in Real-Life Dating', slug: 'attachment-styles-real-life-dating', reason: 'How your attachment patterns show up' },
  'intimacy': { title: 'Desire Without Grasping', slug: 'desire-without-grasping', reason: 'Healthy wanting without neediness' },
  'communication': { title: 'Communication in Conflict', slug: 'communication-in-conflict', reason: 'How to fight without destroying' },
  'boundaries': { title: 'The Art of Setting Boundaries', slug: 'the-art-of-setting-boundaries', reason: 'Protecting yourself without walls' },
  'meaning': { title: 'Finding Meaning When Nothing Makes Sense', slug: 'finding-meaning-when-nothing-makes-sense', reason: 'Purpose beyond achievement' },
  'meditation': { title: 'Meditation Without the Mysticism', slug: 'meditation-without-the-mysticism', reason: 'Practical approach to sitting still' },
  'presence': { title: 'How to Sit With Discomfort', slug: 'sitting-with-discomfort', reason: 'The skill of staying present' },
  'philosophy': { title: 'Befriending Death', slug: 'befriending-death', reason: 'Using mortality as a teacher' },
  'healing': { title: 'The Grief You Carry', slug: 'the-grief-you-carry', reason: 'Processing what you haven\'t mourned' },
  'grief': { title: 'The Grief You Carry', slug: 'the-grief-you-carry', reason: 'Acknowledging accumulated loss' },
  'anxiety': { title: 'Anxiety Is Not Your Enemy', slug: 'anxiety-is-not-your-enemy', reason: 'Working with anxiety, not against it' },
  'practices': { title: 'Journaling for the Skeptic', slug: 'journaling-for-the-skeptic', reason: 'Practical writing methods that work' },
  'psychedelics': { title: 'Psychedelics: A Serious Introduction', slug: 'psychedelics-a-serious-introduction', reason: 'Responsible approach to plant medicine' },
  'attraction': { title: 'When Attraction Scares You', slug: 'attraction-that-scares-you', reason: 'Understanding intense pull toward others' },
  'change': { title: 'Why You\'re Attracted to Chaos', slug: 'why-youre-attracted-to-chaos', reason: 'When familiar feels like home' },
  'identity': { title: 'Solitude vs Loneliness', slug: 'solitude-vs-loneliness', reason: 'Being alone without being lonely' },
  'integration': { title: 'After the Breakthrough', slug: 'after-the-breakthrough', reason: 'Making peak experiences stick' },
  'clarity': { title: 'Gratitude Without the Cringe', slug: 'gratitude-without-the-cringe', reason: 'Appreciation that actually works' },
  'transitions': { title: 'Midlife Without the Crisis', slug: 'midlife-without-the-crisis', reason: 'The questions that surface in your 30s and 40s' },
  'spirituality': { title: 'When the Seeking Stops', slug: 'when-the-seeking-stops', reason: 'From searching to settling' },
};

export default function StartHereQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (tags: string[]) => {
    setSelectedTags([...selectedTags, ...tags]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const getRecommendations = (): Recommendation[] => {
    // Count tag frequency
    const tagCounts: Record<string, number> = {};
    selectedTags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    // Get unique recommendations sorted by relevance
    const seen = new Set<string>();
    const recommendations: Recommendation[] = [];

    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag]) => {
        const rec = articleRecommendations[tag];
        if (rec && !seen.has(rec.slug)) {
          seen.add(rec.slug);
          recommendations.push(rec);
        }
      });

    return recommendations.slice(0, 5);
  };

  const reset = () => {
    setCurrentQuestion(0);
    setSelectedTags([]);
    setShowResults(false);
  };

  if (showResults) {
    const recommendations = getRecommendations();

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-white mb-2">Your Starting Points</h2>
          <p className="text-gray-400">Based on your answers, we recommend:</p>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Link
              key={rec.slug}
              href={`/posts/${rec.slug}`}
              className="block p-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0 text-gray-400 font-medium">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-serif text-lg text-white mb-1">{rec.title}</h3>
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
            href="/learning-paths"
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors text-center"
          >
            Browse Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 ${
              index <= currentQuestion ? 'bg-white' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
        <h2 className="font-serif text-2xl text-white">{question.text}</h2>
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

      {/* Skip option */}
      {currentQuestion > 0 && (
        <button
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          className="mt-6 text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
