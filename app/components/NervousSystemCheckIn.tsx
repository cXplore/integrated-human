'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/lib/hooks/useAssessment';

type NervousSystemState = 'ventral' | 'sympathetic' | 'dorsal' | 'mixed';

interface StateResult {
  state: NervousSystemState;
  name: string;
  description: string;
  bodySignals: string[];
  whatHelps: string[];
  whatToAvoid: string[];
  color: string;
}

const stateResults: Record<NervousSystemState, StateResult> = {
  ventral: {
    state: 'ventral',
    name: 'Grounded & Connected',
    description: "Your nervous system is in its optimal state — the ventral vagal pathway is active. You have access to your full capacity: presence, connection, clear thinking, and appropriate response to what's happening.",
    bodySignals: [
      'Relaxed shoulders and jaw',
      'Full, easy breathing',
      'Warm hands and feet',
      'Clear thinking',
      'Able to make eye contact comfortably',
    ],
    whatHelps: [
      'This is a good time for challenging conversations',
      'Creative work and deep thinking are available',
      'Practice being present without doing',
      'Notice what brought you here — it may be useful later',
    ],
    whatToAvoid: [
      'Nothing specific — you have full access to your resources',
    ],
    color: 'emerald',
  },
  sympathetic: {
    state: 'sympathetic',
    name: 'Activated / Fight-Flight',
    description: "Your nervous system is mobilized for action. This isn't wrong — it's designed to help you respond to threat or challenge. But if you're not actually in danger, this energy has nowhere to go.",
    bodySignals: [
      'Tension in shoulders, neck, or jaw',
      'Shallow or rapid breathing',
      'Racing thoughts or mental loops',
      'Restlessness, urge to move',
      'Difficulty sitting still or focusing',
    ],
    whatHelps: [
      'Physical movement — even a short walk',
      'Shaking or trembling (like animals do after stress)',
      'Extended exhales (longer out than in)',
      'Cold water on face or wrists',
      'Orienting: slowly look around the room, naming what you see',
    ],
    whatToAvoid: [
      "More stimulation (screens, news, conflict)",
      'Forcing yourself to "calm down" (this often backfires)',
      'Making big decisions while activated',
      'Suppressing the energy — let it move through',
    ],
    color: 'amber',
  },
  dorsal: {
    state: 'dorsal',
    name: 'Shutdown / Freeze',
    description: "Your nervous system has gone into conservation mode. This is the oldest survival response — when fight or flight aren't possible, the system shuts down to preserve energy. You may feel numb, disconnected, or like nothing matters.",
    bodySignals: [
      'Heaviness in body or limbs',
      'Feeling foggy, spaced out, or disconnected',
      'Flatness — emotions feel distant or muted',
      'Low energy, difficulty moving',
      'Desire to hide or be alone',
    ],
    whatHelps: [
      'Gentle, slow movement — even just wiggling fingers and toes',
      'Warmth — blanket, warm drink, sunlight',
      'Connection with a safe person or pet',
      'Grounding: feel your feet on the floor, back against the chair',
      'Small, manageable actions — not big decisions',
    ],
    whatToAvoid: [
      "Pushing yourself to \"snap out of it\"",
      'High-intensity exercise (may be too much)',
      'Isolation — though you want it, gentle connection helps',
      'Self-criticism for how you feel',
    ],
    color: 'blue',
  },
  mixed: {
    state: 'mixed',
    name: 'Mixed State',
    description: "You're showing signs of multiple states — which is common. The nervous system doesn't always fit neat categories. You might be oscillating between activation and shutdown, or feeling activated in some ways while numb in others.",
    bodySignals: [
      'Simultaneous tension and exhaustion',
      'Wired but tired',
      'Anxious but frozen',
      'Racing mind with heavy body',
    ],
    whatHelps: [
      'Gentle movement with awareness',
      'Notice which state feels more present right now',
      'Slow down — mixed states often come from overwhelm',
      'Self-compassion — this is a hard place to be',
    ],
    whatToAvoid: [
      'Forcing resolution',
      'Overanalyzing what you feel',
      'Making major decisions',
    ],
    color: 'purple',
  },
};

interface Question {
  id: number;
  category: 'body' | 'energy' | 'mind' | 'connection';
  question: string;
  options: {
    label: string;
    state: NervousSystemState;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    category: 'body',
    question: 'Right now, how does your body feel?',
    options: [
      { label: 'Relaxed and at ease', state: 'ventral' },
      { label: 'Tense, tight, or wound up', state: 'sympathetic' },
      { label: 'Heavy, numb, or hard to feel', state: 'dorsal' },
    ],
  },
  {
    id: 2,
    category: 'body',
    question: 'Notice your breathing. What do you observe?',
    options: [
      { label: 'Full and easy, without thinking about it', state: 'ventral' },
      { label: 'Shallow, fast, or stuck in my chest', state: 'sympathetic' },
      { label: 'Barely there, or I have to remind myself to breathe', state: 'dorsal' },
    ],
  },
  {
    id: 3,
    category: 'energy',
    question: 'What best describes your energy level?',
    options: [
      { label: 'Steady, available, ready for what comes', state: 'ventral' },
      { label: 'Revved up, restless, hard to settle', state: 'sympathetic' },
      { label: 'Low, depleted, or flatlined', state: 'dorsal' },
    ],
  },
  {
    id: 4,
    category: 'mind',
    question: 'How would you describe your thoughts right now?',
    options: [
      { label: 'Clear, present, focused', state: 'ventral' },
      { label: 'Racing, looping, hard to control', state: 'sympathetic' },
      { label: 'Foggy, blank, or hard to form', state: 'dorsal' },
    ],
  },
  {
    id: 5,
    category: 'connection',
    question: 'If someone you care about walked in right now, how would you feel?',
    options: [
      { label: 'Happy to see them, open to connection', state: 'ventral' },
      { label: 'Irritable, like I might snap or need space', state: 'sympathetic' },
      { label: 'Indifferent, or like I have nothing to give', state: 'dorsal' },
    ],
  },
  {
    id: 6,
    category: 'body',
    question: 'Check your hands. Are they...',
    options: [
      { label: 'Warm and relaxed', state: 'ventral' },
      { label: 'Cold, sweaty, or clenched', state: 'sympathetic' },
      { label: 'Cold and still, or I can barely feel them', state: 'dorsal' },
    ],
  },
];

export default function NervousSystemCheckIn() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<NervousSystemState[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  // Hook for saving results
  const { saveResults } = useAssessment('nervous-system');

  const handleAnswer = (state: NervousSystemState) => {
    const newAnswers = [...answers, state];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      setStarted(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  const calculateResult = (): StateResult => {
    const counts = {
      ventral: 0,
      sympathetic: 0,
      dorsal: 0,
    };

    answers.forEach((state) => {
      if (state !== 'mixed') {
        counts[state]++;
      }
    });

    const total = answers.length;
    const ventralPercent = counts.ventral / total;
    const sympatheticPercent = counts.sympathetic / total;
    const dorsalPercent = counts.dorsal / total;

    // Determine primary state
    if (ventralPercent >= 0.6) {
      return stateResults.ventral;
    }
    if (sympatheticPercent >= 0.5) {
      return stateResults.sympathetic;
    }
    if (dorsalPercent >= 0.5) {
      return stateResults.dorsal;
    }
    // Mixed state if no clear majority
    return stateResults.mixed;
  };

  // Save results when complete
  useEffect(() => {
    if (showResults && !resultsSaved && answers.length > 0) {
      const result = calculateResult();
      const counts = {
        ventral: answers.filter(a => a === 'ventral').length,
        sympathetic: answers.filter(a => a === 'sympathetic').length,
        dorsal: answers.filter(a => a === 'dorsal').length,
      };

      saveResults({
        state: result.state,
        stateName: result.name,
        answers,
        counts,
        timestamp: new Date().toISOString(),
      }, result.name).then(saved => {
        if (saved) setResultsSaved(true);
      });
    }
  }, [showResults, resultsSaved, answers, saveResults]);

  const getStateColor = (state: NervousSystemState) => {
    switch (state) {
      case 'ventral': return 'border-emerald-600 bg-emerald-900/20';
      case 'sympathetic': return 'border-amber-600 bg-amber-900/20';
      case 'dorsal': return 'border-blue-600 bg-blue-900/20';
      case 'mixed': return 'border-purple-600 bg-purple-900/20';
    }
  };

  const getStateTextColor = (state: NervousSystemState) => {
    switch (state) {
      case 'ventral': return 'text-emerald-400';
      case 'sympathetic': return 'text-amber-400';
      case 'dorsal': return 'text-blue-400';
      case 'mixed': return 'text-purple-400';
    }
  };

  // Intro screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-white">Nervous System Check-In</h2>
          <div className="text-gray-400 leading-relaxed space-y-4 text-left">
            <p>
              Your nervous system is constantly regulating your state — moving between activation,
              calm, and shutdown depending on what it perceives as safe or threatening.
            </p>
            <p>
              This quick check-in helps you notice where you are right now. Not to judge it,
              but to work <em>with</em> your body instead of against it.
            </p>
            <p>
              There are no right answers. Just notice what's true for you in this moment.
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
            6 questions · Takes about 2 minutes
          </p>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const result = calculateResult();

    return (
      <div className="space-y-8">
        {/* State Header */}
        <div className={`text-center p-8 border ${getStateColor(result.state)}`}>
          <p className="text-gray-500 text-sm mb-2">Current State</p>
          <h2 className={`font-serif text-3xl ${getStateTextColor(result.state)} mb-4`}>
            {result.name}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            {result.description}
          </p>
        </div>

        {/* Body Signals */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">You Might Notice</h3>
          <ul className="space-y-2">
            {result.bodySignals.map((signal, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <span className="text-gray-600 mt-1">•</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>

        {/* What Helps */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">What Helps</h3>
          <ul className="space-y-2">
            {result.whatHelps.map((help, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <svg className={`w-4 h-4 ${getStateTextColor(result.state)} flex-shrink-0 mt-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {help}
              </li>
            ))}
          </ul>
        </div>

        {/* What to Avoid */}
        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h3 className="font-serif text-lg text-white mb-4">What to Avoid</h3>
          <ul className="space-y-2">
            {result.whatToAvoid.map((avoid, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {avoid}
              </li>
            ))}
          </ul>
        </div>

        {/* Context */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <h3 className="font-serif text-lg text-white mb-3">Remember</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your nervous system state isn't a personality trait — it shifts throughout
              the day based on rest, stress, connection, and hundreds of other factors.
              This check-in is a snapshot, not a diagnosis. The goal is awareness:
              when you know where you are, you can meet yourself there.
            </p>
          </div>
        </div>

        {/* Related Content */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="font-serif text-lg text-white mb-4">Go Deeper</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/posts/understanding-your-nervous-system"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Understanding Your Nervous System</h4>
              <p className="text-sm text-gray-500">The polyvagal ladder and why your body does what it does</p>
            </Link>
            <Link
              href="/posts/breathing-for-regulation"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Breathing for Regulation</h4>
              <p className="text-sm text-gray-500">Using breath to shift your state</p>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Check In Again
          </button>
          <Link
            href="/body"
            className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-center"
          >
            Explore Body
          </Link>
        </div>
      </div>
    );
  }

  // Questions
  const question = questions[currentQuestion];
  const categoryLabels = {
    body: 'Body',
    energy: 'Energy',
    mind: 'Mind',
    connection: 'Connection',
  };

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
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {categoryLabels[question.category]}
          </span>
        </div>
        <h2 className="font-serif text-2xl text-white">{question.question}</h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option.state)}
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
