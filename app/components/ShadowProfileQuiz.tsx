'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Shadow pattern types based on Jungian psychology and common shadow manifestations
type ShadowPattern =
  | 'Controller'
  | 'Pleaser'
  | 'Perfectionist'
  | 'Victim'
  | 'Rebel'
  | 'Avoider'
  | 'Overachiever'
  | 'Martyr';

interface ShadowScores {
  Controller: number;
  Pleaser: number;
  Perfectionist: number;
  Victim: number;
  Rebel: number;
  Avoider: number;
  Overachiever: number;
  Martyr: number;
}

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    scores: Partial<ShadowScores>;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "When something goes wrong in your life, your first instinct is to...",
    options: [
      {
        label: "Take charge and fix it immediately—I can't stand feeling helpless",
        scores: { Controller: 2, Overachiever: 1 }
      },
      {
        label: "Wonder what you did wrong or how you caused it",
        scores: { Victim: 2, Pleaser: 1 }
      },
      {
        label: "Withdraw until the situation resolves itself",
        scores: { Avoider: 2 }
      },
      {
        label: "Push through harder, working until you've overcome it",
        scores: { Overachiever: 2, Perfectionist: 1 }
      },
    ],
  },
  {
    id: 2,
    text: "In relationships, you most often find yourself...",
    options: [
      {
        label: "Putting others' needs first, even when it drains you",
        scores: { Pleaser: 2, Martyr: 1 }
      },
      {
        label: "Needing to be in control or having trouble trusting your partner",
        scores: { Controller: 2 }
      },
      {
        label: "Sabotaging things when they get too close or serious",
        scores: { Rebel: 2, Avoider: 1 }
      },
      {
        label: "Never feeling like you're enough for the other person",
        scores: { Perfectionist: 2, Victim: 1 }
      },
    ],
  },
  {
    id: 3,
    text: "When you think about your childhood, you recognize that you learned to...",
    options: [
      {
        label: "Take care of everyone else's emotions to keep the peace",
        scores: { Pleaser: 2, Martyr: 1 }
      },
      {
        label: "Be perfect or face criticism and disappointment",
        scores: { Perfectionist: 2, Overachiever: 1 }
      },
      {
        label: "Stay invisible, small, or quiet to stay safe",
        scores: { Avoider: 2, Victim: 1 }
      },
      {
        label: "Fight back or rebel against authority",
        scores: { Rebel: 2, Controller: 1 }
      },
    ],
  },
  {
    id: 4,
    text: "The emotional experience you're most uncomfortable feeling is...",
    options: [
      {
        label: "Anger—it feels dangerous or out of control",
        scores: { Pleaser: 2, Avoider: 1 }
      },
      {
        label: "Vulnerability—it feels like weakness",
        scores: { Controller: 2, Overachiever: 1 }
      },
      {
        label: "Failure—it's absolutely unacceptable",
        scores: { Perfectionist: 2, Overachiever: 1 }
      },
      {
        label: "Being alone—it confirms my worst fears about myself",
        scores: { Victim: 2, Pleaser: 1 }
      },
    ],
  },
  {
    id: 5,
    text: "When criticized, your typical internal reaction is...",
    options: [
      {
        label: "Immediate self-attack: they're right, I'm terrible",
        scores: { Victim: 2, Perfectionist: 1 }
      },
      {
        label: "Defensiveness and counter-attack: they're wrong, not me",
        scores: { Controller: 2, Rebel: 1 }
      },
      {
        label: "Dismiss it externally while internally obsessing",
        scores: { Perfectionist: 2, Avoider: 1 }
      },
      {
        label: "Immediately trying to fix it and regain their approval",
        scores: { Pleaser: 2, Overachiever: 1 }
      },
    ],
  },
  {
    id: 6,
    text: "Your relationship with rest and relaxation is...",
    options: [
      {
        label: "Rest feels like laziness—there's always more to do",
        scores: { Overachiever: 2, Perfectionist: 1 }
      },
      {
        label: "I only rest when I've earned it by helping others first",
        scores: { Martyr: 2, Pleaser: 1 }
      },
      {
        label: "I struggle to stop—if I'm not busy, I feel worthless",
        scores: { Overachiever: 2, Controller: 1 }
      },
      {
        label: "I often escape into rest/distraction to avoid facing things",
        scores: { Avoider: 2 }
      },
    ],
  },
  {
    id: 7,
    text: "When you achieve something significant, you tend to...",
    options: [
      {
        label: "Immediately move to the next goal without celebrating",
        scores: { Overachiever: 2, Perfectionist: 1 }
      },
      {
        label: "Attribute it to luck or timing rather than your abilities",
        scores: { Victim: 2 }
      },
      {
        label: "Find flaws in what you accomplished",
        scores: { Perfectionist: 2 }
      },
      {
        label: "Feel uncomfortable with recognition or attention",
        scores: { Avoider: 2, Martyr: 1 }
      },
    ],
  },
  {
    id: 8,
    text: "The belief you most struggle to shake is...",
    options: [
      {
        label: "If I'm not perfect, I'm worthless",
        scores: { Perfectionist: 2, Overachiever: 1 }
      },
      {
        label: "If I don't take care of everything, it will fall apart",
        scores: { Controller: 2, Martyr: 1 }
      },
      {
        label: "I don't deserve good things or can't trust when they come",
        scores: { Victim: 2 }
      },
      {
        label: "If I show my true self, I'll be rejected",
        scores: { Pleaser: 2, Avoider: 1 }
      },
    ],
  },
  {
    id: 9,
    text: "When others succeed, your honest internal response is often...",
    options: [
      {
        label: "Happy for them, then immediately comparing myself unfavorably",
        scores: { Perfectionist: 2, Victim: 1 }
      },
      {
        label: "Resentful that I've sacrificed so much for others",
        scores: { Martyr: 2, Pleaser: 1 }
      },
      {
        label: "Competitive—I need to do better than them",
        scores: { Overachiever: 2, Controller: 1 }
      },
      {
        label: "Genuine happiness—their success doesn't threaten me",
        scores: {} // Healthy response, no shadow scores
      },
    ],
  },
  {
    id: 10,
    text: "Rules and authority figures make you feel...",
    options: [
      {
        label: "Anxious to comply and gain their approval",
        scores: { Pleaser: 2 }
      },
      {
        label: "Automatically resistant—I need to do things my way",
        scores: { Rebel: 2, Controller: 1 }
      },
      {
        label: "Compelled to exceed their expectations",
        scores: { Overachiever: 2, Perfectionist: 1 }
      },
      {
        label: "Like I want to become invisible and avoid their notice",
        scores: { Avoider: 2, Victim: 1 }
      },
    ],
  },
  {
    id: 11,
    text: "In a group setting, you tend to...",
    options: [
      {
        label: "Take charge and organize things, whether asked or not",
        scores: { Controller: 2, Overachiever: 1 }
      },
      {
        label: "Make sure everyone's comfortable, often at your expense",
        scores: { Pleaser: 2, Martyr: 1 }
      },
      {
        label: "Stay on the edges and observe rather than participate",
        scores: { Avoider: 2 }
      },
      {
        label: "Challenge the group's assumptions or stir things up",
        scores: { Rebel: 2 }
      },
    ],
  },
  {
    id: 12,
    text: "When you make a mistake, you...",
    options: [
      {
        label: "Beat yourself up relentlessly—it was unacceptable",
        scores: { Perfectionist: 2, Victim: 1 }
      },
      {
        label: "Find someone or something else to blame",
        scores: { Controller: 2, Rebel: 1 }
      },
      {
        label: "Hide it and hope no one notices",
        scores: { Avoider: 2, Pleaser: 1 }
      },
      {
        label: "Immediately over-compensate by doing more",
        scores: { Overachiever: 2, Martyr: 1 }
      },
    ],
  },
  {
    id: 13,
    text: "Your self-worth is most connected to...",
    options: [
      {
        label: "How much I accomplish and achieve",
        scores: { Overachiever: 2, Perfectionist: 1 }
      },
      {
        label: "How much others need and value me",
        scores: { Martyr: 2, Pleaser: 1 }
      },
      {
        label: "How little trouble I cause or attention I draw",
        scores: { Avoider: 2, Pleaser: 1 }
      },
      {
        label: "How in control I am of myself and my environment",
        scores: { Controller: 2 }
      },
    ],
  },
  {
    id: 14,
    text: "When you need help, you typically...",
    options: [
      {
        label: "Refuse to ask—I should be able to handle it myself",
        scores: { Controller: 2, Overachiever: 1 }
      },
      {
        label: "Hint at it hoping others will notice without me asking directly",
        scores: { Victim: 2, Avoider: 1 }
      },
      {
        label: "Feel deeply guilty for needing anything from anyone",
        scores: { Martyr: 2, Pleaser: 1 }
      },
      {
        label: "Ask, but feel ashamed that I wasn't capable enough alone",
        scores: { Perfectionist: 2 }
      },
    ],
  },
  {
    id: 15,
    text: "Your relationship with boundaries is...",
    options: [
      {
        label: "I have trouble setting them—I don't want to upset anyone",
        scores: { Pleaser: 2, Avoider: 1 }
      },
      {
        label: "I have very strong walls—maybe too strong",
        scores: { Controller: 2, Rebel: 1 }
      },
      {
        label: "I give until I'm empty, then explode in resentment",
        scores: { Martyr: 2 }
      },
      {
        label: "I'm not sure what my boundaries even are",
        scores: { Victim: 2, Avoider: 1 }
      },
    ],
  },
];

const shadowDescriptions: Record<ShadowPattern, {
  name: string;
  summary: string;
  origin: string;
  manifestation: string;
  integration: string;
  relatedArticle: string;
}> = {
  Controller: {
    name: "The Controller",
    summary: "You manage anxiety through control. If you can control the environment, people, and outcomes, you feel safe. Vulnerability feels like danger.",
    origin: "Often develops when childhood felt chaotic, unsafe, or unpredictable. Control became a way to create safety in an unsafe world.",
    manifestation: "Difficulty delegating, micromanaging, rigidity, anxiety when plans change, trouble trusting others, needing to be right.",
    integration: "Practice surrendering small things. Learn to sit with uncertainty. Recognize that vulnerability is strength, not weakness.",
    relatedArticle: "reclaiming-your-aggression"
  },
  Pleaser: {
    name: "The People Pleaser",
    summary: "You manage fear through accommodation. Your safety comes from being needed, liked, and approved of. Saying no feels dangerous.",
    origin: "Often develops when love was conditional on being 'good' or when you had to manage a parent's emotions to stay safe.",
    manifestation: "Difficulty saying no, resentment, loss of self, chronic exhaustion, anxiety about others' opinions, fawning response to conflict.",
    integration: "Practice saying no in small ways. Notice when you abandon yourself. Recognize that you can't please everyone without losing yourself.",
    relatedArticle: "the-anger-you-wont-let-yourself-feel"
  },
  Perfectionist: {
    name: "The Perfectionist",
    summary: "You manage shame through performance. If you can be perfect, the criticism (external or internal) will stop. Mistakes feel catastrophic.",
    origin: "Often develops when love or acceptance was tied to achievement, or when criticism was harsh and unpredictable.",
    manifestation: "Procrastination, analysis paralysis, harsh inner critic, never feeling 'good enough,' difficulty finishing things, all-or-nothing thinking.",
    integration: "Practice 'good enough.' Make small mistakes intentionally. Notice the perfectionism is trying to protect you from deeper shame.",
    relatedArticle: "the-shame-beneath-the-surface"
  },
  Victim: {
    name: "The Victim",
    summary: "You manage powerlessness by externalizing. Life happens to you rather than through you. Taking responsibility feels unsafe because it means things could be your fault.",
    origin: "Often develops when you genuinely were powerless as a child, or when taking action was punished or futile.",
    manifestation: "Learned helplessness, blame, 'why does this always happen to me,' difficulty seeing your role in situations, dependency.",
    integration: "Practice small acts of agency. Notice where you do have power. Separate past helplessness from current capability.",
    relatedArticle: "how-to-do-shadow-work-complete-guide"
  },
  Rebel: {
    name: "The Rebel",
    summary: "You manage pain through opposition. If you're fighting against something, you don't have to feel what's underneath. Authority triggers automatic resistance.",
    origin: "Often develops when authority figures were controlling, hypocritical, or harmful. Rebellion was a form of self-preservation.",
    manifestation: "Automatic resistance to rules, difficulty with structure, self-sabotage, pushing away people who get close, contrarianism.",
    integration: "Ask: 'What am I fighting against? What would I be fighting for?' Notice when rebellion is reaction rather than choice.",
    relatedArticle: "reclaiming-your-aggression"
  },
  Avoider: {
    name: "The Avoider",
    summary: "You manage fear through withdrawal. If you don't engage, you can't be hurt. Visibility and vulnerability feel dangerous.",
    origin: "Often develops when speaking up or being visible led to punishment, humiliation, or abandonment.",
    manifestation: "Procrastination, numbing behaviors, difficulty with confrontation, staying small, dissociation, escape into fantasy or substances.",
    integration: "Practice being present in discomfort. Take small visible actions. Notice that hiding has its own costs.",
    relatedArticle: "when-meditation-doesnt-work"
  },
  Overachiever: {
    name: "The Overachiever",
    summary: "You manage worthlessness through performance. Your value comes from what you do, not who you are. Rest feels like death.",
    origin: "Often develops when love or acceptance was earned through achievement, or when you needed external validation to feel okay.",
    manifestation: "Workaholic patterns, inability to rest, tying identity to accomplishment, burnout, never feeling satisfied, competitive comparison.",
    integration: "Practice being without doing. Ask: 'Who am I without my achievements?' Learn that you have inherent worth.",
    relatedArticle: "the-shame-beneath-the-surface"
  },
  Martyr: {
    name: "The Martyr",
    summary: "You manage unworthiness through sacrifice. You earn your place by giving until you're empty. Taking care of yourself feels selfish.",
    origin: "Often develops when you were parentified as a child or when your needs were consistently deprioritized in favor of others'.",
    manifestation: "Chronic self-sacrifice, inability to receive, resentment, using suffering as currency, guilt when prioritizing self.",
    integration: "Practice receiving without giving back immediately. Notice the resentment—it's trying to tell you something. Self-care isn't selfish.",
    relatedArticle: "the-anger-you-wont-let-yourself-feel"
  },
};

function RadarChart({
  scores,
  size = 320
}: {
  scores: ShadowScores;
  size?: number;
}) {
  const labels = Object.keys(scores) as ShadowPattern[];
  const values = Object.values(scores);
  const maxValue = Math.max(...values, 1);
  const center = size / 2;
  const radius = (size / 2) - 50;

  const angleStep = (2 * Math.PI) / labels.length;

  const points = values.map((value, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const normalizedValue = value / maxValue;
    const x = center + radius * normalizedValue * Math.cos(angle);
    const y = center + radius * normalizedValue * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1].map((factor) => (
    <circle
      key={factor}
      cx={center}
      cy={center}
      r={radius * factor}
      fill="none"
      stroke="rgb(63, 63, 70)"
      strokeWidth="1"
    />
  ));

  const axes = labels.map((label, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    const labelX = center + (radius + 30) * Math.cos(angle);
    const labelY = center + (radius + 30) * Math.sin(angle);

    return (
      <g key={label}>
        <line
          x1={center}
          y1={center}
          x2={x2}
          y2={y2}
          stroke="rgb(63, 63, 70)"
          strokeWidth="1"
        />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgb(161, 161, 170)"
          fontSize="10"
          className="font-medium"
        >
          {label}
        </text>
      </g>
    );
  });

  return (
    <svg width={size} height={size} className="mx-auto">
      {gridCircles}
      {axes}
      <polygon
        points={points}
        fill="rgba(139, 92, 246, 0.3)"
        stroke="rgb(139, 92, 246)"
        strokeWidth="2"
      />
      {values.map((value, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const normalizedValue = value / maxValue;
        const x = center + radius * normalizedValue * Math.cos(angle);
        const y = center + radius * normalizedValue * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="rgb(139, 92, 246)"
          />
        );
      })}
    </svg>
  );
}

function ShadowResult({
  pattern,
  score,
  maxScore,
  rank
}: {
  pattern: ShadowPattern;
  score: number;
  maxScore: number;
  rank: number;
}) {
  const description = shadowDescriptions[pattern];
  const percentage = Math.round((score / maxScore) * 100);
  const isTop = rank <= 2;

  return (
    <div className={`border p-5 ${isTop ? 'border-violet-700 bg-violet-950/30' : 'border-zinc-800 bg-zinc-900/50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isTop && (
            <span className="text-xs px-2 py-1 bg-violet-900 text-violet-300 rounded">
              {rank === 1 ? 'Primary' : 'Secondary'}
            </span>
          )}
          <h4 className="font-serif text-lg text-white">{description.name}</h4>
        </div>
        <span className={`text-sm font-medium ${
          percentage >= 70 ? 'text-violet-400' :
          percentage >= 40 ? 'text-yellow-400' : 'text-gray-400'
        }`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-zinc-800 h-2 mb-4">
        <div
          className="h-full transition-all duration-500 bg-violet-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-gray-300 text-sm mb-3">{description.summary}</p>

      {isTop && (
        <>
          <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
            <div>
              <h5 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Origin</h5>
              <p className="text-sm text-gray-400">{description.origin}</p>
            </div>
            <div>
              <h5 className="text-xs uppercase tracking-wider text-gray-500 mb-1">How It Shows Up</h5>
              <p className="text-sm text-gray-400">{description.manifestation}</p>
            </div>
            <div>
              <h5 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Integration Path</h5>
              <p className="text-sm text-gray-400">{description.integration}</p>
            </div>
          </div>
          <Link
            href={`/posts/${description.relatedArticle}`}
            className="inline-block mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Read related article →
          </Link>
        </>
      )}
    </div>
  );
}

export default function ShadowProfileQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<ShadowScores>({
    Controller: 0,
    Pleaser: 0,
    Perfectionist: 0,
    Victim: 0,
    Rebel: 0,
    Avoider: 0,
    Overachiever: 0,
    Martyr: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);

  const handleSelect = (optionScores: Partial<ShadowScores>) => {
    const newScores = { ...scores };

    Object.entries(optionScores).forEach(([pattern, value]) => {
      newScores[pattern as ShadowPattern] += value || 0;
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
      Controller: 0,
      Pleaser: 0,
      Perfectionist: 0,
      Victim: 0,
      Rebel: 0,
      Avoider: 0,
      Overachiever: 0,
      Martyr: 0,
    });
    setShowResults(false);
  };

  const sortedPatterns = useMemo(() => {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1]) as [ShadowPattern, number][];
  }, [scores]);

  const maxScore = useMemo(() => {
    return Math.max(...Object.values(scores), 1);
  }, [scores]);

  // Start screen
  if (!started) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-white mb-4">Shadow Profile Assessment</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          This assessment reveals your primary shadow patterns—the unconscious strategies you
          developed to cope with early pain that now limit your growth.
        </p>
        <div className="bg-zinc-900 border border-zinc-800 p-6 mb-8 max-w-md mx-auto text-left">
          <h3 className="text-white font-medium mb-3">What to expect:</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• 15 questions, about 5 minutes</li>
            <li>• No right or wrong answers—be honest</li>
            <li>• Results show your dominant shadow patterns</li>
            <li>• Includes personalized integration guidance</li>
          </ul>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium"
        >
          Begin Assessment
        </button>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const topPattern = sortedPatterns[0][0];
    const secondPattern = sortedPatterns[1][0];

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-white mb-2">Your Shadow Profile</h2>
          <p className="text-gray-400">
            Primary pattern: <span className="text-violet-400">{shadowDescriptions[topPattern].name}</span>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Secondary pattern: <span className="text-violet-300">{shadowDescriptions[secondPattern].name}</span>
          </p>
        </div>

        {/* Radar Chart */}
        <div className="mb-8">
          <RadarChart scores={scores} />
        </div>

        {/* Understanding */}
        <div className="bg-zinc-900 border border-violet-800 p-6">
          <h3 className="font-serif text-lg text-white mb-3">Understanding Your Results</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Everyone has shadow material—parts of ourselves we've rejected to survive. These patterns
            aren't flaws; they're adaptations that helped you cope with early experiences. The goal
            isn't to eliminate them but to integrate them—to understand their origins, recognize when
            they're running the show, and develop conscious choice about how you respond.
          </p>
        </div>

        {/* Shadow Patterns */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-white">Your Shadow Patterns</h3>
          {sortedPatterns.map(([pattern, score], index) => (
            <ShadowResult
              key={pattern}
              pattern={pattern}
              score={score}
              maxScore={maxScore}
              rank={index + 1}
            />
          ))}
        </div>

        {/* Next Steps */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 mt-8">
          <h3 className="font-serif text-lg text-white mb-4">Begin Your Shadow Work</h3>
          <p className="text-gray-400 text-sm mb-6">
            Understanding your patterns is the first step. Here are resources to go deeper:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/courses/shadow-work-foundations"
              className="p-4 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Shadow Work Foundations</h4>
              <p className="text-sm text-gray-500">5-module course on meeting and integrating your shadow</p>
            </Link>
            <Link
              href="/posts/how-to-do-shadow-work-complete-guide"
              className="p-4 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Complete Shadow Work Guide</h4>
              <p className="text-sm text-gray-500">Free comprehensive article with exercises</p>
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Take Quiz Again
          </button>
          <Link
            href="/courses/shadow-work-foundations"
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors text-center"
          >
            Explore Shadow Work Course
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
              index < currentQuestion ? 'bg-violet-500' :
              index === currentQuestion ? 'bg-gray-500' : 'bg-zinc-800'
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
