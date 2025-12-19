'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Polyvagal-informed nervous system states
type NervousSystemState =
  | 'Ventral Vagal'
  | 'Sympathetic'
  | 'Dorsal Vagal'
  | 'Freeze'
  | 'Fight'
  | 'Flight'
  | 'Fawn';

// For scoring, we'll use the broader categories
type StateCategory = 'Regulated' | 'Hyperarousal' | 'Hypoarousal' | 'Mixed';

interface StateScores {
  Regulated: number;  // Ventral vagal - safe, social, present
  Hyperarousal: number;  // Sympathetic - fight/flight, anxious, activated
  Hypoarousal: number;  // Dorsal vagal - freeze, shutdown, dissociated
  Fawn: number;  // People-pleasing as survival response
}

interface Question {
  id: number;
  category: 'physical' | 'emotional' | 'relational' | 'cognitive' | 'behavioral';
  text: string;
  options: {
    label: string;
    scores: Partial<StateScores>;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    category: 'physical',
    text: "Right now, my body feels...",
    options: [
      {
        label: "Relaxed, grounded, and present",
        scores: { Regulated: 3 }
      },
      {
        label: "Tense, restless, or on edge",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Heavy, numb, or disconnected",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Alert and attentive to others' needs",
        scores: { Fawn: 2, Hyperarousal: 1 }
      },
    ],
  },
  {
    id: 2,
    category: 'physical',
    text: "My breathing is typically...",
    options: [
      {
        label: "Slow, deep, and easy",
        scores: { Regulated: 3 }
      },
      {
        label: "Shallow, quick, or sometimes held",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "So shallow I sometimes forget to breathe",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Changes depending on who I'm around",
        scores: { Fawn: 2, Hyperarousal: 1 }
      },
    ],
  },
  {
    id: 3,
    category: 'emotional',
    text: "When something stressful happens, I usually...",
    options: [
      {
        label: "Feel the stress, process it, and move through it",
        scores: { Regulated: 3 }
      },
      {
        label: "Get anxious, angry, or want to fix it immediately",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Shut down, go blank, or feel nothing",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Focus on managing everyone else's reactions",
        scores: { Fawn: 3 }
      },
    ],
  },
  {
    id: 4,
    category: 'cognitive',
    text: "My typical thought patterns are...",
    options: [
      {
        label: "Clear, present, and able to focus",
        scores: { Regulated: 3 }
      },
      {
        label: "Racing, worried, or hypervigilant",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Foggy, blank, or difficulty concentrating",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Constantly anticipating what others think or need",
        scores: { Fawn: 3 }
      },
    ],
  },
  {
    id: 5,
    category: 'relational',
    text: "In relationships, I tend to...",
    options: [
      {
        label: "Feel connected, curious, and open",
        scores: { Regulated: 3 }
      },
      {
        label: "Feel guarded, ready to defend, or anxiously attached",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Feel distant, detached, or like I want to disappear",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Focus on pleasing others and avoiding conflict",
        scores: { Fawn: 3 }
      },
    ],
  },
  {
    id: 6,
    category: 'physical',
    text: "My sleep is typically...",
    options: [
      {
        label: "Restful—I fall asleep easily and wake refreshed",
        scores: { Regulated: 3 }
      },
      {
        label: "Restless—I have trouble falling asleep or wake anxious",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Excessive—I sleep too much but still feel exhausted",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Light—I wake easily if someone might need me",
        scores: { Fawn: 2, Hyperarousal: 1 }
      },
    ],
  },
  {
    id: 7,
    category: 'behavioral',
    text: "Under pressure, my go-to response is...",
    options: [
      {
        label: "Stay calm and respond thoughtfully",
        scores: { Regulated: 3 }
      },
      {
        label: "Take action, push harder, or get confrontational",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Withdraw, avoid, or go numb",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Try to smooth things over and keep everyone calm",
        scores: { Fawn: 3 }
      },
    ],
  },
  {
    id: 8,
    category: 'emotional',
    text: "My emotional baseline is usually...",
    options: [
      {
        label: "Generally content with a full range of emotions",
        scores: { Regulated: 3 }
      },
      {
        label: "Anxious, irritable, or easily overwhelmed",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Flat, empty, or like nothing matters much",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Dependent on how others around me are feeling",
        scores: { Fawn: 3 }
      },
    ],
  },
  {
    id: 9,
    category: 'physical',
    text: "My energy levels throughout the day are...",
    options: [
      {
        label: "Steady and sustainable",
        scores: { Regulated: 3 }
      },
      {
        label: "Highs and crashes—wired then exhausted",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Consistently low or depleted",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "High when I'm around others, crashed when alone",
        scores: { Fawn: 2, Hypoarousal: 1 }
      },
    ],
  },
  {
    id: 10,
    category: 'cognitive',
    text: "When I think about the future, I feel...",
    options: [
      {
        label: "Hopeful and engaged",
        scores: { Regulated: 3 }
      },
      {
        label: "Worried, planning for threats, or catastrophizing",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Nothing—can't really imagine or connect to it",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "Concerned about how I'll meet others' expectations",
        scores: { Fawn: 2, Hyperarousal: 1 }
      },
    ],
  },
  {
    id: 11,
    category: 'relational',
    text: "When conflict arises, I typically...",
    options: [
      {
        label: "Stay present and work toward resolution",
        scores: { Regulated: 3 }
      },
      {
        label: "Get activated—heart racing, ready to fight or flee",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "Shut down, dissociate, or become compliant",
        scores: { Hypoarousal: 2, Fawn: 1 }
      },
      {
        label: "Immediately try to fix it and make everyone okay",
        scores: { Fawn: 3 }
      },
    ],
  },
  {
    id: 12,
    category: 'behavioral',
    text: "My approach to self-care and rest is...",
    options: [
      {
        label: "I can rest without guilt and refuel effectively",
        scores: { Regulated: 3 }
      },
      {
        label: "Rest feels impossible—I can't slow down",
        scores: { Hyperarousal: 3 }
      },
      {
        label: "I escape into numbing activities (scrolling, sleeping, etc.)",
        scores: { Hypoarousal: 3 }
      },
      {
        label: "I only rest after everyone else's needs are met",
        scores: { Fawn: 3 }
      },
    ],
  },
];

const stateDescriptions: Record<keyof StateScores, {
  name: string;
  polyvagalName: string;
  summary: string;
  physicalSigns: string[];
  emotionalSigns: string[];
  regulation: string[];
  color: string;
}> = {
  Regulated: {
    name: "Regulated / Safe",
    polyvagalName: "Ventral Vagal",
    summary: "You're in a grounded, connected state. Your nervous system feels safe enough to engage socially, rest appropriately, and respond thoughtfully rather than react automatically.",
    physicalSigns: [
      "Relaxed muscles and soft belly",
      "Full, easy breathing",
      "Stable heart rate",
      "Clear eyes and expressive face",
    ],
    emotionalSigns: [
      "Curious and open",
      "Able to feel a range of emotions",
      "Connected to yourself and others",
      "Hopeful about the future",
    ],
    regulation: [
      "Maintain this state through connection, rest, and embodiment practices",
      "Notice what helps you return here when dysregulated",
      "Your regulated state is the foundation for all growth work",
    ],
    color: "emerald",
  },
  Hyperarousal: {
    name: "Activated / Fight-Flight",
    polyvagalName: "Sympathetic Activation",
    summary: "Your nervous system is in survival mode—perceiving threat and mobilizing to fight or flee. This might show up as anxiety, anger, restlessness, or hypervigilance.",
    physicalSigns: [
      "Muscle tension, especially jaw and shoulders",
      "Shallow, quick breathing",
      "Racing heart or pounding pulse",
      "Restlessness or inability to sit still",
    ],
    emotionalSigns: [
      "Anxious, worried, or on edge",
      "Irritable or quick to anger",
      "Hypervigilant—scanning for threats",
      "Difficulty relaxing or being present",
    ],
    regulation: [
      "Extended exhale breathing (longer exhale than inhale)",
      "Physical movement to discharge the activation",
      "Grounding through senses: cold water, weighted blanket",
      "Orienting to safety: look around and name what's safe",
    ],
    color: "orange",
  },
  Hypoarousal: {
    name: "Shut Down / Freeze",
    polyvagalName: "Dorsal Vagal",
    summary: "Your nervous system has collapsed into conservation mode—the oldest survival response. This can feel like numbness, disconnection, depression, or dissociation.",
    physicalSigns: [
      "Low energy or chronic fatigue",
      "Heaviness in body or limbs",
      "Shallow, minimal breathing",
      "Feeling disconnected from your body",
    ],
    emotionalSigns: [
      "Numb or emotionally flat",
      "Hopeless or disconnected from meaning",
      "Difficulty accessing joy or interest",
      "Sense of being 'not quite here'",
    ],
    regulation: [
      "Gentle movement: walking, stretching, shaking",
      "Stimulating the senses: cold water, strong smells",
      "Social engagement: safe connection with others",
      "Gradual activation—not forcing, but inviting energy back",
    ],
    color: "blue",
  },
  Fawn: {
    name: "Fawn / People-Please",
    polyvagalName: "Social Survival Response",
    summary: "You've learned to manage threat by appeasing others, reading their needs, and prioritizing their comfort over your own. This is often a combination of activation (hypervigilance to others) and collapse (abandoning self).",
    physicalSigns: [
      "Tension that releases when alone",
      "Body posture that mirrors or accommodates others",
      "Hyperawareness of others' body language",
      "Exhaustion after social interaction",
    ],
    emotionalSigns: [
      "Anxiety about others' perception of you",
      "Difficulty knowing your own feelings or needs",
      "Resentment that builds under compliance",
      "Loss of sense of self in relationships",
    ],
    regulation: [
      "Practice saying no in small, safe situations",
      "Notice your own body sensations and needs",
      "Take space to reconnect with yourself",
      "Work on knowing you're allowed to exist without earning it",
    ],
    color: "violet",
  },
};

function StateBar({
  state,
  score,
  maxScore,
  isHighest
}: {
  state: keyof StateScores;
  score: number;
  maxScore: number;
  isHighest: boolean;
}) {
  const description = stateDescriptions[state];
  const percentage = Math.round((score / maxScore) * 100);

  const colorClasses = {
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
  };

  const textColorClasses = {
    emerald: 'text-emerald-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
  };

  return (
    <div className={`p-4 border ${isHighest ? 'border-zinc-600 bg-zinc-900/80' : 'border-zinc-800 bg-zinc-900/30'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isHighest && (
            <span className={`text-xs px-2 py-0.5 bg-zinc-800 ${textColorClasses[description.color as keyof typeof textColorClasses]}`}>
              Primary
            </span>
          )}
          <h4 className="font-medium text-white">{description.name}</h4>
        </div>
        <span className={`text-sm ${textColorClasses[description.color as keyof typeof textColorClasses]}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-zinc-800 h-2">
        <div
          className={`h-full transition-all duration-500 ${colorClasses[description.color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {description.polyvagalName}
      </p>
    </div>
  );
}

function StateDetail({
  state
}: {
  state: keyof StateScores;
}) {
  const description = stateDescriptions[state];

  const borderColorClasses = {
    emerald: 'border-emerald-800',
    orange: 'border-orange-800',
    blue: 'border-blue-800',
    violet: 'border-violet-800',
  };

  const bgColorClasses = {
    emerald: 'bg-emerald-950/30',
    orange: 'bg-orange-950/30',
    blue: 'bg-blue-950/30',
    violet: 'bg-violet-950/30',
  };

  return (
    <div className={`border p-6 ${borderColorClasses[description.color as keyof typeof borderColorClasses]} ${bgColorClasses[description.color as keyof typeof bgColorClasses]}`}>
      <h3 className="font-serif text-xl text-white mb-3">{description.name}</h3>
      <p className="text-gray-300 mb-6">{description.summary}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Physical Signs</h4>
          <ul className="space-y-1">
            {description.physicalSigns.map((sign, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-gray-600 mt-1">•</span>
                {sign}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">Emotional Signs</h4>
          <ul className="space-y-1">
            {description.emotionalSigns.map((sign, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-gray-600 mt-1">•</span>
                {sign}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-700">
        <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
          {state === 'Regulated' ? 'How to Maintain' : 'How to Regulate'}
        </h4>
        <ul className="space-y-1">
          {description.regulation.map((tip, i) => (
            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
              <span className="text-gray-600 mt-1">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function NervousSystemQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<StateScores>({
    Regulated: 0,
    Hyperarousal: 0,
    Hypoarousal: 0,
    Fawn: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);

  const handleSelect = (optionScores: Partial<StateScores>) => {
    const newScores = { ...scores };

    Object.entries(optionScores).forEach(([state, value]) => {
      newScores[state as keyof StateScores] += value || 0;
    });

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
    setScores({
      Regulated: 0,
      Hyperarousal: 0,
      Hypoarousal: 0,
      Fawn: 0,
    });
    setShowResults(false);
  };

  const sortedStates = useMemo(() => {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1]) as [keyof StateScores, number][];
  }, [scores]);

  const maxScore = useMemo(() => {
    return Math.max(...Object.values(scores), 1);
  }, [scores]);

  const primaryState = sortedStates[0][0];

  // Start screen
  if (!started) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-white mb-4">Nervous System State Check</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Understand your nervous system's current state and default patterns.
          Based on polyvagal theory, this assessment reveals how your body is
          responding to life—and what it needs.
        </p>
        <div className="bg-zinc-900 border border-zinc-800 p-6 mb-8 max-w-md mx-auto text-left">
          <h3 className="text-white font-medium mb-3">The Four States:</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <strong className="text-emerald-400">Regulated</strong> — Safe, connected, present
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <strong className="text-orange-400">Fight/Flight</strong> — Activated, anxious, mobilized
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <strong className="text-blue-400">Freeze</strong> — Shut down, numb, collapsed
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
              <strong className="text-violet-400">Fawn</strong> — Appeasing, hypervigilant to others
            </li>
          </ul>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium"
        >
          Begin Assessment
        </button>
        <p className="mt-4 text-xs text-gray-600">12 questions, ~3 minutes</p>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-white mb-2">Your Nervous System Profile</h2>
          <p className="text-gray-400">
            Primary state: <span className={`${
              primaryState === 'Regulated' ? 'text-emerald-400' :
              primaryState === 'Hyperarousal' ? 'text-orange-400' :
              primaryState === 'Hypoarousal' ? 'text-blue-400' :
              'text-violet-400'
            }`}>{stateDescriptions[primaryState].name}</span>
          </p>
        </div>

        {/* State Bars */}
        <div className="space-y-3">
          {sortedStates.map(([state, score], index) => (
            <StateBar
              key={state}
              state={state}
              score={score}
              maxScore={maxScore}
              isHighest={index === 0}
            />
          ))}
        </div>

        {/* Primary State Detail */}
        <StateDetail state={primaryState} />

        {/* Context */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-3">Understanding Your Results</h3>
          <div className="text-sm text-gray-400 space-y-3">
            <p>
              Your nervous system state isn't fixed—it's always responding to cues of safety and threat.
              This assessment reflects your current baseline pattern, not a permanent condition.
            </p>
            <p>
              The goal isn't to be "always regulated" (that's not realistic). The goal is to:
            </p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Recognize which state you're in</li>
              <li>Understand what your nervous system needs</li>
              <li>Build capacity to return to regulation more easily</li>
              <li>Expand your "window of tolerance"</li>
            </ul>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">Go Deeper</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/courses/nervous-system-mastery"
              className="p-4 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Nervous System Mastery</h4>
              <p className="text-sm text-gray-500">Learn to regulate, co-regulate, and expand capacity</p>
            </Link>
            <Link
              href="/free"
              className="p-4 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Nervous System Reset Guide</h4>
              <p className="text-sm text-gray-500">Free 14-day regulation protocol</p>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Take Assessment Again
          </button>
          <Link
            href="/courses/nervous-system-mastery"
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors text-center"
          >
            Explore Nervous System Course
          </Link>
        </div>
      </div>
    );
  }

  // Questions
  const question = questions[currentQuestion];
  const categoryLabels = {
    physical: 'Body',
    emotional: 'Emotions',
    relational: 'Relationships',
    cognitive: 'Thoughts',
    behavioral: 'Behavior',
  };

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 transition-colors ${
              index < currentQuestion ? 'bg-emerald-500' :
              index === currentQuestion ? 'bg-gray-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-400">
            {categoryLabels[question.category]}
          </span>
        </div>
        <h2 className="font-serif text-2xl text-white">{question.text}</h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option.scores)}
            className="w-full p-4 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-colors text-gray-300 hover:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <button
        onClick={goBack}
        className="mt-6 text-gray-500 hover:text-white transition-colors text-sm"
      >
        ← Back
      </button>
    </div>
  );
}
