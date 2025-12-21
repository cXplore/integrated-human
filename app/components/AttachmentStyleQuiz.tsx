'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/lib/hooks/useAssessment';

type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

interface AttachmentScores {
  anxiety: number;
  avoidance: number;
}

interface StyleResult {
  style: AttachmentStyle;
  name: string;
  description: string;
  inRelationships: string[];
  underStress: string[];
  growthEdge: string[];
  color: string;
}

const styleResults: Record<AttachmentStyle, StyleResult> = {
  secure: {
    style: 'secure',
    name: 'Secure',
    description: "You're comfortable with intimacy and independence. You can depend on others and let them depend on you without losing yourself. This doesn't mean you never feel insecure — it means you can tolerate the vulnerability of connection.",
    inRelationships: [
      'Comfortable with closeness without becoming enmeshed',
      'Can ask for what you need directly',
      'Trust comes relatively easily',
      'Conflict feels manageable, not catastrophic',
      'Can be alone without feeling abandoned',
    ],
    underStress: [
      'May temporarily shift toward anxiety or avoidance',
      'Generally able to self-regulate and return to baseline',
      'Can reach out for support when needed',
      'Maintains perspective during difficulty',
    ],
    growthEdge: [
      'Stay curious about patterns that still arise',
      'Recognize security isn\'t a fixed state',
      "Support others' growth without fixing them",
      'Deepen capacity for presence in conflict',
    ],
    color: 'emerald',
  },
  anxious: {
    style: 'anxious',
    name: 'Anxious-Preoccupied',
    description: "You crave closeness and worry about whether your partner truly loves you. You may scan for signs of rejection, seek reassurance often, and feel that you want more intimacy than others seem to want. This pattern often develops when caregivers were inconsistently available.",
    inRelationships: [
      'Highly attuned to partner\'s moods and distance',
      'May interpret neutral signals as rejection',
      'Seeks reassurance, but it never quite lands',
      'Fear of abandonment can drive clingy or demanding behavior',
      'Often feels like you love more than you\'re loved',
    ],
    underStress: [
      'Attachment system activates intensely',
      'Difficulty self-soothing — needs external regulation',
      'May protest (reach out more, become upset) when partner withdraws',
      'Anxiety can spiral without connection',
    ],
    growthEdge: [
      'Learn to self-soothe before seeking reassurance',
      'Notice the difference between story and signal',
      'Practice tolerating uncertainty without reacting',
      'Build internal sense of worthiness',
      'Choose partners who can meet your needs consistently',
    ],
    color: 'amber',
  },
  avoidant: {
    style: 'avoidant',
    name: 'Dismissive-Avoidant',
    description: "You value independence highly and may feel uncomfortable with too much closeness. You're often self-reliant to a fault and may pull away when partners get too close. This pattern often develops when caregivers were emotionally unavailable or rejected expressions of need.",
    inRelationships: [
      'Comfortable with distance, uncomfortable with dependence',
      'May feel \"suffocated\" by partner\'s needs',
      'Often unaware of own attachment needs',
      'Keeps one foot out the door — emotionally or literally',
      'May idealize past relationships or fantasy partners',
    ],
    underStress: [
      'Attachment system deactivates — withdrawal, numbing',
      'May seem \"fine\" when actually disconnected',
      'Prefers to handle things alone, even when struggling',
      'May not reach out even when support would help',
    ],
    growthEdge: [
      'Notice when you\'re distancing and what triggered it',
      'Practice staying present when intimacy intensifies',
      'Recognize that needing others isn\'t weakness',
      'Learn to identify and express vulnerable emotions',
      'Choose partners who give you space without being distant',
    ],
    color: 'blue',
  },
  disorganized: {
    style: 'disorganized',
    name: 'Fearful-Avoidant',
    description: "You want closeness but fear it. You may oscillate between pursuing connection and pushing it away — caught between longing and terror. This pattern often develops when caregivers were frightening or frightened, making the source of comfort also the source of fear.",
    inRelationships: [
      'Simultaneous desire for and fear of intimacy',
      'May push-pull — drawing close then withdrawing',
      'Difficulty trusting, even when partner is consistent',
      'Relationships feel chaotic or confusing',
      'May choose unavailable or turbulent partners',
    ],
    underStress: [
      'Both anxiety and avoidance activate — no clear strategy',
      'May feel frozen, confused, or overwhelmed',
      'Dissociation or shutdown is common',
      'Past trauma may be triggered by intimacy',
    ],
    growthEdge: [
      'Safety first — work with trauma before optimizing relationships',
      'Learn to recognize when you\'re in a triggered state',
      'Build tolerance for closeness gradually',
      'Seek consistency in friendships before romantic relationships',
      'Consider working with a therapist trained in attachment',
    ],
    color: 'purple',
  },
};

interface Question {
  id: number;
  text: string;
  dimension: 'anxiety' | 'avoidance';
  options: {
    label: string;
    score: number; // 1-5 where 5 is high anxiety/avoidance
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "When your partner seems distant or preoccupied, what's your first reaction?",
    dimension: 'anxiety',
    options: [
      { label: 'I assume they have something on their mind — probably nothing to do with me', score: 1 },
      { label: "I might wonder if something's wrong, but I wait and see", score: 2 },
      { label: "I notice tension in my body and start scanning for what I did wrong", score: 4 },
      { label: "I feel panicked. I need to know what's happening right now", score: 5 },
    ],
  },
  {
    id: 2,
    text: 'How comfortable are you depending on a partner for emotional support?',
    dimension: 'avoidance',
    options: [
      { label: "Very comfortable — that's what partnership is for", score: 1 },
      { label: "Comfortable enough, though I try not to overdo it", score: 2 },
      { label: "Not very. I'd rather handle things myself", score: 4 },
      { label: "I don't depend on anyone. I've learned that's safer", score: 5 },
    ],
  },
  {
    id: 3,
    text: 'In arguments, do you tend to pursue resolution or need space?',
    dimension: 'anxiety',
    options: [
      { label: 'I can do either depending on what the situation needs', score: 1 },
      { label: 'I prefer to talk it through, but can give space if needed', score: 2 },
      { label: "I can't rest until it's resolved. Unspoken tension is unbearable", score: 4 },
      { label: 'I pursue intensely — I need reassurance that we\'re okay', score: 5 },
    ],
  },
  {
    id: 4,
    text: 'When a relationship gets serious, how do you feel?',
    dimension: 'avoidance',
    options: [
      { label: 'Excited and ready to go deeper', score: 1 },
      { label: 'Mostly good, with some normal nervousness', score: 2 },
      { label: 'Claustrophobic. I start noticing flaws and wanting space', score: 4 },
      { label: "I tend to sabotage it or leave before it gets too real", score: 5 },
    ],
  },
  {
    id: 5,
    text: 'How often do you worry about whether your partner really loves you?',
    dimension: 'anxiety',
    options: [
      { label: 'Rarely — I feel secure in their love', score: 1 },
      { label: 'Sometimes, but I can usually reality-check myself', score: 2 },
      { label: 'Often. Even when they reassure me, it fades quickly', score: 4 },
      { label: "Constantly. I'm always looking for proof either way", score: 5 },
    ],
  },
  {
    id: 6,
    text: 'How do you feel about showing vulnerability to a partner?',
    dimension: 'avoidance',
    options: [
      { label: 'It feels natural and connecting', score: 1 },
      { label: 'Uncomfortable at first, but worth it', score: 2 },
      { label: 'I avoid it. Vulnerability feels dangerous', score: 4 },
      { label: "I genuinely don't understand why people do this", score: 5 },
    ],
  },
  {
    id: 7,
    text: "When you're apart from your partner, what's your internal experience?",
    dimension: 'anxiety',
    options: [
      { label: "I miss them sometimes, but I'm fine doing my own thing", score: 1 },
      { label: 'I think about them but can focus on other things', score: 2 },
      { label: 'I feel anxious and check my phone a lot', score: 4 },
      { label: "I feel abandoned. Separation is painful even when it's short", score: 5 },
    ],
  },
  {
    id: 8,
    text: 'When a partner wants more closeness than you do, what happens?',
    dimension: 'avoidance',
    options: [
      { label: 'We find a balance that works for both', score: 1 },
      { label: "I stretch a bit, even if it's uncomfortable", score: 2 },
      { label: 'I feel trapped and start pulling away', score: 4 },
      { label: 'I feel smothered. Their need for closeness feels like a demand', score: 5 },
    ],
  },
  {
    id: 9,
    text: 'How do you respond to criticism from a partner?',
    dimension: 'anxiety',
    options: [
      { label: 'I can hear it without taking it too personally', score: 1 },
      { label: "It stings, but I can usually separate useful feedback from the hurt", score: 2 },
      { label: "I feel rejected. Criticism feels like they're saying I'm not enough", score: 4 },
      { label: 'I spiral. One criticism makes me question the whole relationship', score: 5 },
    ],
  },
  {
    id: 10,
    text: 'After a fight, how long does it take you to feel connected again?',
    dimension: 'avoidance',
    options: [
      { label: "Once we've resolved it, I can reconnect quickly", score: 1 },
      { label: 'I need a little time, but I come back', score: 2 },
      { label: 'I stay distant for a while. Reconnecting feels forced', score: 4 },
      { label: "Something shuts down. I'm not sure how to find my way back", score: 5 },
    ],
  },
];

export default function AttachmentStyleQuiz() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<AttachmentScores>({ anxiety: 0, avoidance: 0 });
  const [showResults, setShowResults] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  // Hook for saving results
  const { saveResults } = useAssessment('attachment');

  const handleAnswer = (dimension: 'anxiety' | 'avoidance', score: number) => {
    const newScores = { ...scores };
    newScores[dimension] += score;
    setScores(newScores);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      setStarted(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrentQuestion(0);
    setScores({ anxiety: 0, avoidance: 0 });
    setShowResults(false);
  };

  const getResult = useMemo((): StyleResult => {
    const anxietyQuestions = questions.filter(q => q.dimension === 'anxiety').length;
    const avoidanceQuestions = questions.filter(q => q.dimension === 'avoidance').length;

    // Normalize scores to 0-100 scale
    const anxietyNorm = ((scores.anxiety - anxietyQuestions) / (anxietyQuestions * 4)) * 100;
    const avoidanceNorm = ((scores.avoidance - avoidanceQuestions) / (avoidanceQuestions * 4)) * 100;

    // Thresholds for high anxiety/avoidance
    const highThreshold = 50;

    if (anxietyNorm >= highThreshold && avoidanceNorm >= highThreshold) {
      return styleResults.disorganized;
    }
    if (anxietyNorm >= highThreshold && avoidanceNorm < highThreshold) {
      return styleResults.anxious;
    }
    if (avoidanceNorm >= highThreshold && anxietyNorm < highThreshold) {
      return styleResults.avoidant;
    }
    return styleResults.secure;
  }, [scores]);

  const getAnxietyPercent = () => {
    const anxietyQuestions = questions.filter(q => q.dimension === 'anxiety').length;
    return Math.round(((scores.anxiety - anxietyQuestions) / (anxietyQuestions * 4)) * 100);
  };

  const getAvoidancePercent = () => {
    const avoidanceQuestions = questions.filter(q => q.dimension === 'avoidance').length;
    return Math.round(((scores.avoidance - avoidanceQuestions) / (avoidanceQuestions * 4)) * 100);
  };

  // Save results when complete
  useEffect(() => {
    if (showResults && !resultsSaved) {
      const anxietyPercent = getAnxietyPercent();
      const avoidancePercent = getAvoidancePercent();

      saveResults({
        style: getResult.style,
        styleName: getResult.name,
        scores,
        anxietyPercent,
        avoidancePercent,
      }, getResult.name).then(saved => {
        if (saved) setResultsSaved(true);
      });
    }
  }, [showResults, resultsSaved, scores, getResult, saveResults]);

  const getStyleColor = (style: AttachmentStyle) => {
    switch (style) {
      case 'secure': return 'text-emerald-400';
      case 'anxious': return 'text-amber-400';
      case 'avoidant': return 'text-blue-400';
      case 'disorganized': return 'text-purple-400';
    }
  };

  const getStyleBg = (style: AttachmentStyle) => {
    switch (style) {
      case 'secure': return 'border-emerald-600 bg-emerald-900/20';
      case 'anxious': return 'border-amber-600 bg-amber-900/20';
      case 'avoidant': return 'border-blue-600 bg-blue-900/20';
      case 'disorganized': return 'border-purple-600 bg-purple-900/20';
    }
  };

  // Intro screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-white">Attachment Style Exploration</h2>
          <div className="text-gray-400 leading-relaxed space-y-4 text-left">
            <p>
              Attachment style describes how you relate to closeness and independence in
              intimate relationships. It's shaped by early experiences but isn't fixed —
              it can shift with awareness and with the right relationships.
            </p>
            <p>
              This exploration looks at two dimensions: <em>anxiety</em> (fear of abandonment,
              need for reassurance) and <em>avoidance</em> (discomfort with dependence, need for space).
              Everyone falls somewhere on both spectrums.
            </p>
            <p>
              There's no "bad" attachment style. Each has strengths and challenges.
              The goal is simply to see yourself more clearly.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 hover:border-zinc-600 transition-colors"
          >
            Begin
          </button>
          <p className="text-gray-600 text-sm mt-4">
            10 questions · Takes about 5 minutes
          </p>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const result = getResult;
    const anxietyPercent = getAnxietyPercent();
    const avoidancePercent = getAvoidancePercent();

    return (
      <div className="space-y-8">
        {/* Style Header */}
        <div className={`text-center p-8 border ${getStyleBg(result.style)}`}>
          <p className="text-gray-500 text-sm mb-2">Primary Pattern</p>
          <h2 className={`font-serif text-3xl ${getStyleColor(result.style)} mb-4`}>
            {result.name}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            {result.description}
          </p>
        </div>

        {/* Dimensions */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Attachment Anxiety</h4>
              <span className="text-amber-400">{anxietyPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 mb-3">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${anxietyPercent}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm">
              Fear of rejection, need for reassurance, sensitivity to distance
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Attachment Avoidance</h4>
              <span className="text-blue-400">{avoidancePercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 mb-3">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${avoidancePercent}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm">
              Discomfort with dependence, need for space, emotional distancing
            </p>
          </div>
        </div>

        {/* In Relationships */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">In Relationships</h3>
          <ul className="space-y-2">
            {result.inRelationships.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <span className="text-gray-600 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Under Stress */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">Under Stress</h3>
          <ul className="space-y-2">
            {result.underStress.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <span className="text-gray-600 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Edge */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">Growth Edge</h3>
          <ul className="space-y-2">
            {result.growthEdge.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <svg className={`w-4 h-4 ${getStyleColor(result.style)} flex-shrink-0 mt-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Context */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-3">Remember</h3>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            <p>
              Attachment style isn't destiny. It's a pattern learned in relationship,
              and it can shift in relationship — especially with partners who offer
              consistent, responsive care.
            </p>
            <p>
              Many people are "earned secure" — they developed security not from
              perfect parenting, but from relationships (romantic, therapeutic, or
              friendship) that offered what their childhood didn't.
            </p>
          </div>
        </div>

        {/* Related Content */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="font-serif text-lg text-white mb-4">Go Deeper</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/posts/attachment-styles-real-life-dating"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Attachment Styles in Real Life</h4>
              <p className="text-sm text-gray-500">How these patterns play out in dating</p>
            </Link>
            <Link
              href="/posts/becoming-more-secure"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Becoming More Secure</h4>
              <p className="text-sm text-gray-500">The path to earned security</p>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Take Again
          </button>
          <Link
            href="/relationships"
            className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-center"
          >
            Explore Relationships
          </Link>
        </div>
      </div>
    );
  }

  // Questions
  const question = questions[currentQuestion];

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 transition-colors ${
              index < currentQuestion ? 'bg-white' :
              index === currentQuestion ? 'bg-gray-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">
            {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-gray-700">·</span>
          <span className={`text-xs uppercase tracking-wide ${
            question.dimension === 'anxiety' ? 'text-amber-500' : 'text-blue-500'
          }`}>
            {question.dimension === 'anxiety' ? 'Anxiety dimension' : 'Avoidance dimension'}
          </span>
        </div>
        <h2 className="font-serif text-2xl text-white">{question.text}</h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(question.dimension, option.score)}
            className="w-full p-4 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-colors text-gray-300 hover:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <button
        onClick={goBack}
        className="mt-8 text-gray-600 hover:text-white transition-colors text-sm"
      >
        ← Back
      </button>
    </div>
  );
}
