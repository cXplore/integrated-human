'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Archetype definitions
type MasculineArchetype = 'King' | 'Warrior' | 'Magician' | 'Lover';
type FeminineArchetype = 'Queen' | 'Mother' | 'Lover' | 'Maiden' | 'Huntress' | 'Mystic' | 'WildWoman';
type Gender = 'male' | 'female' | null;

interface ArchetypeScores {
  masculine: Record<MasculineArchetype, number>;
  feminine: Record<FeminineArchetype, number>;
}

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    scores: Partial<{
      masculine: Partial<Record<MasculineArchetype, number>>;
      feminine: Partial<Record<FeminineArchetype, number>>;
    }>;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "When facing a difficult situation, I typically...",
    options: [
      {
        label: "Take charge and create order out of chaos",
        scores: { masculine: { King: 2 }, feminine: { Queen: 2 } }
      },
      {
        label: "Fight through it with discipline and determination",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 2 } }
      },
      {
        label: "Analyze it from multiple angles to understand what's really happening",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 2 } }
      },
      {
        label: "Feel into it deeply and connect with what it means",
        scores: { masculine: { Lover: 2 }, feminine: { Lover: 2 } }
      },
    ],
  },
  {
    id: 2,
    text: "In relationships, I'm most comfortable when...",
    options: [
      {
        label: "I can nurture and help others grow",
        scores: { feminine: { Mother: 2 }, masculine: { King: 1 } }
      },
      {
        label: "I maintain my independence and pursue my own goals",
        scores: { feminine: { Huntress: 2 }, masculine: { Warrior: 1 } }
      },
      {
        label: "There's deep emotional connection and passion",
        scores: { feminine: { Lover: 2 }, masculine: { Lover: 2 } }
      },
      {
        label: "I can be vulnerable and open to new experiences",
        scores: { feminine: { Maiden: 2 }, masculine: { Lover: 1 } }
      },
    ],
  },
  {
    id: 3,
    text: "My approach to personal power is...",
    options: [
      {
        label: "Creating stability and blessing others with what I have",
        scores: { masculine: { King: 2 }, feminine: { Queen: 2 } }
      },
      {
        label: "Setting clear boundaries and defending what matters",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 2 } }
      },
      {
        label: "Understanding hidden patterns and facilitating transformation",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 2 } }
      },
      {
        label: "Refusing to be tamed or controlled by anyone",
        scores: { feminine: { WildWoman: 2 }, masculine: { Warrior: 1 } }
      },
    ],
  },
  {
    id: 4,
    text: "When I'm at my best, I...",
    options: [
      {
        label: "Stay centered and calm while everything swirls around me",
        scores: { masculine: { King: 2 }, feminine: { Queen: 2, Mystic: 1 } }
      },
      {
        label: "Feel fully alive in my body and senses",
        scores: { masculine: { Lover: 2 }, feminine: { Lover: 2, WildWoman: 1 } }
      },
      {
        label: "See what others miss and help bring awareness",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 2 } }
      },
      {
        label: "Take decisive action toward what I believe in",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 2 } }
      },
    ],
  },
  {
    id: 5,
    text: "My shadow side often shows up as...",
    options: [
      {
        label: "Trying to control everything or abdicating responsibility",
        scores: { masculine: { King: 2 }, feminine: { Queen: 2 } }
      },
      {
        label: "Being aggressive/cruel or unable to assert myself",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 1 } }
      },
      {
        label: "Manipulating with knowledge or pretending not to know",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 1 } }
      },
      {
        label: "Chasing intensity addictively or being emotionally numb",
        scores: { masculine: { Lover: 2 }, feminine: { Lover: 2 } }
      },
    ],
  },
  {
    id: 6,
    text: "I feel most fulfilled when...",
    options: [
      {
        label: "I help others flourish and create conditions for growth",
        scores: { feminine: { Mother: 2 }, masculine: { King: 1 } }
      },
      {
        label: "I'm connected to something sacred or deeply meaningful",
        scores: { feminine: { Mystic: 2 }, masculine: { Magician: 1 } }
      },
      {
        label: "I'm expressing my wild, untameable nature",
        scores: { feminine: { WildWoman: 2 }, masculine: { Lover: 1 } }
      },
      {
        label: "I'm open to beauty and wonder in ordinary moments",
        scores: { feminine: { Maiden: 2 }, masculine: { Lover: 1 } }
      },
    ],
  },
  {
    id: 7,
    text: "In conflict, I tend to...",
    options: [
      {
        label: "Hold my ground with clear boundaries",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 2 } }
      },
      {
        label: "Try to understand all perspectives and find truth",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 1 } }
      },
      {
        label: "Express my feelings passionately (maybe too passionately)",
        scores: { feminine: { WildWoman: 2 }, masculine: { Lover: 1 } }
      },
      {
        label: "Seek harmony and connection despite differences",
        scores: { feminine: { Lover: 2 }, masculine: { Lover: 1 } }
      },
    ],
  },
  {
    id: 8,
    text: "My relationship with solitude is...",
    options: [
      {
        label: "I treasure it for inner reflection and spiritual connection",
        scores: { feminine: { Mystic: 2 }, masculine: { Magician: 1 } }
      },
      {
        label: "I'm comfortable alone and don't need others to complete me",
        scores: { feminine: { Huntress: 2 }, masculine: { Warrior: 1 } }
      },
      {
        label: "I prefer connection but can find peace in stillness",
        scores: { feminine: { Queen: 1, Maiden: 1 }, masculine: { King: 1 } }
      },
      {
        label: "I crave connection and intensity with others",
        scores: { feminine: { Lover: 2 }, masculine: { Lover: 2 } }
      },
    ],
  },
  {
    id: 9,
    text: "When others come to me with problems, I...",
    options: [
      {
        label: "Create a safe space for them to figure it out",
        scores: { feminine: { Mother: 2 }, masculine: { King: 1 } }
      },
      {
        label: "Help them see what they're not seeing",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 1 } }
      },
      {
        label: "Feel their pain deeply alongside them",
        scores: { masculine: { Lover: 2 }, feminine: { Lover: 2 } }
      },
      {
        label: "Help them take action and fight for themselves",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 1 } }
      },
    ],
  },
  {
    id: 10,
    text: "My sense of self-worth comes from...",
    options: [
      {
        label: "Knowing my inherent value without needing external validation",
        scores: { feminine: { Queen: 2 }, masculine: { King: 2 } }
      },
      {
        label: "What I can give and nurture in others",
        scores: { feminine: { Mother: 2 } }
      },
      {
        label: "My capacity for deep feeling and connection",
        scores: { feminine: { Lover: 2 }, masculine: { Lover: 2 } }
      },
      {
        label: "My independence and ability to stand alone",
        scores: { feminine: { Huntress: 2 }, masculine: { Warrior: 1 } }
      },
    ],
  },
  {
    id: 11,
    text: "When I encounter something new and unknown, I...",
    options: [
      {
        label: "Approach it with openness and wonder",
        scores: { feminine: { Maiden: 2 }, masculine: { Lover: 1 } }
      },
      {
        label: "Analyze and understand it before engaging",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 1 } }
      },
      {
        label: "Assess if it's a threat to what I protect",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 1 } }
      },
      {
        label: "Consider how it fits into the bigger picture",
        scores: { masculine: { King: 2 }, feminine: { Queen: 1 } }
      },
    ],
  },
  {
    id: 12,
    text: "My relationship with intensity and chaos is...",
    options: [
      {
        label: "I can channel it creatively without being consumed",
        scores: { feminine: { WildWoman: 2 }, masculine: { Lover: 1 } }
      },
      {
        label: "I bring order to it through my presence",
        scores: { masculine: { King: 2 }, feminine: { Queen: 2 } }
      },
      {
        label: "I observe it with detachment to understand it",
        scores: { masculine: { Magician: 2 }, feminine: { Mystic: 1 } }
      },
      {
        label: "I fight through it with discipline",
        scores: { masculine: { Warrior: 2 }, feminine: { Huntress: 1 } }
      },
    ],
  },
];

const archetypeDescriptions = {
  masculine: {
    King: {
      name: "King",
      mature: "Creates order and calm. Blesses others' gifts. Takes responsibility without martyrdom. Provides structure and stability.",
      shadow: "The Tyrant (demands to be center) or The Weakling (abdicates responsibility)",
      article: "the-four-masculine-archetypes"
    },
    Warrior: {
      name: "Warrior",
      mature: "Focused aggression in service of purpose. Disciplined, boundaried, decisive under pressure. Loyal to principles.",
      shadow: "The Sadist (enjoys cruelty) or The Masochist (can't fight for self)",
      article: "the-four-masculine-archetypes"
    },
    Magician: {
      name: "Magician",
      mature: "Sees beneath the surface. Guides transformation. Brings awareness to unconscious patterns. Holds knowledge as gift.",
      shadow: "The Manipulator (uses knowledge to control) or The Innocent (pretends not to know)",
      article: "the-four-masculine-archetypes"
    },
    Lover: {
      name: "Lover",
      mature: "Deeply connected to body and senses. Feels emotions fully. Experiences beauty and wonder. Passionate and vital.",
      shadow: "The Addict (lost in sensation) or The Impotent Lover (cut off from feeling)",
      article: "the-four-masculine-archetypes"
    },
  },
  feminine: {
    Queen: {
      name: "Queen",
      mature: "Radiates presence and magnetism. Knows her worth without proving it. Creates beauty and stability. Holds standards.",
      shadow: "The Jealous Queen (worth depends on being chosen) or The Abandoned Queen (gives self away)",
      article: "the-seven-feminine-archetypes"
    },
    Mother: {
      name: "Mother",
      mature: "Nurtures without smothering. Creates safety for growth. Compassionate without being doormat. Love creates space, not dependency.",
      shadow: "The Devouring Mother (love as control) or The Absent Mother (emotionally unavailable)",
      article: "the-seven-feminine-archetypes"
    },
    Lover: {
      name: "Lover",
      mature: "Fully embodied and sensual. Connected to creative life force. Open to intimacy without losing self. Passionate and alive.",
      shadow: "The Seductress (sexuality as manipulation) or The Frozen Woman (shut down from feeling)",
      article: "the-seven-feminine-archetypes"
    },
    Maiden: {
      name: "Maiden",
      mature: "Open and receptive. Comfortable with vulnerability. Retains freshness and wonder. Knows the power of softness.",
      shadow: "The Eternal Girl (never grows up) or The Hardened Woman (armored against vulnerability)",
      article: "the-seven-feminine-archetypes"
    },
    Huntress: {
      name: "Huntress",
      mature: "Fiercely independent. Focused on own aims. Connected to wildness. Comfortable alone. Clear strong boundaries.",
      shadow: "The Man-Hater (independence as hostility) or The Damsel (can't access own power)",
      article: "the-seven-feminine-archetypes"
    },
    Mystic: {
      name: "Mystic",
      mature: "Deep connection to inner life and spirit. Finds meaning in solitude. Grounded, centered, still. Peace comes from within.",
      shadow: "The Hermit (withdraws from life) or The Scattered Woman (terrified of silence)",
      article: "the-seven-feminine-archetypes"
    },
    WildWoman: {
      name: "Wild Woman",
      mature: "In touch with primal nature. Refuses to be controlled. Channels chaos creatively. Wild but not out of control.",
      shadow: "The Destroyer (chaos without creation) or The Tamed Woman (fire extinguished)",
      article: "the-seven-feminine-archetypes"
    },
  },
};

function RadarChart({
  scores,
  type,
  size = 280
}: {
  scores: Record<string, number>;
  type: 'masculine' | 'feminine';
  size?: number;
}) {
  const labels = Object.keys(scores);
  const values = Object.values(scores);
  const maxValue = Math.max(...values, 1);
  const center = size / 2;
  const radius = (size / 2) - 40;

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
    const labelX = center + (radius + 25) * Math.cos(angle);
    const labelY = center + (radius + 25) * Math.sin(angle);

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
          fontSize="11"
          className="font-medium"
        >
          {label === 'WildWoman' ? 'Wild' : label}
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
        fill={type === 'masculine' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)'}
        stroke={type === 'masculine' ? 'rgb(59, 130, 246)' : 'rgb(236, 72, 153)'}
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
            fill={type === 'masculine' ? 'rgb(59, 130, 246)' : 'rgb(236, 72, 153)'}
          />
        );
      })}
    </svg>
  );
}

function ArchetypeResult({
  archetype,
  score,
  maxScore,
  type
}: {
  archetype: string;
  score: number;
  maxScore: number;
  type: 'masculine' | 'feminine';
}) {
  const descriptions = type === 'masculine'
    ? archetypeDescriptions.masculine[archetype as MasculineArchetype]
    : archetypeDescriptions.feminine[archetype as FeminineArchetype];

  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="border border-zinc-800 p-4 bg-zinc-900/50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-serif text-lg text-white">{descriptions.name}</h4>
        <span className={`text-sm font-medium ${
          percentage >= 70 ? 'text-green-400' :
          percentage >= 40 ? 'text-yellow-400' : 'text-gray-400'
        }`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-zinc-800 h-2 mb-3">
        <div
          className={`h-full transition-all duration-500 ${
            type === 'masculine' ? 'bg-blue-500' : 'bg-pink-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 mb-2">{descriptions.mature}</p>
      <p className="text-xs text-gray-500">
        <span className="text-gray-400">Shadow:</span> {descriptions.shadow}
      </p>
    </div>
  );
}

export default function ArchetypeQuiz() {
  const [gender, setGender] = useState<Gender>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<ArchetypeScores>({
    masculine: { King: 0, Warrior: 0, Magician: 0, Lover: 0 },
    feminine: { Queen: 0, Mother: 0, Lover: 0, Maiden: 0, Huntress: 0, Mystic: 0, WildWoman: 0 },
  });
  const [showResults, setShowResults] = useState(false);

  const handleGenderSelect = (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
  };

  const handleSelect = (optionScores: Question['options'][0]['scores']) => {
    const newScores = { ...scores };

    if (optionScores.masculine) {
      Object.entries(optionScores.masculine).forEach(([arch, value]) => {
        newScores.masculine[arch as MasculineArchetype] += value || 0;
      });
    }
    if (optionScores.feminine) {
      Object.entries(optionScores.feminine).forEach(([arch, value]) => {
        newScores.feminine[arch as FeminineArchetype] += value || 0;
      });
    }

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
      setGender(null);
    }
  };

  const reset = () => {
    setGender(null);
    setCurrentQuestion(0);
    setScores({
      masculine: { King: 0, Warrior: 0, Magician: 0, Lover: 0 },
      feminine: { Queen: 0, Mother: 0, Lover: 0, Maiden: 0, Huntress: 0, Mystic: 0, WildWoman: 0 },
    });
    setShowResults(false);
  };

  const sortedArchetypes = useMemo(() => {
    const masculine = Object.entries(scores.masculine)
      .sort((a, b) => b[1] - a[1]);
    const feminine = Object.entries(scores.feminine)
      .sort((a, b) => b[1] - a[1]);
    return { masculine, feminine };
  }, [scores]);

  const maxScores = useMemo(() => ({
    masculine: Math.max(...Object.values(scores.masculine), 1),
    feminine: Math.max(...Object.values(scores.feminine), 1),
  }), [scores]);

  // Gender selection screen
  if (!gender) {
    return (
      <div className="text-center">
        <h2 className="font-serif text-2xl text-white mb-8">I am...</h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={() => handleGenderSelect('male')}
            className="group px-10 py-6 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-colors"
          >
            <span className="block text-4xl mb-2 text-gray-400 group-hover:text-white transition-colors">♂</span>
            <span className="text-white text-lg">Man</span>
          </button>
          <button
            onClick={() => handleGenderSelect('female')}
            className="group px-10 py-6 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-colors"
          >
            <span className="block text-4xl mb-2 text-gray-400 group-hover:text-white transition-colors">♀</span>
            <span className="text-white text-lg">Woman</span>
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const primaryType = gender === 'male' ? 'masculine' : 'feminine';
    const secondaryType = gender === 'male' ? 'feminine' : 'masculine';
    const primaryLabel = gender === 'male' ? 'Your Masculine Archetypes' : 'Your Feminine Archetypes';
    const secondaryLabel = gender === 'male' ? 'Your Inner Feminine (Anima)' : 'Your Inner Masculine (Animus)';
    const primaryColor = gender === 'male' ? 'text-blue-400' : 'text-pink-400';
    const secondaryColor = gender === 'male' ? 'text-pink-400' : 'text-blue-400';

    const topPrimary = gender === 'male' ? sortedArchetypes.masculine[0] : sortedArchetypes.feminine[0];
    const topSecondary = gender === 'male' ? sortedArchetypes.feminine[0] : sortedArchetypes.masculine[0];

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl text-white mb-2">Your Archetype Profile</h2>
          <p className="text-gray-400">
            Strongest {gender === 'male' ? 'masculine' : 'feminine'} archetype:{' '}
            <span className={primaryColor}>{topPrimary[0]}</span>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Inner {gender === 'male' ? 'feminine' : 'masculine'}:{' '}
            <span className={secondaryColor}>{topSecondary[0]}</span>
          </p>
        </div>

        {/* Primary Archetypes */}
        <div>
          <h3 className="font-serif text-xl text-white text-center mb-4">
            {primaryLabel}
          </h3>
          <RadarChart
            scores={gender === 'male' ? scores.masculine : scores.feminine}
            type={primaryType}
          />
        </div>

        <div className="space-y-4">
          <h3 className={`font-serif text-lg ${primaryColor}`}>
            {gender === 'male' ? 'Masculine Archetypes' : 'Feminine Archetypes'}
          </h3>
          {(gender === 'male' ? sortedArchetypes.masculine : sortedArchetypes.feminine).map(([arch, score]) => (
            <ArchetypeResult
              key={arch}
              archetype={arch}
              score={score}
              maxScore={gender === 'male' ? maxScores.masculine : maxScores.feminine}
              type={primaryType}
            />
          ))}
        </div>

        {/* Secondary (Inner Opposite) */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="font-serif text-xl text-white text-center mb-4">
            {secondaryLabel}
          </h3>
          <p className="text-gray-500 text-sm text-center mb-6">
            {gender === 'male'
              ? "Jung called this the anima — the inner feminine that every man carries. Integrating it leads to wholeness, not feminization."
              : "Jung called this the animus — the inner masculine that every woman carries. Integrating it leads to wholeness, not masculinization."
            }
          </p>
          <RadarChart
            scores={gender === 'male' ? scores.feminine : scores.masculine}
            type={secondaryType}
            size={240}
          />
        </div>

        <div className="space-y-4">
          <h3 className={`font-serif text-lg ${secondaryColor}`}>
            {gender === 'male' ? 'Inner Feminine' : 'Inner Masculine'}
          </h3>
          {(gender === 'male' ? sortedArchetypes.feminine : sortedArchetypes.masculine).map(([arch, score]) => (
            <ArchetypeResult
              key={arch}
              archetype={arch}
              score={score}
              maxScore={gender === 'male' ? maxScores.feminine : maxScores.masculine}
              type={secondaryType}
            />
          ))}
        </div>

        {/* About Results */}
        <div className="bg-zinc-900 border border-zinc-700 p-6 mt-8">
          <h3 className="font-serif text-lg text-white mb-3">About Your Results</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            {gender === 'male'
              ? "As a man, your primary work is developing the masculine archetypes — King, Warrior, Magician, Lover. These are your birthright. Your anima (inner feminine) is a bridge to depth and to genuine relationship with women, but it's not who you are."
              : "As a woman, your primary work is developing the feminine archetypes — Queen, Mother, Lover, Maiden, Huntress, Mystic, Wild Woman. These are your birthright. Your animus (inner masculine) is a bridge to power and to genuine relationship with men, but it's not who you are."
            }
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Low scores may indicate areas for development. High scores may indicate where you're strongest —
            or where shadow patterns might be hiding. This is a starting point for self-reflection.
          </p>
        </div>

        {/* Related Articles */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="font-serif text-lg text-white mb-4">Explore Further</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/posts/the-four-masculine-archetypes"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">The Four Masculine Archetypes</h4>
              <p className="text-sm text-gray-500">King, Warrior, Magician, Lover</p>
            </Link>
            <Link
              href="/posts/the-seven-feminine-archetypes"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">The Seven Feminine Archetypes</h4>
              <p className="text-sm text-gray-500">Queen, Mother, Lover, Maiden, Huntress, Mystic, Wild Woman</p>
            </Link>
            <Link
              href="/posts/integrating-your-inner-opposite"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">Integrating Your Inner Opposite</h4>
              <p className="text-sm text-gray-500">Anima, animus, and wholeness</p>
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
            href="/learning-paths"
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors text-center"
          >
            Browse Learning Paths
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
