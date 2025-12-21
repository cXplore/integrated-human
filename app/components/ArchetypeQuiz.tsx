'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/lib/hooks/useAssessment';

// Archetype definitions
type MasculineArchetype = 'King' | 'Warrior' | 'Magician' | 'Lover';
type FeminineArchetype = 'Queen' | 'Mother' | 'Lover' | 'Maiden' | 'Huntress' | 'Mystic' | 'WildWoman';

interface ArchetypeScores {
  masculine: Record<MasculineArchetype, { mature: number; shadow: number }>;
  feminine: Record<FeminineArchetype, { mature: number; shadow: number }>;
}

type Gender = 'man' | 'woman' | null;
type Phase = 'gender' | 'intro' | 'essence' | 'shadow' | 'relationships' | 'growth' | 'results';

interface Question {
  id: string;
  phase: 'essence' | 'shadow' | 'relationships' | 'growth';
  text: string;
  context?: string;
  options: {
    label: string;
    subtext?: string;
    scores: {
      masculine?: Partial<Record<MasculineArchetype, { mature?: number; shadow?: number }>>;
      feminine?: Partial<Record<FeminineArchetype, { mature?: number; shadow?: number }>>;
    };
  }[];
}

// Questions organized by phase for a journey-like experience
const essenceQuestions: Question[] = [
  {
    id: 'e1',
    phase: 'essence',
    text: "When you feel most yourself—not performing, not adapting—what's the quality of that?",
    context: "Think of a moment when you weren't trying to be anything.",
    options: [
      {
        label: "Still. Centered. Like I'm holding space for everything around me.",
        scores: { masculine: { King: { mature: 3 } }, feminine: { Queen: { mature: 3 }, Mystic: { mature: 1 } } }
      },
      {
        label: "Alive. Burning. Connected to everything through feeling.",
        scores: { masculine: { Lover: { mature: 3 } }, feminine: { Lover: { mature: 3 }, WildWoman: { mature: 1 } } }
      },
      {
        label: "Sharp. Clear. I can see what's really happening.",
        scores: { masculine: { Magician: { mature: 3 } }, feminine: { Mystic: { mature: 3 } } }
      },
      {
        label: "Ready. Focused. Whatever comes, I'll meet it.",
        scores: { masculine: { Warrior: { mature: 3 } }, feminine: { Huntress: { mature: 3 } } }
      },
      {
        label: "Open. Soft. Taking care of what matters to me.",
        scores: { masculine: { King: { mature: 1 } }, feminine: { Mother: { mature: 3 }, Maiden: { mature: 1 } } }
      },
    ],
  },
  {
    id: 'e2',
    phase: 'essence',
    text: "What do people come to you for?",
    context: "Not what you wish they'd come to you for. What they actually do.",
    options: [
      {
        label: "Direction. Decisions. When things are chaotic, they want me to hold the frame.",
        scores: { masculine: { King: { mature: 3 } }, feminine: { Queen: { mature: 3 } } }
      },
      {
        label: "Understanding. They want to feel seen, to process something with someone who gets it.",
        scores: { masculine: { Lover: { mature: 2 }, Magician: { mature: 1 } }, feminine: { Lover: { mature: 2 }, Mystic: { mature: 1 } } }
      },
      {
        label: "Protection. When they're threatened or scared, they come to me.",
        scores: { masculine: { Warrior: { mature: 3 } }, feminine: { Huntress: { mature: 2 }, Mother: { mature: 1 } } }
      },
      {
        label: "Insight. They want me to name what they can't see about themselves.",
        scores: { masculine: { Magician: { mature: 3 } }, feminine: { Mystic: { mature: 3 } } }
      },
      {
        label: "Nurturing. Comfort. A safe place to land.",
        scores: { masculine: { Lover: { mature: 1 } }, feminine: { Mother: { mature: 3 } } }
      },
    ],
  },
  {
    id: 'e3',
    phase: 'essence',
    text: "What would you fight for—really fight for?",
    context: "Not abstractly. What would make you stand even when it costs you?",
    options: [
      {
        label: "Truth. When I see manipulation or lies, something in me rises.",
        scores: { masculine: { Warrior: { mature: 2 }, Magician: { mature: 2 } }, feminine: { Huntress: { mature: 2 }, Mystic: { mature: 2 } } }
      },
      {
        label: "Love. For the people I'm bonded to, there's nothing I wouldn't do.",
        scores: { masculine: { Lover: { mature: 3 } }, feminine: { Lover: { mature: 2 }, Mother: { mature: 2 } } }
      },
      {
        label: "Order. When things descend into chaos and no one's holding it together.",
        scores: { masculine: { King: { mature: 3 } }, feminine: { Queen: { mature: 3 } } }
      },
      {
        label: "Freedom. My own and others'. The right to not be controlled.",
        scores: { masculine: { Warrior: { mature: 2 } }, feminine: { Huntress: { mature: 3 }, WildWoman: { mature: 2 } } }
      },
      {
        label: "Beauty. Life. When something sacred is being destroyed or ignored.",
        scores: { masculine: { Lover: { mature: 2 } }, feminine: { WildWoman: { mature: 2 }, Mystic: { mature: 2 } } }
      },
    ],
  },
];

const shadowQuestions: Question[] = [
  {
    id: 's1',
    phase: 'shadow',
    text: "When you're hurt and want to hurt back, how does it come out?",
    context: "Not what you're proud of. What actually happens.",
    options: [
      {
        label: "Cold withdrawal. I become ice. You cease to exist to me.",
        scores: { masculine: { King: { shadow: 3 } }, feminine: { Queen: { shadow: 2 }, Huntress: { shadow: 2 } } }
      },
      {
        label: "Cutting words. I know exactly where you're vulnerable, and I use it.",
        scores: { masculine: { Magician: { shadow: 3 } }, feminine: { Mystic: { shadow: 2 }, Queen: { shadow: 2 } } }
      },
      {
        label: "Rage. Explosive or simmering, but the fire comes out.",
        scores: { masculine: { Warrior: { shadow: 3 } }, feminine: { WildWoman: { shadow: 3 }, Huntress: { shadow: 1 } } }
      },
      {
        label: "Seduction or manipulation. I become charming in a dangerous way.",
        scores: { masculine: { Lover: { shadow: 3 } }, feminine: { Lover: { shadow: 3 } } }
      },
      {
        label: "I collapse. Guilt, self-punishment, making myself the bad one.",
        scores: { masculine: { Lover: { shadow: 2 } }, feminine: { Maiden: { shadow: 3 }, Mother: { shadow: 2 } } }
      },
    ],
  },
  {
    id: 's2',
    phase: 'shadow',
    text: "What do you pretend you don't want?",
    context: "The desire you've convinced yourself you've transcended—but haven't.",
    options: [
      {
        label: "Power. Control. To be the one who decides.",
        scores: { masculine: { King: { shadow: 3 } }, feminine: { Queen: { shadow: 3 } } }
      },
      {
        label: "To be adored. Desired. The center of someone's universe.",
        scores: { masculine: { Lover: { shadow: 3 } }, feminine: { Lover: { shadow: 2 }, Maiden: { shadow: 2 } } }
      },
      {
        label: "To be left alone. To need no one. Complete independence.",
        scores: { masculine: { Warrior: { shadow: 2 } }, feminine: { Huntress: { shadow: 3 } } }
      },
      {
        label: "To be special. To know something others don't. To be wise.",
        scores: { masculine: { Magician: { shadow: 3 } }, feminine: { Mystic: { shadow: 3 } } }
      },
      {
        label: "To be taken care of. To not have to hold everything for once.",
        scores: { masculine: { King: { shadow: 2 } }, feminine: { Mother: { shadow: 3 }, Queen: { shadow: 1 } } }
      },
    ],
  },
  {
    id: 's3',
    phase: 'shadow',
    text: "When you're at your lowest, which pattern takes over?",
    context: "Not your conscious response. The thing that happens when you're not watching.",
    options: [
      {
        label: "I become controlling, rigid, or completely checked out—unable to hold anything.",
        scores: { masculine: { King: { shadow: 3 } }, feminine: { Queen: { shadow: 3 } } }
      },
      {
        label: "I become cruel, cold, or unable to stand for anything—fight or freeze.",
        scores: { masculine: { Warrior: { shadow: 3 } }, feminine: { Huntress: { shadow: 3 } } }
      },
      {
        label: "I manipulate, or I pretend I don't see what I clearly see.",
        scores: { masculine: { Magician: { shadow: 3 } }, feminine: { Mystic: { shadow: 3 } } }
      },
      {
        label: "I numb out in sensation, or I cut off from feeling entirely.",
        scores: { masculine: { Lover: { shadow: 3 } }, feminine: { Lover: { shadow: 2 }, WildWoman: { shadow: 2 } } }
      },
      {
        label: "I lose myself in caring for others, or I shut everyone out completely.",
        scores: { masculine: { Lover: { shadow: 2 } }, feminine: { Mother: { shadow: 3 } } }
      },
    ],
  },
];

const relationshipQuestions: Question[] = [
  {
    id: 'r1',
    phase: 'relationships',
    text: "In your closest relationship, what's the dynamic that keeps repeating?",
    context: "The pattern you keep finding yourself in, even when you try to change it.",
    options: [
      {
        label: "I take charge, they orbit me—or I withdraw and nothing functions.",
        scores: { masculine: { King: { mature: 1, shadow: 2 } }, feminine: { Queen: { mature: 1, shadow: 2 } } }
      },
      {
        label: "I feel everything intensely—their pain becomes mine, boundaries blur.",
        scores: { masculine: { Lover: { mature: 1, shadow: 2 } }, feminine: { Lover: { mature: 1, shadow: 2 } } }
      },
      {
        label: "I protect them, sometimes too much. I can't let them struggle.",
        scores: { masculine: { Warrior: { mature: 1, shadow: 1 } }, feminine: { Mother: { mature: 1, shadow: 2 } } }
      },
      {
        label: "I see their patterns clearly—maybe too clearly. I can't unsee what's wrong.",
        scores: { masculine: { Magician: { mature: 1, shadow: 2 } }, feminine: { Mystic: { mature: 1, shadow: 2 } } }
      },
      {
        label: "I keep one foot out the door. I love, but I need my freedom.",
        scores: { masculine: { Warrior: { mature: 1 } }, feminine: { Huntress: { mature: 2, shadow: 1 } } }
      },
    ],
  },
  {
    id: 'r2',
    phase: 'relationships',
    text: "What's been the wound in your love life?",
    context: "Not a single event. The theme that keeps appearing.",
    options: [
      {
        label: "I give too much. I lose myself in them. I become whatever they need.",
        scores: { masculine: { Lover: { shadow: 3 } }, feminine: { Lover: { shadow: 2 }, Mother: { shadow: 2 }, Maiden: { shadow: 2 } } }
      },
      {
        label: "I can't let them in. Walls I don't know how to lower. Alone in company.",
        scores: { masculine: { Warrior: { shadow: 2 }, King: { shadow: 2 } }, feminine: { Huntress: { shadow: 3 } } }
      },
      {
        label: "I choose people I have to fix, or who try to fix me.",
        scores: { masculine: { Magician: { shadow: 2 } }, feminine: { Mother: { shadow: 2 }, Mystic: { shadow: 2 } } }
      },
      {
        label: "I lose respect for them once I have them. The chase matters more than the having.",
        scores: { masculine: { Warrior: { shadow: 2 }, King: { shadow: 1 } }, feminine: { Huntress: { shadow: 2 }, Queen: { shadow: 2 } } }
      },
      {
        label: "I attract chaos. Intensity that feels like passion but destroys stability.",
        scores: { masculine: { Lover: { shadow: 2 } }, feminine: { WildWoman: { shadow: 3 }, Lover: { shadow: 2 } } }
      },
    ],
  },
  {
    id: 'r3',
    phase: 'relationships',
    text: "What's your actual role when you're with someone you love?",
    context: "The unspoken position you take. Not what you talk about, but what you do.",
    options: [
      {
        label: "The container. I hold the space, set the direction, take care of the big picture.",
        scores: { masculine: { King: { mature: 3 } }, feminine: { Queen: { mature: 3 } } }
      },
      {
        label: "The heart. I keep us connected to feeling, to each other, to aliveness.",
        scores: { masculine: { Lover: { mature: 3 } }, feminine: { Lover: { mature: 3 } } }
      },
      {
        label: "The protector. I make sure they're safe, that threats are handled.",
        scores: { masculine: { Warrior: { mature: 3 } }, feminine: { Huntress: { mature: 2 }, Mother: { mature: 2 } } }
      },
      {
        label: "The witness. I see them, name what's happening, reflect truth back.",
        scores: { masculine: { Magician: { mature: 3 } }, feminine: { Mystic: { mature: 3 } } }
      },
      {
        label: "The nurturer. I take care of them, their needs, their comfort.",
        scores: { masculine: { Lover: { mature: 2 } }, feminine: { Mother: { mature: 3 } } }
      },
    ],
  },
];

const growthQuestions: Question[] = [
  {
    id: 'g1',
    phase: 'growth',
    text: "What quality in others makes you uncomfortable or judgmental?",
    context: "This often points to what you've disowned in yourself.",
    options: [
      {
        label: "Weakness. People who can't hold it together, who fall apart.",
        scores: { masculine: { Lover: { shadow: 2 } }, feminine: { Maiden: { shadow: 2 } } }
      },
      {
        label: "Arrogance. People who think they're in charge when they're not.",
        scores: { masculine: { King: { shadow: 2 } }, feminine: { Queen: { shadow: 2 } } }
      },
      {
        label: "Chaos. People who can't control themselves, who are ruled by impulse.",
        scores: { masculine: { Warrior: { shadow: 1 }, King: { shadow: 1 } }, feminine: { WildWoman: { shadow: 2 } } }
      },
      {
        label: "Superficiality. People who stay on the surface, who don't want to go deep.",
        scores: { masculine: { Magician: { shadow: 2 } }, feminine: { Mystic: { shadow: 2 } } }
      },
      {
        label: "Neediness. People who can't be alone, who always require others.",
        scores: { masculine: { Warrior: { shadow: 2 } }, feminine: { Huntress: { shadow: 2 } } }
      },
    ],
  },
  {
    id: 'g2',
    phase: 'growth',
    text: "What would be the scariest thing for you to embody more of?",
    context: "Your growth edge often lives where you're most afraid to go.",
    options: [
      {
        label: "Softness. Letting myself be seen, vulnerable, undefended.",
        scores: { masculine: { Lover: { mature: 2 } }, feminine: { Maiden: { mature: 2 }, Lover: { mature: 1 } } }
      },
      {
        label: "Power. Actually claiming authority, setting the frame, being in charge.",
        scores: { masculine: { King: { mature: 2 } }, feminine: { Queen: { mature: 2 } } }
      },
      {
        label: "Aggression. Showing teeth. Fighting openly instead of indirectly.",
        scores: { masculine: { Warrior: { mature: 2 } }, feminine: { Huntress: { mature: 2 }, WildWoman: { mature: 1 } } }
      },
      {
        label: "Wildness. Losing control. Letting myself be irrational, primal.",
        scores: { masculine: { Lover: { mature: 2 } }, feminine: { WildWoman: { mature: 3 } } }
      },
      {
        label: "Stillness. Doing nothing. Not fixing, not knowing, just being present.",
        scores: { masculine: { King: { mature: 1 }, Magician: { mature: 2 } }, feminine: { Mystic: { mature: 3 } } }
      },
    ],
  },
  {
    id: 'g3',
    phase: 'growth',
    text: "If you could receive one quality you currently lack, what would it be?",
    options: [
      {
        label: "Groundedness. To be unshakeable, rooted, still when everything else moves.",
        scores: { masculine: { King: { mature: 3 } }, feminine: { Queen: { mature: 2 }, Mystic: { mature: 2 } } }
      },
      {
        label: "Boundaries. To say no and mean it. To not leak energy everywhere.",
        scores: { masculine: { Warrior: { mature: 3 } }, feminine: { Huntress: { mature: 3 } } }
      },
      {
        label: "Depth. To see beneath surfaces. To understand what's really happening.",
        scores: { masculine: { Magician: { mature: 3 } }, feminine: { Mystic: { mature: 3 } } }
      },
      {
        label: "Aliveness. To feel more. To be in my body. To burn brighter.",
        scores: { masculine: { Lover: { mature: 3 } }, feminine: { Lover: { mature: 2 }, WildWoman: { mature: 2 } } }
      },
      {
        label: "Nurturing. To care without controlling. To hold without smothering.",
        scores: { masculine: { Lover: { mature: 2 } }, feminine: { Mother: { mature: 3 } } }
      },
    ],
  },
];

const archetypeDescriptions = {
  masculine: {
    King: {
      name: "King",
      essence: "Order, blessing, calm presence",
      matureDescription: "The mature King creates order without tyranny. He holds the center, blesses others' gifts without envy, and takes responsibility without martyrdom. His presence is calming. People feel more themselves around him, not less. He doesn't need to prove his authority—it emanates from his groundedness.",
      shadowDescription: "The shadow King manifests as either the Tyrant—controlling, demanding center stage, crushing others to feel big—or the Weakling—abdicating responsibility, checking out, unable to make decisions or hold space for anyone.",
      woundedPatterns: [
        "Micromanaging because you don't trust others",
        "Complete emotional unavailability",
        "Need to be the smartest person in the room",
        "Collapsing when things get difficult"
      ],
      integration: "The King integrates by learning that real authority doesn't need to dominate. Practice blessing others' victories without keeping score. Hold space without filling it with your own agenda.",
      question: "Where do you create order? Where do you avoid responsibility?"
    },
    Warrior: {
      name: "Warrior",
      essence: "Boundaries, discipline, service",
      matureDescription: "The mature Warrior has focused aggression in service of what matters. He's disciplined, boundaried, decisive under pressure. Loyal to principles rather than ego. He knows what he'll fight for and what he'll let go. His 'no' is clean, his 'yes' is total.",
      shadowDescription: "The shadow Warrior appears as the Sadist—cruelty for its own sake, violence without purpose—or the Masochist—unable to fight for himself, letting others walk over him, chronic self-sacrifice that breeds resentment.",
      woundedPatterns: [
        "Aggression that's out of proportion to the threat",
        "Complete inability to fight even when necessary",
        "Using discipline as punishment rather than devotion",
        "Loyalty to people who don't deserve it"
      ],
      integration: "The Warrior integrates by finding causes worth serving beyond ego. Learn to channel aggression purposefully. Practice saying no without cruelty, yes without submission.",
      question: "What are you willing to fight for? What are you avoiding?"
    },
    Magician: {
      name: "Magician",
      essence: "Awareness, transformation, truth",
      matureDescription: "The mature Magician sees beneath surface patterns. He guides transformation without manipulating it. Knowledge is his gift to share, not his weapon to control. He holds truths lightly, knowing they're always partial. He can name what's happening without needing to fix it.",
      shadowDescription: "The shadow Magician becomes the Manipulator—using truth to control, withholding knowledge for power—or the Innocent—pretending not to know what he clearly knows, playing dumb to avoid responsibility.",
      woundedPatterns: [
        "Using psychological insight to manipulate",
        "Withholding truth as a power move",
        "Analysis paralysis—understanding but never acting",
        "Spiritual bypassing—using insight to avoid emotion"
      ],
      integration: "The Magician integrates by using awareness in service of others' growth, not his own status. Name what you see as an offering, not a weapon. Let yourself not know.",
      question: "What truth are you avoiding? Where might you be manipulating?"
    },
    Lover: {
      name: "Lover",
      essence: "Connection, aliveness, feeling",
      matureDescription: "The mature Lover is deeply connected to his body and senses. He feels emotions fully without being consumed by them. He experiences beauty, wonder, connection. He can be present with another's pain without drowning in it. His aliveness is contagious, not draining.",
      shadowDescription: "The shadow Lover becomes the Addict—lost in sensation, chasing intensity, unable to moderate—or the Impotent—cut off from feeling entirely, numb, unable to be moved by beauty or connection.",
      woundedPatterns: [
        "Losing yourself completely in romantic relationships",
        "Numbing through substances, sex, or endless stimulation",
        "Inability to feel anything—chronic emptiness",
        "Boundaries dissolving in intimacy"
      ],
      integration: "The Lover integrates by learning to feel without losing form. Practice staying in your body during intensity. Let yourself be moved by beauty without needing to possess it.",
      question: "Where are you fully alive? Where have you gone numb?"
    },
  },
  feminine: {
    Queen: {
      name: "Queen",
      essence: "Radiance, standards, self-worth",
      matureDescription: "The mature Queen radiates presence without demanding attention. She knows her worth without needing to prove it. She creates beauty, holds standards, and draws the right people to her through being, not chasing. Her self-respect is quiet but absolute.",
      shadowDescription: "The shadow Queen manifests as the Jealous Queen—whose worth depends on being chosen, who competes rather than radiates—or the Abandoned One—who gives herself away, accepts crumbs, can't hold her throne.",
      woundedPatterns: [
        "Competing with other women for attention",
        "Accepting treatment far below your worth",
        "Need for external validation to feel valuable",
        "Ice queen patterns—withdrawing to punish"
      ],
      integration: "The Queen integrates by anchoring worth internally. Practice receiving without proving you deserve it. Hold standards without becoming cold.",
      question: "Where do you rest in your own worth? Where do you give it away?"
    },
    Mother: {
      name: "Mother",
      essence: "Nurture, holding, compassion",
      matureDescription: "The mature Mother nurtures without smothering. She creates safety that allows growth. Her love doesn't create dependency—it creates confident beings who can eventually leave. She can let go when the time comes.",
      shadowDescription: "The shadow Mother becomes the Devouring Mother—whose love is control, who keeps others dependent—or the Absent Mother—emotionally unavailable, unable to attune, cold when warmth is needed.",
      woundedPatterns: [
        "Giving until depleted, then resenting",
        "Love that's actually control disguised as care",
        "Inability to nurture yourself",
        "Creating dependency rather than growth"
      ],
      integration: "The Mother integrates by learning to nurture without losing herself. Give from overflow, not deficit. Let people struggle enough to grow.",
      question: "Where does your nurturing serve growth? Where does it control?"
    },
    Lover: {
      name: "Lover",
      essence: "Embodiment, eros, openness",
      matureDescription: "The mature feminine Lover is fully embodied and sensual—not just sexually, but in her whole relationship to life. She's connected to the creative life force. She can be intimate without losing herself, surrendered without being consumed.",
      shadowDescription: "The shadow Lover appears as the Seductress—using sexuality as manipulation, charm as weapon—or the Frozen One—shut down from feeling, disconnected from body, unable to receive pleasure or give it authentically.",
      woundedPatterns: [
        "Using attraction as a tool for control",
        "Disconnection from body and sensation",
        "Merging completely in intimacy—losing self",
        "Performing pleasure rather than feeling it"
      ],
      integration: "The Lover integrates by coming home to her body. Practice pleasure without agenda. Let yourself be open and surrendered without disappearing.",
      question: "Where are you fully in your body? Where have you shut down?"
    },
    Maiden: {
      name: "Maiden",
      essence: "Receptivity, wonder, softness",
      matureDescription: "The mature Maiden is open and receptive without being naive. She's comfortable with vulnerability, retains freshness and wonder, and can receive without suspicion. Her softness is a strength, not a weakness.",
      shadowDescription: "The shadow Maiden becomes the Eternal Girl—refusing to grow, avoiding responsibility, expecting rescue—or the Hardened One—armored against vulnerability, cynical, closed to wonder.",
      woundedPatterns: [
        "Waiting to be rescued rather than taking action",
        "Chronic cynicism and closure",
        "Performing helplessness to get needs met",
        "Inability to be soft for fear of exploitation"
      ],
      integration: "The Maiden integrates by allowing softness alongside strength. Practice receiving without guilt. Let yourself be delighted by small things.",
      question: "Where can you be soft? Where have you hardened unnecessarily?"
    },
    Huntress: {
      name: "Huntress",
      essence: "Independence, focus, wildness",
      matureDescription: "The mature Huntress is fiercely independent without hostility. She's focused on her own aims, comfortable alone, with clear strong boundaries. She doesn't need to be against men to be for herself. Her autonomy is clean, not reactive.",
      shadowDescription: "The shadow Huntress appears as the Man-Hater—whose independence is actually hostility, who uses autonomy as a wall—or the Damsel—who can't access her own power, who collapses in dependence.",
      woundedPatterns: [
        "Independence as emotional unavailability",
        "Hostility disguised as strength",
        "Complete collapse into dependency",
        "Unable to let anyone in without feeling trapped"
      ],
      integration: "The Huntress integrates by choosing independence from fullness, not fear. Allow intimacy without losing autonomy. Be with without merging.",
      question: "Where do you stand in your power? Where do you abandon yourself?"
    },
    Mystic: {
      name: "Mystic",
      essence: "Depth, stillness, the sacred",
      matureDescription: "The mature Mystic has a deep connection to inner life. She finds meaning in solitude, is grounded, centered, still. Her peace comes from within, not from circumstance. She can hold mystery without needing to solve it.",
      shadowDescription: "The shadow Mystic becomes the Hermit—who withdraws from life, who uses spirituality to avoid intimacy—or the Scattered One—terrified of silence, always busy, unable to be present.",
      woundedPatterns: [
        "Spiritual bypassing—using depth to avoid life",
        "Chronic busy-ness to avoid inner stillness",
        "Isolation disguised as spiritual practice",
        "Can't tolerate the chaos of ordinary life"
      ],
      integration: "The Mystic integrates by bringing depth into the world, not away from it. Practice stillness within chaos. Let insight lead to action, not just understanding.",
      question: "Where do you touch depth? What are you avoiding in stillness?"
    },
    WildWoman: {
      name: "Wild Woman",
      essence: "Primal force, instinct, untamed",
      matureDescription: "The mature Wild Woman is in touch with her primal nature. She refuses to be controlled or tamed. Her chaos is creative, her wildness serves life. She trusts her instincts, follows her body, and channels intensity constructively.",
      shadowDescription: "The shadow Wild Woman becomes the Destroyer—chaos without creation, burning everything down—or the Tamed One—whose fire has been extinguished, domesticated, living small.",
      woundedPatterns: [
        "Destruction that doesn't serve life",
        "Complete suppression of instinct and desire",
        "Intensity that exhausts and alienates",
        "Playing small to be acceptable"
      ],
      integration: "The Wild Woman integrates by channeling intensity without destroying. Let yourself be unleashed within containers you choose. Your fire can warm, not only burn.",
      question: "Where does your wildness serve life? Where have you been tamed?"
    },
  },
};

function getPhaseTitle(phase: Phase): string {
  switch (phase) {
    case 'essence': return 'Essence';
    case 'shadow': return 'Shadow';
    case 'relationships': return 'Relationships';
    case 'growth': return 'Growth Edge';
    default: return '';
  }
}

function getPhaseSubtitle(phase: Phase): string {
  switch (phase) {
    case 'essence': return 'Who you are when you\'re not performing';
    case 'shadow': return 'What happens when you lose yourself';
    case 'relationships': return 'How you love and where it breaks';
    case 'growth': return 'Where your next evolution lives';
    default: return '';
  }
}

type ArchetypeProfile = {
  archetype: string;
  mature: number;
  shadow: number;
  total: number;
  ratio: number; // mature / (mature + shadow) - how integrated this archetype is
};

export default function ArchetypeQuiz() {
  const [gender, setGender] = useState<Gender>(null);
  const [phase, setPhase] = useState<Phase>('gender');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<ArchetypeScores>({
    masculine: {
      King: { mature: 0, shadow: 0 },
      Warrior: { mature: 0, shadow: 0 },
      Magician: { mature: 0, shadow: 0 },
      Lover: { mature: 0, shadow: 0 },
    },
    feminine: {
      Queen: { mature: 0, shadow: 0 },
      Mother: { mature: 0, shadow: 0 },
      Lover: { mature: 0, shadow: 0 },
      Maiden: { mature: 0, shadow: 0 },
      Huntress: { mature: 0, shadow: 0 },
      Mystic: { mature: 0, shadow: 0 },
      WildWoman: { mature: 0, shadow: 0 },
    },
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [resultsSaved, setResultsSaved] = useState(false);

  // Hook for saving results
  const { isAuthenticated, isSaving, saveResults } = useAssessment('archetype');

  // All questions for current phase
  const currentPhaseQuestions = useMemo(() => {
    switch (phase) {
      case 'essence': return essenceQuestions;
      case 'shadow': return shadowQuestions;
      case 'relationships': return relationshipQuestions;
      case 'growth': return growthQuestions;
      default: return [];
    }
  }, [phase]);

  const totalQuestions = essenceQuestions.length + shadowQuestions.length +
    relationshipQuestions.length + growthQuestions.length;

  const completedQuestions = useMemo(() => {
    let count = 0;
    if (phase === 'essence') count = currentQuestionIndex;
    else if (phase === 'shadow') count = essenceQuestions.length + currentQuestionIndex;
    else if (phase === 'relationships') count = essenceQuestions.length + shadowQuestions.length + currentQuestionIndex;
    else if (phase === 'growth') count = essenceQuestions.length + shadowQuestions.length + relationshipQuestions.length + currentQuestionIndex;
    else if (phase === 'results') count = totalQuestions;
    return count;
  }, [phase, currentQuestionIndex]);

  const handleSelect = (optionScores: Question['options'][0]['scores']) => {
    const newScores = JSON.parse(JSON.stringify(scores)) as ArchetypeScores;

    if (optionScores.masculine) {
      Object.entries(optionScores.masculine).forEach(([arch, values]) => {
        const archKey = arch as MasculineArchetype;
        if (values?.mature) newScores.masculine[archKey].mature += values.mature;
        if (values?.shadow) newScores.masculine[archKey].shadow += values.shadow;
      });
    }
    if (optionScores.feminine) {
      Object.entries(optionScores.feminine).forEach(([arch, values]) => {
        const archKey = arch as FeminineArchetype;
        if (values?.mature) newScores.feminine[archKey].mature += values.mature;
        if (values?.shadow) newScores.feminine[archKey].shadow += values.shadow;
      });
    }

    setScores(newScores);

    // Move to next question or phase
    if (currentQuestionIndex < currentPhaseQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Move to next phase
      setCurrentQuestionIndex(0);
      if (phase === 'essence') setPhase('shadow');
      else if (phase === 'shadow') setPhase('relationships');
      else if (phase === 'relationships') setPhase('growth');
      else if (phase === 'growth') setPhase('results');
    }
  };

  const reset = () => {
    setGender(null);
    setPhase('gender');
    setCurrentQuestionIndex(0);
    setScores({
      masculine: {
        King: { mature: 0, shadow: 0 },
        Warrior: { mature: 0, shadow: 0 },
        Magician: { mature: 0, shadow: 0 },
        Lover: { mature: 0, shadow: 0 },
      },
      feminine: {
        Queen: { mature: 0, shadow: 0 },
        Mother: { mature: 0, shadow: 0 },
        Lover: { mature: 0, shadow: 0 },
        Maiden: { mature: 0, shadow: 0 },
        Huntress: { mature: 0, shadow: 0 },
        Mystic: { mature: 0, shadow: 0 },
        WildWoman: { mature: 0, shadow: 0 },
      },
    });
    setExpandedSection(null);
  };

  // Calculate archetype profiles
  const profiles = useMemo(() => {
    const primaryScores = gender === 'man' ? scores.masculine : scores.feminine;
    const secondaryScores = gender === 'man' ? scores.feminine : scores.masculine;

    const calculateProfiles = (scoreSet: Record<string, { mature: number; shadow: number }>): ArchetypeProfile[] => {
      return Object.entries(scoreSet).map(([archetype, { mature, shadow }]) => ({
        archetype,
        mature,
        shadow,
        total: mature + shadow,
        ratio: mature + shadow > 0 ? mature / (mature + shadow) : 0.5,
      })).sort((a, b) => b.total - a.total);
    };

    return {
      primary: calculateProfiles(primaryScores),
      secondary: calculateProfiles(secondaryScores as Record<string, { mature: number; shadow: number }>),
    };
  }, [scores, gender]);

  // Save results when entering results phase
  useEffect(() => {
    if (phase === 'results' && !resultsSaved && profiles.primary.length > 0) {
      const topPrimary = profiles.primary.slice(0, 3);
      const topSecondary = profiles.secondary.slice(0, 2);

      // Build summary string
      const primaryArchetype = topPrimary[0]?.archetype || 'Unknown';
      const secondaryArchetype = topPrimary[1]?.total > topPrimary[0]?.total * 0.6
        ? topPrimary[1]?.archetype
        : null;
      const summary = secondaryArchetype
        ? `${primaryArchetype} — ${secondaryArchetype}`
        : primaryArchetype;

      // Save full results
      saveResults({
        gender,
        scores,
        profiles: {
          primary: topPrimary,
          secondary: topSecondary,
        },
        primaryArchetype,
        secondaryArchetype,
        isWounded: topPrimary[0]?.ratio < 0.4,
        isIntegrated: topPrimary[0]?.ratio > 0.65,
      }, summary).then(saved => {
        if (saved) setResultsSaved(true);
      });
    }
  }, [phase, profiles, resultsSaved, gender, scores, saveResults]);

  // Get archetype combination description
  const getCombinationInsight = (top: ArchetypeProfile[]) => {
    if (top.length < 2) return null;
    const [first, second] = top;

    // Only show combination if both are significant
    if (first.total < 5 || second.total < 3) return null;
    if (second.total < first.total * 0.5) return null; // Second must be at least half as strong

    const combo = `${first.archetype}-${second.archetype}`;

    // Combination insights
    const combinations: Record<string, string> = {
      // Masculine combinations
      'Lover-Magician': "The Wounded Healer. You feel deeply and see clearly. This combination can create profound therapeutic presence—but also the danger of using insight to manipulate relationships or using intensity to avoid clarity.",
      'Magician-Lover': "The Wounded Healer. You feel deeply and see clearly. This combination can create profound therapeutic presence—but also the danger of using insight to manipulate relationships or using intensity to avoid clarity.",
      'King-Warrior': "The Leader who can fight. You hold structure and can defend it. The danger is becoming tyrannical or cold—all order, no heart. Integration means leading with strength AND openness.",
      'Warrior-King': "The Protector who leads. You defend what matters and can create order. Watch for becoming so focused on threats that you miss what you're fighting for.",
      'King-Magician': "The Wise Leader. You see clearly and can create order. The danger is analysis paralysis or using wisdom to control. Integration means leading with humility about what you don't know.",
      'Magician-King': "The Wise Leader. You see clearly and can create order. The danger is analysis paralysis or using wisdom to control. Integration means leading with humility about what you don't know.",
      'King-Lover': "The Benevolent King. You hold space AND feel deeply. This can create remarkable presence. The danger is sentimentality or using warmth to avoid hard decisions.",
      'Lover-King': "The Benevolent King. You hold space AND feel deeply. This can create remarkable presence. The danger is sentimentality or using warmth to avoid hard decisions.",
      'Warrior-Lover': "Fire and tenderness together. You can fight AND feel. The integration is powerful—the shadow is intensity that burns relationships or passion that lacks boundaries.",
      'Lover-Warrior': "Fire and tenderness together. You can fight AND feel. The integration is powerful—the shadow is intensity that burns relationships or passion that lacks boundaries.",
      'Warrior-Magician': "The Strategic Warrior. You can fight and see clearly. The danger is cold calculation or using insight as a weapon. Integration means clarity in service of what you love.",
      'Magician-Warrior': "The Strategic Warrior. You can fight and see clearly. The danger is cold calculation or using insight as a weapon. Integration means clarity in service of what you love.",

      // Feminine combinations
      'Queen-Huntress': "Sovereign and untamed. You hold your throne AND your freedom. The danger is becoming untouchable—respected but not truly intimate.",
      'Huntress-Queen': "Independent and radiant. You don't need anyone AND you magnetize them. Watch for using independence to avoid vulnerability.",
      'Lover-WildWoman': "Pure intensity. You feel everything and refuse to be tamed. This creates magnetic presence. The shadow is chaos that destroys what you love.",
      'WildWoman-Lover': "Pure intensity. You feel everything and refuse to be tamed. This creates magnetic presence. The shadow is chaos that destroys what you love.",
      'Queen-Lover': "Radiant and embodied. You know your worth AND you're fully alive. The danger is needing adoration, performing rather than being.",
      'Lover-Queen': "Radiant and embodied. You know your worth AND you're fully alive. The danger is needing adoration, performing rather than being.",
      'Mystic-Queen': "Deep and sovereign. You touch depth AND hold your center. Watch for using spirituality as armor against intimacy.",
      'Queen-Mystic': "Deep and sovereign. You touch depth AND hold your center. Watch for using spirituality as armor against intimacy.",
      'Mother-Lover': "Nurturing and alive. You care for others AND stay connected to your own aliveness. The shadow is giving until empty or losing yourself in others.",
      'Lover-Mother': "Nurturing and alive. You care for others AND stay connected to your own aliveness. The shadow is giving until empty or losing yourself in others.",
      'Huntress-Mystic': "Independent and deep. You walk your own path with inner richness. The danger is isolation—depth without intimacy.",
      'Mystic-Huntress': "Independent and deep. You walk your own path with inner richness. The danger is isolation—depth without intimacy.",
      'Mystic-Lover': "Deep feeling and inner stillness. You sense everything and can hold space for it. The shadow is overwhelm or using depth to avoid action.",
      'Lover-Mystic': "Deep feeling and inner stillness. You sense everything and can hold space for it. The shadow is overwhelm or using depth to avoid action.",
      'WildWoman-Huntress': "Untamed and independent. You follow your instincts and need no permission. The danger is burning bridges or pushing away what you actually want.",
      'Huntress-WildWoman': "Untamed and independent. You follow your instincts and need no permission. The danger is burning bridges or pushing away what you actually want.",
    };

    return combinations[combo] || null;
  };

  // Gender selection
  if (phase === 'gender') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-white">I am a...</h2>
          <p className="text-gray-500 text-sm">
            This determines which archetypes are primary for you.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => {
              setGender('man');
              setPhase('intro');
            }}
            className="px-12 py-6 bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <span className="block font-serif text-xl">Man</span>
            <span className="block text-gray-500 text-sm mt-1">4 masculine archetypes</span>
          </button>
          <button
            onClick={() => {
              setGender('woman');
              setPhase('intro');
            }}
            className="px-12 py-6 bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <span className="block font-serif text-xl">Woman</span>
            <span className="block text-gray-500 text-sm mt-1">7 feminine archetypes</span>
          </button>
        </div>
      </div>
    );
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-white text-center">This is Not a Personality Test</h2>
          <div className="text-gray-400 leading-relaxed space-y-4">
            <p>
              There are no right answers. The goal isn't to "score high" on any archetype.
              You carry all of them—some developed, some dormant, some wounded, some whole.
            </p>
            <p>
              We'll explore four territories:
            </p>
            <ul className="space-y-2 ml-4">
              <li><span className="text-white">Essence</span> — who you are when you're not performing</li>
              <li><span className="text-white">Shadow</span> — what happens when you lose yourself</li>
              <li><span className="text-white">Relationships</span> — how you love, and where it breaks</li>
              <li><span className="text-white">Growth</span> — where your next evolution lives</li>
            </ul>
            <p>
              You'll see not just which archetypes are strong in you, but how integrated they are—
              the difference between mature expression and shadow patterns.
            </p>
            <p className="text-gray-500 italic">
              {gender === 'man'
                ? "As a man, your primary archetypes are King, Warrior, Magician, and Lover. You'll also see your inner feminine—what Jung called the anima."
                : "As a woman, your primary archetypes are Queen, Mother, Lover, Maiden, Huntress, Mystic, and Wild Woman. You'll also see your inner masculine—what Jung called the animus."
              }
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => setPhase('essence')}
            className="px-8 py-4 bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 hover:border-zinc-600 transition-colors"
          >
            Begin Exploration
          </button>
          <p className="text-gray-600 text-sm mt-4">
            {totalQuestions} questions · Takes 10-15 minutes
          </p>
        </div>

        <button
          onClick={() => setPhase('gender')}
          className="text-gray-600 hover:text-white transition-colors text-sm block mx-auto"
        >
          ← Change selection
        </button>
      </div>
    );
  }

  // Results
  if (phase === 'results') {
    const topPrimary = profiles.primary.slice(0, 3);
    const topSecondary = profiles.secondary.slice(0, 2);
    const primaryColor = gender === 'man' ? 'text-amber-500' : 'text-purple-400';
    const secondaryColor = gender === 'man' ? 'text-purple-400' : 'text-amber-500';

    const combinationInsight = getCombinationInsight(topPrimary);

    // Determine if more shadow than mature for top archetype
    const topArchetype = topPrimary[0];
    const isWounded = topArchetype.ratio < 0.4;
    const isIntegrated = topArchetype.ratio > 0.65;

    const getArchetypeDescription = (archetype: string, type: 'masculine' | 'feminine') => {
      if (type === 'masculine') {
        return archetypeDescriptions.masculine[archetype as MasculineArchetype];
      }
      return archetypeDescriptions.feminine[archetype as FeminineArchetype];
    };

    return (
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="font-serif text-3xl text-white">Your Archetype Profile</h2>

          {/* Primary archetype(s) */}
          <div className="space-y-2">
            <p className="text-gray-500 text-sm">Primary Constellation</p>
            <p className={`font-serif text-2xl ${primaryColor}`}>
              {topPrimary.length >= 2 && topPrimary[1].total > topPrimary[0].total * 0.6
                ? `${topPrimary[0].archetype} — ${topPrimary[1].archetype}`
                : topPrimary[0].archetype
              }
            </p>
            {isWounded && (
              <p className="text-gray-500 text-sm italic">
                (with significant shadow activation)
              </p>
            )}
          </div>
        </div>

        {/* Combination insight */}
        {combinationInsight && (
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <h3 className="font-serif text-lg text-white mb-3">Your Combination</h3>
            <p className="text-gray-400 leading-relaxed">{combinationInsight}</p>
          </div>
        )}

        {/* Primary archetypes breakdown */}
        <div className="space-y-4">
          <h3 className={`font-serif text-lg ${primaryColor} border-b border-zinc-800 pb-2`}>
            {gender === 'man' ? 'Your Masculine Archetypes' : 'Your Feminine Archetypes'}
          </h3>

          {topPrimary.map((profile) => {
            const desc = getArchetypeDescription(
              profile.archetype,
              gender === 'man' ? 'masculine' : 'feminine'
            );
            const isExpanded = expandedSection === `p-${profile.archetype}`;
            const maturePercent = profile.total > 0 ? Math.round((profile.mature / profile.total) * 100) : 50;
            const shadowPercent = 100 - maturePercent;

            return (
              <div key={profile.archetype} className="border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : `p-${profile.archetype}`)}
                  className="w-full p-4 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-serif text-lg text-white">{desc.name}</h4>
                      <span className="text-xs text-gray-500 italic">{desc.essence}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {profile.total} pts
                    </span>
                  </div>

                  {/* Mature vs Shadow bar */}
                  <div className="flex h-2 gap-0.5">
                    <div
                      className="bg-emerald-600 transition-all"
                      style={{ width: `${maturePercent}%` }}
                      title={`${maturePercent}% mature`}
                    />
                    <div
                      className="bg-red-900 transition-all"
                      style={{ width: `${shadowPercent}%` }}
                      title={`${shadowPercent}% shadow`}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>Mature: {maturePercent}%</span>
                    <span>Shadow: {shadowPercent}%</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-zinc-800 pt-4 space-y-4">
                    <div>
                      <p className="text-xs text-emerald-600 mb-1 uppercase tracking-wide">When Integrated</p>
                      <p className="text-sm text-gray-400">{desc.matureDescription}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-700 mb-1 uppercase tracking-wide">In Shadow</p>
                      <p className="text-sm text-gray-500">{desc.shadowDescription}</p>
                    </div>
                    {profile.shadow > profile.mature && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Wounded Patterns to Watch</p>
                        <ul className="text-sm text-gray-500 space-y-1">
                          {desc.woundedPatterns.map((pattern, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-gray-700">•</span>
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="bg-zinc-800/50 p-3 border-l-2 border-amber-600">
                      <p className="text-xs text-gray-600 mb-1">Integration Path</p>
                      <p className="text-sm text-gray-400">{desc.integration}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 italic">
                        Reflection: {desc.question}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Show remaining archetypes collapsed */}
          {profiles.primary.slice(3).length > 0 && (
            <div className="text-gray-600 text-sm pt-2">
              <p className="mb-2">Other archetypes present:</p>
              <div className="flex flex-wrap gap-2">
                {profiles.primary.slice(3).map((profile) => (
                  <span key={profile.archetype} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-xs">
                    {profile.archetype} ({profile.total})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inner opposite */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className={`font-serif text-lg ${secondaryColor} mb-2`}>
            Your Inner {gender === 'man' ? 'Feminine' : 'Masculine'} (Anima/Animus)
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {gender === 'man'
              ? "The inner feminine that every man carries. Integrating it leads to wholeness—and to genuine connection with women."
              : "The inner masculine that every woman carries. Integrating it leads to wholeness—and to genuine connection with men."
            }
          </p>

          <div className="space-y-2">
            {topSecondary.map((profile) => {
              const desc = getArchetypeDescription(
                profile.archetype,
                gender === 'man' ? 'feminine' : 'masculine'
              );
              const maturePercent = profile.total > 0 ? Math.round((profile.mature / profile.total) * 100) : 50;

              return (
                <div key={profile.archetype} className="p-3 bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-serif ${secondaryColor}`}>{desc.name}</span>
                      <span className="text-xs text-gray-600">{desc.essence}</span>
                    </div>
                    <span className="text-xs text-gray-500">{maturePercent}% mature</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What now */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h3 className="font-serif text-lg text-white">What Now?</h3>
          <div className="text-gray-400 text-sm leading-relaxed space-y-3">
            {isWounded ? (
              <p>
                Your results show significant shadow activation in your primary archetype.
                This isn't bad—it's where the work is. Shadow only stays shadow when we don't look at it.
                The patterns listed above are your map to integration.
              </p>
            ) : isIntegrated ? (
              <p>
                Your results show relatively integrated expression of your primary archetypes.
                The question now isn't fixing what's broken—it's deepening what's working.
                Where can this energy be of greater service?
              </p>
            ) : (
              <p>
                You show a mix of mature and shadow expression—which is normal for anyone doing the work.
                Pay attention to which situations activate which patterns.
                The shadow isn't the enemy; it's the part that hasn't been integrated yet.
              </p>
            )}
            <p>
              These archetypes aren't static. They shift based on stress, relationships, and the work you do.
              Consider revisiting this exploration when life circumstances change significantly.
            </p>
          </div>
        </div>

        {/* Related content */}
        <div className="border-t border-zinc-800 pt-8">
          <h3 className="font-serif text-lg text-white mb-4">Go Deeper</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/posts/the-four-masculine-archetypes"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">The Four Masculine Archetypes</h4>
              <p className="text-sm text-gray-500">King, Warrior, Magician, Lover—and their shadows</p>
            </Link>
            <Link
              href="/posts/the-seven-feminine-archetypes"
              className="block p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <h4 className="font-medium text-white mb-1">The Seven Feminine Archetypes</h4>
              <p className="text-sm text-gray-500">Queen, Mother, Lover, Maiden, Huntress, Mystic, Wild Woman</p>
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
            href="/mind"
            className="px-6 py-3 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-center"
          >
            Explore Mind
          </Link>
        </div>
      </div>
    );
  }

  // Questions
  const question = currentPhaseQuestions[currentQuestionIndex];

  return (
    <div>
      {/* Phase indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs uppercase tracking-wide text-gray-600">
            {getPhaseTitle(phase)}
          </span>
          <span className="text-gray-700">—</span>
          <span className="text-xs text-gray-500 italic">
            {getPhaseSubtitle(phase)}
          </span>
        </div>

        {/* Overall progress */}
        <div className="flex gap-0.5">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 transition-colors ${
                index < completedQuestions ? 'bg-white' :
                index === completedQuestions ? 'bg-gray-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2 text-right">
          {completedQuestions + 1} of {totalQuestions}
        </p>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-white mb-2">{question.text}</h2>
        {question.context && (
          <p className="text-sm text-gray-500 italic">{question.context}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option.scores)}
            className="w-full p-4 text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
          >
            <span className="text-gray-300 hover:text-white block">
              {option.label}
            </span>
            {option.subtext && (
              <span className="text-gray-600 text-sm block mt-1">
                {option.subtext}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
