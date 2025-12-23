'use client';

import Navigation from '../components/Navigation';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

const AMAZON_AFFILIATE_TAG = 'integratedhum-20';

interface Book {
  title: string;
  author: string;
  note?: string;
  description?: string; // Back-of-book style description
  whyWeRecommend?: string; // Personal take on why this book matters
  isbn?: string;
  asin: string;
  relatedContent?: { title: string; href: string }[];
}

interface Category {
  name: string;
  slug: string;
  description: string;
  books: Book[];
}

function getAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;
}

function getCoverUrl(isbn?: string): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}

function getLargeCoverUrl(isbn?: string): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

const categories: Category[] = [
  {
    name: 'Where to Start',
    slug: 'where-to-start',
    description: 'Accessible entry points for the journey inward.',
    books: [
      {
        title: 'The Power of Now',
        author: 'Eckhart Tolle',
        isbn: '9781577314806',
        asin: '1577314808',
        note: 'Widely read introduction to presence. Can become its own trap if used to bypass psychology, but useful as a first taste.',
        description: 'Tolle\'s breakthrough book on presence and the pain-body. A global phenomenon that introduced millions to the concept of present-moment awareness. Best read as an entry point, not an endpoint—the psychological work still needs to be done.',
        whyWeRecommend: 'This book has woken more people up to the possibility of presence than perhaps any other. Yes, it can become a spiritual bypassing trap. But for many, it\'s the first crack in the wall—the first glimpse that there\'s something beyond the endless mental chatter.',
      },
      {
        title: 'The Untethered Soul',
        author: 'Michael Singer',
        isbn: '9781572245372',
        asin: '1572245379',
        note: 'Clear, practical pointing toward awareness. Good bridge between self-help and deeper work.',
        description: 'Singer offers a practical guide to inner freedom through witnessing thoughts and emotions rather than identifying with them. Clear, accessible, and grounded—a solid bridge between self-help and genuine spiritual inquiry.',
      },
      {
        title: 'When Things Fall Apart',
        author: 'Pema Chödrön',
        isbn: '9781570629693',
        asin: '1570629692',
        note: 'Buddhist wisdom for crisis. For when everything is collapsing and you\'re tired of running.',
        description: 'Pema Chödrön offers Buddhist wisdom for navigating difficulty, uncertainty, and the groundlessness of life. Written with warmth and honesty, this is the book to read when you\'re in crisis and need someone who understands.',
        whyWeRecommend: 'When life falls apart, most books offer false comfort or quick fixes. Pema doesn\'t. She sits with you in the darkness and shows you that groundlessness itself can become the ground. This book has been a lifeline for countless people in crisis.',
      },
      {
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        isbn: '9780440351832',
        asin: '0440351839',
        note: 'Jung\'s most accessible work on the unconscious, symbols, and dreams. Start here for shadow work without academic density.',
        description: 'The only book Jung wrote for a general audience, completed just before his death. An accessible introduction to the collective unconscious, archetypes, and the symbolic language of dreams. The gateway to Jungian psychology.',
        whyWeRecommend: 'Jung can be impenetrable. This book isn\'t. It\'s the door into understanding why your dreams matter, what archetypes are, and why the unconscious is not your enemy but a source of wisdom. If you\'re curious about shadow work, start here.',
      },
      {
        title: 'Letters to a Young Poet',
        author: 'Rainer Maria Rilke',
        isbn: '9780393310399',
        asin: '0393310396',
        note: 'Timeless guidance on solitude, patience, and living the questions. Short but inexhaustible.',
        description: 'Ten letters from Rilke to a young aspiring poet, containing some of the most beautiful guidance ever written on solitude, creativity, and the inner life. "Be patient toward all that is unsolved in your heart." Short enough to read in an hour, deep enough to return to for a lifetime.',
        whyWeRecommend: 'You can read this in one sitting. You\'ll return to it for decades. Rilke\'s advice transcends poetry—it\'s about how to live with uncertainty, how to let things ripen, how to trust the process. Everyone doing inner work should own a copy.',
      },
      {
        title: 'Flow',
        author: 'Mihaly Csikszentmihalyi',
        isbn: '9780061339202',
        asin: '0061339202',
        note: 'The psychology of optimal experience. When skill meets challenge and self-consciousness dissolves.',
        description: 'Csikszentmihalyi\'s research on "flow states"—those moments when we\'re so absorbed in an activity that self-consciousness dissolves. Understanding flow helps explain why presence feels good and how to cultivate conditions for it.',
      },
    ],
  },
  {
    name: 'The Psychological Work',
    slug: 'psychological-work',
    description: 'Shadow, archetypes, and the integration of the psyche.',
    books: [
      {
        title: 'The Undiscovered Self',
        author: 'Carl Jung',
        isbn: '9780451217325',
        asin: '0451217322',
        note: 'Jung on individuation and the dangers of mass-mindedness. Short, potent.',
        description: 'A brief but powerful essay on the individual versus the collective, written in response to the totalitarian movements of the 20th century. Jung argues that self-knowledge is not just personal—it\'s a political and moral necessity.',
      },
      {
        title: 'Memories, Dreams, Reflections',
        author: 'Carl Jung',
        isbn: '9780679723950',
        asin: '0679723951',
        note: 'Jung\'s autobiography. His own confrontation with the unconscious.',
        description: 'Jung\'s autobiography, dictated near the end of his life. The story of his own confrontation with the unconscious—the visions, the crisis, the descent into the psyche that birthed his life\'s work. Essential for understanding Jung as a person, not just a theorist.',
      },
      {
        title: 'The Soul\'s Code',
        author: 'James Hillman',
        isbn: '9780446673716',
        asin: '0446673714',
        note: 'Hillman\'s acorn theory — that your calling is already present. Challenging, beautiful.',
        description: 'Hillman\'s "acorn theory" proposes that each life has a unique calling, present from birth. Challenging the reductive view that we\'re shaped entirely by genes and environment. Beautifully written, occasionally frustrating, ultimately liberating.',
      },
      {
        title: 'The Hero with a Thousand Faces',
        author: 'Joseph Campbell',
        isbn: '9781577315933',
        asin: '1577315936',
        note: 'The mythological structure of transformation. The hero\'s journey as psychological map.',
        description: 'Campbell\'s comparative mythology reveals the universal pattern of the hero\'s journey: separation, initiation, return. More than literary analysis—it\'s a map of psychological transformation that appears across all cultures.',
      },
      {
        title: 'Myths to Live By',
        author: 'Joseph Campbell',
        isbn: '9780140194616',
        asin: '0140194614',
        note: 'Campbell on how myths still function in modern life. More accessible than Hero.',
        description: 'Lectures from Campbell on how mythology still operates in modern life. More accessible than Hero with a Thousand Faces, this is a good entry point to Campbell\'s thinking on myth, meaning, and the psychological function of stories.',
      },
      {
        title: 'A Little Book on the Human Shadow',
        author: 'Robert Bly',
        isbn: '9780062548474',
        asin: '0062548476',
        note: 'Brief, powerful introduction to shadow work. How we throw parts of ourselves into "the bag."',
        description: 'Bly\'s brief, poetic introduction to shadow work. The metaphor of "the bag"—how we spend the first half of life throwing parts of ourselves away, and the second half trying to retrieve them. Essential reading for anyone beginning shadow work.',
        whyWeRecommend: 'Under 100 pages, yet it explains the mechanics of shadow formation better than books ten times its length. The "bag" metaphor will change how you understand your own rejected parts. Start shadow work here.',
      },
      {
        title: 'Iron John',
        author: 'Robert Bly',
        isbn: '9780306824265',
        asin: '0306824264',
        note: 'Masculine initiation through fairy tale. Polarizing but important for men doing the work.',
        description: 'Bly\'s reading of the Grimm fairy tale as a map of masculine initiation. Polarizing and sometimes dated, but contains genuine insight into the wounds of uninitiated masculinity. Best read critically, taking what resonates.',
      },
      {
        title: 'Women Who Run with the Wolves',
        author: 'Clarissa Pinkola Estés',
        isbn: '9780345409874',
        asin: '034540987X',
        note: 'The wild feminine through myth and story. Essential for women reclaiming instinctual nature.',
        description: 'Estés, a Jungian analyst and storyteller, uses myths and fairy tales to illuminate the "Wild Woman" archetype—the instinctual, creative feminine that domestication suppresses. Dense, rich, and essential for women doing the work of reclamation.',
        whyWeRecommend: 'For women who sense that something wild and instinctual has been lost—and want it back. Estés doesn\'t just analyze myths; she transmits something through them. Keep it on your nightstand and read one story at a time.',
      },
      {
        title: 'King, Warrior, Magician, Lover',
        author: 'Robert Moore & Douglas Gillette',
        isbn: '9780062506061',
        asin: '0062506064',
        note: 'Archetypal masculine patterns. Useful framework — hold lightly, integrate what lands.',
        description: 'Moore and Gillette\'s Jungian map of mature masculine archetypes and their shadows. A useful framework for understanding masculine energy, though best held lightly. Each archetype has a mature and immature expression; the work is integration.',
      },
      {
        title: 'To Have or To Be?',
        author: 'Erich Fromm',
        isbn: '9780826409126',
        asin: '1472505298',
        note: 'Two modes of existence. Still relevant diagnosis of modern alienation.',
        description: 'Fromm distinguishes between two fundamental modes of existence: having (acquisition, possession, control) and being (experience, connection, presence). A still-relevant diagnosis of modern alienation and consumerism.',
      },
      {
        title: 'Gravity and Grace',
        author: 'Simone Weil',
        isbn: '9780803298019',
        asin: '0415290015',
        note: 'Mystical philosophy. Dense, demanding, occasionally shattering.',
        description: 'Fragments from Weil\'s notebooks, edited after her death. Dense, aphoristic, demanding. Her concept of "decreation"—the ego getting out of the way so grace can flow—is challenging and occasionally shattering.',
      },
      {
        title: 'Toward a Psychology of Awakening',
        author: 'John Welwood',
        isbn: '9781570628238',
        asin: '1570628238',
        note: 'Where psychology meets spirituality. Welwood coined "spiritual bypassing" — this book shows the integration.',
        description: 'Welwood, who coined the term "spiritual bypassing," bridges Western psychology and Eastern wisdom. This book shows how psychological work and spiritual practice support each other. Essential for avoiding the trap of using spirituality to avoid psychology.',
      },
      {
        title: 'Spiritual Bypassing',
        author: 'Robert Augustus Masters',
        isbn: '9781556439056',
        asin: '1556439059',
        note: 'How spirituality becomes avoidance. Essential reading for anyone on this path.',
        description: 'Masters expands on Welwood\'s concept, showing how spiritual beliefs and practices can be used to avoid difficult emotions, developmental challenges, and genuine transformation. If you\'re serious about this path, this book will save you years of self-deception.',
      },
    ],
  },
  {
    name: 'The Body',
    slug: 'the-body',
    description: 'Trauma, the nervous system, and embodied healing.',
    books: [
      {
        title: 'The Body Keeps the Score',
        author: 'Bessel van der Kolk',
        isbn: '9780143127741',
        asin: '0143127748',
        note: 'How trauma lives in the body. Why insight alone doesn\'t heal.',
        description: 'Van der Kolk\'s landmark work on trauma. Drawing on decades of research and clinical experience, he shows how trauma reshapes both body and brain—and why traditional talk therapy often isn\'t enough. Essential for understanding why embodiment matters.',
        whyWeRecommend: 'If you\'ve wondered why understanding your patterns doesn\'t seem to change them, this book explains why. Trauma isn\'t just a story you tell—it lives in your nervous system. Van der Kolk changed how we think about healing.',
      },
      {
        title: 'Waking the Tiger',
        author: 'Peter Levine',
        isbn: '9781556432330',
        asin: '155643233X',
        note: 'Somatic experiencing and trauma release. How animals discharge trauma — and how we don\'t.',
        description: 'Levine\'s foundational work on somatic experiencing. Animals in the wild don\'t get PTSD because they discharge the survival energy after threat passes. Humans get stuck. This book shows why—and offers a path to completion.',
      },
      {
        title: 'In an Unspoken Voice',
        author: 'Peter Levine',
        isbn: '9781556439438',
        asin: '1556439431',
        note: 'Deeper dive into the body\'s wisdom and trauma resolution.',
        description: 'Levine\'s more comprehensive exploration of the body\'s role in trauma and healing. Denser than Waking the Tiger, but richer. For those who want to go deeper into the somatic approach.',
      },
      {
        title: 'Attached',
        author: 'Amir Levine & Rachel Heller',
        isbn: '9781585429134',
        asin: '1585429139',
        note: 'Attachment theory made practical. Anxious, avoidant, secure — know your patterns.',
        description: 'Attachment theory made practical and accessible. Understand your attachment style (anxious, avoidant, secure) and how it shapes your relationships. Knowing your patterns is the first step to changing them.',
      },
    ],
  },
  {
    name: 'Direct Pointing',
    slug: 'direct-pointing',
    description: 'Truth without ornament. What you are, not what you\'re becoming.',
    books: [
      {
        title: 'Who Am I?',
        author: 'Ramana Maharshi',
        isbn: '9788188018017',
        asin: '8188018015',
        note: 'The core question. Short, direct, foundational for self-inquiry.',
        description: 'Ramana\'s essential teaching distilled to its purest form. Not a practice to do, but a question to live. "Who am I?" pursued relentlessly until the questioner dissolves. The foundation of self-inquiry.',
      },
      {
        title: 'Be As You Are',
        author: 'Ramana Maharshi (edited by David Godman)',
        isbn: '9780140190625',
        asin: '0140190627',
        note: 'Essential teachings organized by topic. The best Ramana compilation.',
        description: 'David Godman\'s masterful compilation of Ramana\'s teachings, organized thematically. Covers self-inquiry, the nature of the self, meditation, and the guru-disciple relationship. The best single-volume introduction to Ramana.',
      },
      {
        title: 'Talks with Sri Ramana Maharshi',
        author: 'Ramana Maharshi',
        isbn: '9788188018079',
        asin: '8188018074',
        note: 'Direct dialogues. Raw, unfiltered.',
        description: 'Transcripts of conversations with visitors to Ramana\'s ashram. Raw, unedited, and powerful. See how the sage responded to genuine seekers with questions about life, death, suffering, and liberation.',
      },
      {
        title: 'I Am That',
        author: 'Nisargadatta Maharaj',
        isbn: '9780893860226',
        asin: '0893860220',
        note: 'Dialogues with a Bombay cigarette seller who woke up. Fierce, uncompromising.',
        whyWeRecommend: 'A cigarette seller in Bombay who became one of the most direct pointers to what you are. This book is a conversation with someone who isn\'t trying to be spiritual, just relentlessly honest. Return to it again and again—it reveals more each time.',
        description: 'Dialogues with Nisargadatta, a cigarette seller in Bombay who woke up. His teaching style is fierce, uncompromising, and devastatingly direct. "You are not what you think you are." One of the most important spiritual books of the 20th century.',
      },
      {
        title: 'Prior to Consciousness',
        author: 'Nisargadatta Maharaj',
        isbn: '9780893860240',
        asin: '0893860247',
        note: 'Later, more radical teachings. For after you\'ve sat with I Am That.',
        description: 'Nisargadatta\'s later teachings, from the final years of his life. More radical, more stripped down. Not for beginners—read I Am That first and sit with it before coming here.',
      },
      {
        title: 'Nothing Ever Happened',
        author: 'Papaji (H.W.L. Poonja)',
        isbn: '9780971078611',
        asin: '0971078610',
        note: 'Stories and teachings from Ramana\'s most famous student.',
        description: 'The life and teachings of Papaji, Ramana\'s most famous devotee. David Godman\'s three-volume biography. Stories, dialogues, and the transmission of a living tradition.',
      },
      {
        title: 'I Am',
        author: 'Jean Klein',
        isbn: '9781908664167',
        asin: '1908664169',
        note: 'European Advaita. Clear, refined pointing.',
        description: 'Jean Klein brought Advaita to the West with elegance and precision. A musicologist and physician, his teaching style is refined, embodied, and grounded. Clear pointing without mystical ornamentation.',
      },
      {
        title: 'The End of Your World',
        author: 'Adyashanti',
        isbn: '9781591797791',
        asin: '1591797799',
        note: 'What happens after awakening. The integration that follows glimpses.',
        description: 'Adyashanti addresses what happens after initial awakening—the disorientation, the integration, the ways ego can co-opt the experience. Essential for anyone who\'s had glimpses and wonders what comes next.',
      },
      {
        title: 'True Meditation',
        author: 'Adyashanti',
        isbn: '9781591794097',
        asin: '1591794099',
        note: 'Meditation as allowing, not doing. Simple instructions.',
        description: 'Adyashanti\'s approach to meditation: stop trying to get somewhere. Allow experience to be as it is. Simple, radical, and effective. Includes guided meditations.',
      },
      {
        title: 'Freedom from the Known',
        author: 'Jiddu Krishnamurti',
        isbn: '9780060648084',
        asin: '0060648082',
        note: 'Deconstruction of the spiritual search itself. No authority, no method, just seeing.',
        description: 'Krishnamurti dismantles the entire spiritual project: no gurus, no methods, no authority, no time. Just direct seeing. Challenging because he offers no handholds—but that\'s precisely the point.',
      },
      {
        title: 'The First and Last Freedom',
        author: 'Jiddu Krishnamurti',
        isbn: '9780060648312',
        asin: '0060648317',
        note: 'Core themes — thought, fear, relationship. With Aldous Huxley\'s foreword.',
        description: 'Krishnamurti on thought, fear, self-knowledge, and relationship. With a foreword by Aldous Huxley. More structured than his later works, making it a good entry point to his uncompromising teaching.',
      },
    ],
  },
  {
    name: 'Tao & Zen',
    slug: 'tao-zen',
    description: 'Effortless action, beginner\'s mind, and the way that cannot be named.',
    books: [
      {
        title: 'Tao Te Ching',
        author: 'Lao Tzu (Stephen Mitchell translation)',
        isbn: '9780060812454',
        asin: '0060812451',
        note: 'Flow, paradox, strength in softness. The water that wears down stone.',
        description: 'The foundational text of Taoism. Paradoxical, poetic, inexhaustible. Stephen Mitchell\'s translation is clear and poetic, though some prefer more literal versions. The water that wears down stone.',
      },
      {
        title: 'The Way of Chuang Tzu',
        author: 'Thomas Merton (translator)',
        isbn: '9780811218511',
        asin: '0811201031',
        note: 'Taoist stories and koans. Merton\'s beautiful rendering.',
        description: 'Thomas Merton\'s free renderings of Chuang Tzu\'s stories and paradoxes. Not a scholarly translation but a meeting of contemplative minds across traditions. Playful, profound, and subversive.',
      },
      {
        title: 'Zen Mind, Beginner\'s Mind',
        author: 'Shunryu Suzuki',
        isbn: '9781590308493',
        asin: '1590308492',
        note: 'The mind that is empty and ready for anything. Foundational Zen.',
        description: 'Suzuki Roshi\'s simple, direct talks on Zen practice. "In the beginner\'s mind there are many possibilities, in the expert\'s mind there are few." Foundational for anyone interested in Zen.',
      },
      {
        title: 'The Zen Teaching of Huang Po',
        author: 'Huang Po (John Blofeld translation)',
        isbn: '9780802150929',
        asin: '0802150926',
        note: 'Direct, fierce Chan Buddhism. No gradual path — only sudden seeing.',
        description: 'Huang Po\'s fierce Chan teaching from 9th century China. No gradual path, no accumulation of merit, no practices that will eventually get you there. Only sudden recognition of what you already are.',
      },
      {
        title: 'The Book',
        author: 'Alan Watts',
        isbn: '9780679723011',
        asin: '0679723013',
        note: 'On the taboo against knowing who you are. Watts at his most direct.',
        description: 'Watts on the fundamental illusion of the separate self—"the taboo against knowing who you are." His most direct book, cutting through the game of hide-and-seek that consciousness plays with itself.',
      },
      {
        title: 'The Wisdom of Insecurity',
        author: 'Alan Watts',
        isbn: '9780307741202',
        asin: '0307741206',
        note: 'Why searching for security creates anxiety. Letting go of the ground.',
        description: 'Watts shows how the search for security creates insecurity. The attempt to grasp life kills it. A message that\'s become even more relevant in our anxious age.',
      },
      {
        title: 'The Way of Zen',
        author: 'Alan Watts',
        isbn: '9780375705106',
        asin: '0375705104',
        note: 'Clear introduction to Zen philosophy and practice. Strips away mystical nonsense.',
        description: 'Watts\' accessible introduction to Zen philosophy and practice. Part history, part teaching, completely free of mystical pretense. Still one of the best introductions for Western readers.',
      },
      {
        title: 'Psychotherapy East and West',
        author: 'Alan Watts',
        isbn: '9781608684564',
        asin: '1608684563',
        note: 'Where psychology meets liberation. Therapy as awakening, not adjustment.',
        description: 'Watts bridges Western psychotherapy and Eastern liberation. What if therapy isn\'t about adjusting to society but waking up from the social game entirely? Essential for anyone working in both psychological and spiritual dimensions.',
      },
    ],
  },
  {
    name: 'The Poetic Dimension',
    slug: 'poetic-dimension',
    description: 'Beauty as a path to truth. The heart\'s knowing.',
    books: [
      {
        title: 'The Prophet',
        author: 'Khalil Gibran',
        isbn: '9780394404288',
        asin: '0394404289',
        note: 'Poetic wisdom on love, work, death, freedom. Timeless.',
        description: 'Gibran\'s masterpiece. A prophet leaving a city is asked to speak on love, work, marriage, children, death, freedom. Each response is a poem. Beautiful, sometimes sentimental, but containing genuine wisdom.',
      },
      {
        title: 'Sand and Foam',
        author: 'Khalil Gibran',
        isbn: '9780394430690',
        asin: '0394430697',
        note: 'Aphorisms and parables. Brief flashes of insight.',
        description: 'Gibran\'s book of aphorisms and short parables. Brief flashes of insight. "Half of what I say is meaningless, but I say it so that the other half may reach you."',
      },
      {
        title: 'The Essential Rumi',
        author: 'Rumi (Coleman Barks translation)',
        isbn: '9780062509598',
        asin: '0062509594',
        note: 'The beloved mystic. Barks\' translations are beautiful, though scholars note he removes Islamic context.',
        description: 'Coleman Barks\' translations of Rumi have brought the 13th-century Sufi mystic to millions of modern readers. Beautiful and accessible, though scholars note he strips away the Islamic context. Read for the beauty; be aware of what\'s lost.',
      },
      {
        title: 'The Gift',
        author: 'Hafiz (Daniel Ladinsky translation)',
        isbn: '9780140195811',
        asin: '0140195815',
        note: 'Ecstatic, playful, devotional. Like drinking wine with God.',
        description: 'Ladinsky\'s renderings of Hafiz are ecstatic, playful, and devotional. Purists object to how far he departs from literal translation, but the joy is infectious. Like drinking wine with God.',
      },
      {
        title: 'Duino Elegies',
        author: 'Rainer Maria Rilke',
        isbn: '9780393328844',
        asin: '0393328848',
        note: 'Angels, transformation, the difficulty of being human. Demanding but essential.',
        description: 'Rilke\'s ten elegies, written over a decade, on angels, death, love, and the difficulty of being human. Demanding poetry that rewards repeated reading. Stephen Mitchell\'s translation is excellent.',
      },
      {
        title: 'Sonnets to Orpheus',
        author: 'Rainer Maria Rilke',
        isbn: '9780393329100',
        asin: '0393329100',
        note: 'Song, death, praise. Written in a single burst of inspiration.',
        description: 'Written in a burst of inspiration alongside the completion of the Elegies. Song, death, praise, transformation. "Be ahead of all parting, as though it were behind you."',
      },
      {
        title: 'Gitanjali',
        author: 'Rabindranath Tagore',
        isbn: '9780684839349',
        asin: '1420954059',
        note: 'Song offerings. Devotional poetry that won the Nobel Prize.',
        description: 'Tagore\'s "Song Offerings," which won him the Nobel Prize. Devotional poetry of profound beauty and simplicity. "Where the mind is without fear and the head is held high..."',
      },
      {
        title: 'The Marriage of Heaven and Hell',
        author: 'William Blake',
        isbn: '9780486281223',
        asin: '0486281221',
        note: 'Proverbs of Hell, the energy of desire. "The road of excess leads to the palace of wisdom."',
        description: 'Blake\'s visionary, subversive work. The "Proverbs of Hell" alone are worth the price. "The road of excess leads to the palace of wisdom." Not a book to agree with, but to be disturbed by.',
      },
    ],
  },
  {
    name: 'Edge Exploration',
    slug: 'edge-exploration',
    description: 'Psychedelics, consciousness, and the territory beyond ordinary mind.',
    books: [
      {
        title: 'The Doors of Perception / Heaven and Hell',
        author: 'Aldous Huxley',
        isbn: '9780060595180',
        asin: '0061729078',
        note: 'Huxley\'s mescaline experience and its implications. The book that named The Doors.',
        description: 'Huxley\'s account of his mescaline experience and its implications for consciousness, art, and religion. The book that named The Doors. Essential reading for anyone interested in the relationship between psychedelics and mysticism.',
      },
      {
        title: 'Island',
        author: 'Aldous Huxley',
        isbn: '9780061561795',
        asin: '0061561797',
        note: 'Huxley\'s utopian vision. A society built on presence, psychedelics, and integration.',
        description: 'Huxley\'s utopian novel—the counterpoint to Brave New World. A society built on presence, psychedelics wisely used, and psychological integration. His final word on how things could be.',
      },
      {
        title: 'Food of the Gods',
        author: 'Terence McKenna',
        isbn: '9780553371307',
        asin: '0553371304',
        note: 'Plants, consciousness, and human evolution. McKenna\'s stoned ape theory and beyond.',
        description: 'McKenna\'s exploration of the relationship between plants and human consciousness. His "stoned ape theory" is controversial, but the book is a fascinating journey through the history of psychedelics and their role in human culture.',
      },
      {
        title: 'True Hallucinations',
        author: 'Terence McKenna',
        isbn: '9780062506528',
        asin: '0062506528',
        note: 'The Amazon experiment. Wild, strange, unforgettable.',
        description: 'McKenna\'s account of his and his brother\'s experiment in the Amazon with psilocybin mushrooms. Wild, strange, possibly delusional, definitely unforgettable. Read it for the journey, not as scientific evidence.',
      },
      {
        title: 'The Archaic Revival',
        author: 'Terence McKenna',
        isbn: '9780062506139',
        asin: '0062506137',
        note: 'Essays and interviews. McKenna\'s vision of a return to the archaic.',
        description: 'Essays and interviews covering McKenna\'s vision of humanity\'s need to return to archaic values—including the use of psychedelics for consciousness expansion. His ideas are provocative; take what resonates.',
      },
      {
        title: 'The Holotropic Mind',
        author: 'Stanislav Grof',
        isbn: '9780062506597',
        asin: '0062506595',
        note: 'Maps of consciousness from decades of psychedelic research. More clinical than McKenna.',
        description: 'Grof\'s maps of consciousness drawn from decades of psychedelic research. More clinical than McKenna, more rigorous than New Age. His concept of "holotropic" states—moving toward wholeness—is genuinely useful.',
      },
      {
        title: 'How to Change Your Mind',
        author: 'Michael Pollan',
        isbn: '9780735224155',
        asin: '0735224153',
        note: 'Accessible overview of psychedelic renaissance. Good entry point for the skeptical.',
        description: 'Pollan\'s accessible exploration of the psychedelic renaissance—the science, the history, and his own experiences. A good entry point for skeptics curious about the therapeutic potential of these substances.',
      },
    ],
  },
  {
    name: 'Radical Deconstruction',
    slug: 'radical-deconstruction',
    description: 'The anti-spiritual. Burning down the temple.',
    books: [
      {
        title: 'Spiritual Enlightenment: The Damnedest Thing',
        author: 'Jed McKenna',
        isbn: '9780980184846',
        asin: '0980184843',
        note: 'Brutal, funny, relentless. Destroys every comfortable spiritual belief. The essential one.',
        whyWeRecommend: 'Either this book will infuriate you or it will crack something open. McKenna burns down every spiritual comfort zone with dark humor and zero sentimentality. Not for everyone—but if you\'re ready to question everything, there\'s nothing quite like it.',
        description: 'Jed McKenna (a pseudonym) tears apart every comfortable spiritual belief with brutal humor and relentless logic. This book will offend you if you\'re attached to your spiritual self-image. That might be exactly why you need to read it.',
      },
      {
        title: 'The Mystique of Enlightenment',
        author: 'U.G. Krishnamurti',
        isbn: '9780971078628',
        asin: '0971078629',
        note: 'The anti-guru. Rejected all spiritual teaching including his own. Disorienting, important.',
        description: 'U.G. (not to be confused with J. Krishnamurti) rejected all spiritual teaching—including his own. He called his state "the natural state" and insisted it had nothing to do with enlightenment as typically conceived. Disorienting, frustrating, and strangely liberating.',
      },
    ],
  },
];

// Book detail modal component
function BookModal({
  book,
  isOpen,
  onClose
}: {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !book) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero section with cover */}
        <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex gap-6 items-start">
            {/* Book cover - larger, with shadow */}
            {book.isbn && (
              <div className="w-32 h-48 bg-zinc-700 flex-shrink-0 relative overflow-hidden shadow-xl">
                <Image
                  src={getLargeCoverUrl(book.isbn) || ''}
                  alt={`Cover of ${book.title}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="flex-1 pt-2">
              <h2 className="font-serif text-3xl text-white mb-2 leading-tight">{book.title}</h2>
              <p className="text-gray-300 text-lg mb-4">by {book.author}</p>

              {/* Quick note - the hook */}
              {book.note && (
                <p className="text-amber-400/90 text-sm italic leading-relaxed">
                  &ldquo;{book.note}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main content - like back of book */}
        <div className="p-8">
          {/* Description */}
          {book.description && (
            <div className="mb-8">
              <p className="text-gray-300 leading-relaxed text-base">
                {book.description}
              </p>
            </div>
          )}

          {/* Why we recommend - personal take */}
          {book.whyWeRecommend && (
            <div className="mb-8 pl-4 border-l-2 border-amber-600/50">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Why we recommend it</p>
              <p className="text-gray-400 leading-relaxed text-sm italic">
                {book.whyWeRecommend}
              </p>
            </div>
          )}

          {/* Related content */}
          {book.relatedContent && book.relatedContent.length > 0 && (
            <div className="mb-8 p-4 bg-zinc-800/50 rounded">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-3">Continue exploring</p>
              <div className="flex flex-wrap gap-2">
                {book.relatedContent.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="px-3 py-1.5 bg-zinc-700 text-gray-300 text-sm hover:bg-zinc-600 hover:text-white transition-colors rounded"
                    onClick={onClose}
                  >
                    {item.title} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA section */}
          <div className="pt-4 border-t border-zinc-800">
            <a
              href={getAmazonUrl(book.asin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors rounded"
            >
              <span className="text-lg">Get the book</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <p className="text-gray-600 text-xs mt-3">
              Amazon affiliate link — helps support our work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Book cover component with fallback
function BookCover({ book }: { book: Book }) {
  const coverUrl = getCoverUrl(book.isbn);

  if (!coverUrl) {
    return (
      <div className="w-16 h-24 bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <span className="text-zinc-600 text-xs text-center px-1">{book.title.slice(0, 20)}</span>
      </div>
    );
  }

  return (
    <div className="w-16 h-24 bg-zinc-800 flex-shrink-0 relative overflow-hidden">
      <Image
        src={coverUrl}
        alt={`Cover of ${book.title}`}
        fill
        sizes="64px"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

export default function BooksPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBook(null);
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Books Worth Reading
            </h1>
            <p className="text-xl text-gray-400 mb-4">
              The books that shaped us—and might shape you.
            </p>
            <p className="text-gray-500 mb-8">
              Some are modern classics you may have heard of. Others are hidden gems.
              All of them go beyond surface-level advice into the work that actually changes things.
            </p>

            {/* Intro for SEO and context */}
            <div className="mb-12 p-6 bg-zinc-900/30 border border-zinc-800">
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                These are the books we return to—on psychology, shadow work, meditation,
                trauma, relationships, and what it means to be human. Some are accessible
                entry points; others go deep. Start wherever calls to you.
              </p>
              <p className="text-gray-500 text-sm">
                Click any book to see why we recommend it.
              </p>
            </div>

            {/* Category Navigation */}
            <div className="flex flex-wrap gap-2 mb-12">
              {categories.map((category) => (
                <a
                  key={category.name}
                  href={`#${category.slug}`}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700 text-sm transition-colors"
                >
                  {category.name}
                </a>
              ))}
            </div>

            {/* Categories */}
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category.name} id={category.slug}>
                  <h2 className="font-serif text-2xl text-white mb-2">
                    {category.name}
                  </h2>
                  <p className="text-gray-500 mb-6">{category.description}</p>

                  <div className="space-y-4">
                    {category.books.map((book, index) => (
                      <button
                        key={index}
                        onClick={() => openModal(book)}
                        className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors group w-full text-left"
                      >
                        <BookCover book={book} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                            <h3 className="font-serif text-lg text-white group-hover:text-gray-200">
                              {book.title}
                            </h3>
                            <span className="text-gray-500 text-sm">{book.author}</span>
                          </div>
                          {book.note && (
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {book.note}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:flex items-center text-gray-600 group-hover:text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Closing note */}
            <div className="mt-16 p-8 bg-zinc-900/30 border border-zinc-800">
              <p className="text-gray-400 italic mb-4">
                &quot;A book is not merely a thing to be read; it is something to be
                lived with, lived through, lived by.&quot;
              </p>
              <p className="text-gray-600 text-sm">— Henry Miller</p>
            </div>

            {/* Related content CTA */}
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <Link
                href="/courses"
                className="p-6 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group"
              >
                <h3 className="text-white font-medium mb-2 group-hover:text-gray-200">Explore Our Courses</h3>
                <p className="text-gray-500 text-sm">100+ structured programs for shadow work, presence, and integration.</p>
              </Link>
              <Link
                href="/library"
                className="p-6 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group"
              >
                <h3 className="text-white font-medium mb-2 group-hover:text-gray-200">Read Our Articles</h3>
                <p className="text-gray-500 text-sm">200+ essays on psychology, spirituality, and the integrated life.</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Book detail modal */}
      <BookModal book={selectedBook} isOpen={modalOpen} onClose={closeModal} />
    </>
  );
}
