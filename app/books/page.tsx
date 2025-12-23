import Navigation from '../components/Navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recommended Books | Integrated Human',
  description: 'Curated book recommendations for shadow work, psychology, philosophy, presence, and personal growth. Essential reads for the integration journey.',
  openGraph: {
    title: 'Recommended Books | Integrated Human',
    description: 'Curated book recommendations for shadow work, psychology, and personal growth.',
  },
};

interface Book {
  title: string;
  author: string;
  note?: string;
}

interface Category {
  name: string;
  description: string;
  books: Book[];
}

const categories: Category[] = [
  {
    name: 'Where to Start',
    description: 'Accessible entry points for the journey inward.',
    books: [
      {
        title: 'The Power of Now',
        author: 'Eckhart Tolle',
        note: 'Widely read introduction to presence. Can become its own trap if used to bypass psychology, but useful as a first taste.',
      },
      {
        title: 'The Untethered Soul',
        author: 'Michael Singer',
        note: 'Clear, practical pointing toward awareness. Good bridge between self-help and deeper work.',
      },
      {
        title: 'When Things Fall Apart',
        author: 'Pema Chödrön',
        note: 'Buddhist wisdom for crisis. For when everything is collapsing and you\'re tired of running.',
      },
      {
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        note: 'Jung\'s most accessible work on the unconscious, symbols, and dreams. Start here for shadow work without academic density.',
      },
      {
        title: 'Letters to a Young Poet',
        author: 'Rainer Maria Rilke',
        note: 'Timeless guidance on solitude, patience, and living the questions. Short but inexhaustible.',
      },
    ],
  },
  {
    name: 'The Psychological Work',
    description: 'Shadow, archetypes, and the integration of the psyche.',
    books: [
      {
        title: 'The Undiscovered Self',
        author: 'Carl Jung',
        note: 'Jung on individuation and the dangers of mass-mindedness. Short, potent.',
      },
      {
        title: 'Memories, Dreams, Reflections',
        author: 'Carl Jung',
        note: 'Jung\'s autobiography. His own confrontation with the unconscious.',
      },
      {
        title: 'The Soul\'s Code',
        author: 'James Hillman',
        note: 'Hillman\'s acorn theory — that your calling is already present. Challenging, beautiful.',
      },
      {
        title: 'The Hero with a Thousand Faces',
        author: 'Joseph Campbell',
        note: 'The mythological structure of transformation. The hero\'s journey as psychological map.',
      },
      {
        title: 'Myths to Live By',
        author: 'Joseph Campbell',
        note: 'Campbell on how myths still function in modern life. More accessible than Hero.',
      },
      {
        title: 'A Little Book on the Human Shadow',
        author: 'Robert Bly',
        note: 'Brief, powerful introduction to shadow work. How we throw parts of ourselves into "the bag."',
      },
      {
        title: 'Iron John',
        author: 'Robert Bly',
        note: 'Masculine initiation through fairy tale. Polarizing but important for men doing the work.',
      },
      {
        title: 'Women Who Run with the Wolves',
        author: 'Clarissa Pinkola Estés',
        note: 'The wild feminine through myth and story. Essential for women reclaiming instinctual nature.',
      },
      {
        title: 'King, Warrior, Magician, Lover',
        author: 'Robert Moore & Douglas Gillette',
        note: 'Archetypal masculine patterns. Useful framework — hold lightly, integrate what lands.',
      },
      {
        title: 'To Have or To Be?',
        author: 'Erich Fromm',
        note: 'Two modes of existence. Still relevant diagnosis of modern alienation.',
      },
      {
        title: 'Gravity and Grace',
        author: 'Simone Weil',
        note: 'Mystical philosophy. Dense, demanding, occasionally shattering.',
      },
      {
        title: 'Spiritual Bypassing',
        author: 'Robert Augustus Masters',
        note: 'How spirituality becomes avoidance. Essential reading for anyone on this path.',
      },
    ],
  },
  {
    name: 'The Body',
    description: 'Trauma, the nervous system, and embodied healing.',
    books: [
      {
        title: 'The Body Keeps the Score',
        author: 'Bessel van der Kolk',
        note: 'How trauma lives in the body. Why insight alone doesn\'t heal.',
      },
      {
        title: 'Waking the Tiger',
        author: 'Peter Levine',
        note: 'Somatic experiencing and trauma release. How animals discharge trauma — and how we don\'t.',
      },
      {
        title: 'In an Unspoken Voice',
        author: 'Peter Levine',
        note: 'Deeper dive into the body\'s wisdom and trauma resolution.',
      },
      {
        title: 'Attached',
        author: 'Amir Levine & Rachel Heller',
        note: 'Attachment theory made practical. Anxious, avoidant, secure — know your patterns.',
      },
    ],
  },
  {
    name: 'Direct Pointing',
    description: 'Truth without ornament. What you are, not what you\'re becoming.',
    books: [
      {
        title: 'Who Am I?',
        author: 'Ramana Maharshi',
        note: 'The core question. Short, direct, foundational for self-inquiry.',
      },
      {
        title: 'Be As You Are',
        author: 'Ramana Maharshi (edited by David Godman)',
        note: 'Essential teachings organized by topic. The best Ramana compilation.',
      },
      {
        title: 'Talks with Sri Ramana Maharshi',
        author: 'Ramana Maharshi',
        note: 'Direct dialogues. Raw, unfiltered.',
      },
      {
        title: 'I Am That',
        author: 'Nisargadatta Maharaj',
        note: 'Dialogues with a Bombay cigarette seller who woke up. Fierce, uncompromising.',
      },
      {
        title: 'Prior to Consciousness',
        author: 'Nisargadatta Maharaj',
        note: 'Later, more radical teachings. For after you\'ve sat with I Am That.',
      },
      {
        title: 'Nothing Ever Happened',
        author: 'Papaji (H.W.L. Poonja)',
        note: 'Stories and teachings from Ramana\'s most famous student.',
      },
      {
        title: 'I Am',
        author: 'Jean Klein',
        note: 'European Advaita. Clear, refined pointing.',
      },
      {
        title: 'The End of Your World',
        author: 'Adyashanti',
        note: 'What happens after awakening. The integration that follows glimpses.',
      },
      {
        title: 'True Meditation',
        author: 'Adyashanti',
        note: 'Meditation as allowing, not doing. Simple instructions.',
      },
      {
        title: 'Freedom from the Known',
        author: 'Jiddu Krishnamurti',
        note: 'Deconstruction of the spiritual search itself. No authority, no method, just seeing.',
      },
      {
        title: 'The First and Last Freedom',
        author: 'Jiddu Krishnamurti',
        note: 'Core themes — thought, fear, relationship. With Aldous Huxley\'s foreword.',
      },
    ],
  },
  {
    name: 'Tao & Zen',
    description: 'Effortless action, beginner\'s mind, and the way that cannot be named.',
    books: [
      {
        title: 'Tao Te Ching',
        author: 'Lao Tzu (Stephen Mitchell translation)',
        note: 'Flow, paradox, strength in softness. The water that wears down stone.',
      },
      {
        title: 'The Way of Chuang Tzu',
        author: 'Thomas Merton (translator)',
        note: 'Taoist stories and koans. Merton\'s beautiful rendering.',
      },
      {
        title: 'Zen Mind, Beginner\'s Mind',
        author: 'Shunryu Suzuki',
        note: 'The mind that is empty and ready for anything. Foundational Zen.',
      },
      {
        title: 'The Zen Teaching of Huang Po',
        author: 'Huang Po (John Blofeld translation)',
        note: 'Direct, fierce Chan Buddhism. No gradual path — only sudden seeing.',
      },
      {
        title: 'The Book',
        author: 'Alan Watts',
        note: 'On the taboo against knowing who you are. Watts at his most direct.',
      },
      {
        title: 'The Wisdom of Insecurity',
        author: 'Alan Watts',
        note: 'Why searching for security creates anxiety. Letting go of the ground.',
      },
      {
        title: 'The Way of Zen',
        author: 'Alan Watts',
        note: 'Clear introduction to Zen philosophy and practice. Strips away mystical nonsense.',
      },
      {
        title: 'Become What You Are',
        author: 'Alan Watts',
        note: 'Essays on identity, ego, and the nature of self.',
      },
      {
        title: 'Out of Your Mind',
        author: 'Alan Watts',
        note: 'Lectures on consciousness. The cosmic game.',
      },
    ],
  },
  {
    name: 'The Poetic Dimension',
    description: 'Beauty as a path to truth. The heart\'s knowing.',
    books: [
      {
        title: 'The Prophet',
        author: 'Khalil Gibran',
        note: 'Poetic wisdom on love, work, death, freedom. Timeless.',
      },
      {
        title: 'The Garden of the Prophet',
        author: 'Khalil Gibran',
        note: 'Sequel to The Prophet. The return and final teachings.',
      },
      {
        title: 'Sand and Foam',
        author: 'Khalil Gibran',
        note: 'Aphorisms and parables. Brief flashes.',
      },
      {
        title: 'Jesus, the Son of Man',
        author: 'Khalil Gibran',
        note: 'Jesus through 77 different eyes. Unusual, beautiful.',
      },
      {
        title: 'The Madman',
        author: 'Khalil Gibran',
        note: 'Parables of awakening and holy madness.',
      },
      {
        title: 'The Essential Rumi',
        author: 'Rumi (Coleman Barks translation)',
        note: 'The beloved mystic. Barks\' translations are beautiful, though scholars note he removes Islamic context.',
      },
      {
        title: 'The Masnavi',
        author: 'Rumi',
        note: 'The longer work. Stories within stories. Epic spiritual poetry.',
      },
      {
        title: 'The Gift',
        author: 'Hafiz (Daniel Ladinsky translation)',
        note: 'Ecstatic, playful, devotional. Like drinking wine with God.',
      },
      {
        title: 'I Heard God Laughing',
        author: 'Hafiz (Daniel Ladinsky translation)',
        note: 'More Hafiz. Joy as spiritual practice.',
      },
      {
        title: 'Duino Elegies',
        author: 'Rainer Maria Rilke',
        note: 'Angels, transformation, the difficulty of being human. Demanding but essential.',
      },
      {
        title: 'Sonnets to Orpheus',
        author: 'Rainer Maria Rilke',
        note: 'Song, death, praise. Written in a single burst of inspiration.',
      },
      {
        title: 'Gitanjali',
        author: 'Rabindranath Tagore',
        note: 'Song offerings. Devotional poetry that won the Nobel Prize.',
      },
      {
        title: 'The Marriage of Heaven and Hell',
        author: 'William Blake',
        note: 'Proverbs of Hell, the energy of desire. "The road of excess leads to the palace of wisdom."',
      },
    ],
  },
  {
    name: 'Edge Exploration',
    description: 'Psychedelics, consciousness, and the territory beyond ordinary mind.',
    books: [
      {
        title: 'The Doors of Perception',
        author: 'Aldous Huxley',
        note: 'Huxley\'s mescaline experience. The book that named The Doors.',
      },
      {
        title: 'Heaven and Hell',
        author: 'Aldous Huxley',
        note: 'Sequel exploring visionary experience and its relationship to art and religion.',
      },
      {
        title: 'The Perennial Philosophy',
        author: 'Aldous Huxley',
        note: 'The common core of mystical traditions. Anthology with commentary.',
      },
      {
        title: 'Food of the Gods',
        author: 'Terence McKenna',
        note: 'Plants, consciousness, and human evolution. McKenna\'s stoned ape theory and beyond.',
      },
      {
        title: 'True Hallucinations',
        author: 'Terence McKenna',
        note: 'The Amazon experiment. Wild, strange, unforgettable.',
      },
      {
        title: 'The Archaic Revival',
        author: 'Terence McKenna',
        note: 'Essays and interviews. McKenna\'s vision of a return to the archaic.',
      },
      {
        title: 'The Holotropic Mind',
        author: 'Stanislav Grof',
        note: 'Maps of consciousness from decades of psychedelic research. More clinical than McKenna.',
      },
      {
        title: 'How to Change Your Mind',
        author: 'Michael Pollan',
        note: 'Accessible overview of psychedelic renaissance. Good entry point for the skeptical.',
      },
    ],
  },
  {
    name: 'Radical Deconstruction',
    description: 'The anti-spiritual. Burning down the temple.',
    books: [
      {
        title: 'Spiritual Enlightenment: The Damnedest Thing',
        author: 'Jed McKenna',
        note: 'Brutal, funny, relentless. Destroys every comfortable spiritual belief. Read when ready.',
      },
      {
        title: 'Spiritually Incorrect Enlightenment',
        author: 'Jed McKenna',
        note: 'The sequel. More destruction.',
      },
      {
        title: 'Theory of Everything',
        author: 'Jed McKenna',
        note: 'McKenna\'s cosmology. Goes further out.',
      },
      {
        title: 'The Mystique of Enlightenment',
        author: 'U.G. Krishnamurti',
        note: 'The anti-guru. Rejected all spiritual teaching including his own. Disorienting, important.',
      },
    ],
  },
];

export default function BooksPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Recommended Books
            </h1>
            <p className="text-xl text-gray-400 mb-4">
              Not self-help. Not quick fixes. Just depth.
            </p>
            <p className="text-gray-500 mb-12">
              These books have shaped the work. Some are accessible entry points,
              others demand everything. Take what calls to you.
            </p>

            {/* Category Navigation */}
            <div className="flex flex-wrap gap-2 mb-12">
              {categories.map((category) => (
                <a
                  key={category.name}
                  href={`#${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700 text-sm transition-colors"
                >
                  {category.name}
                </a>
              ))}
            </div>

            {/* Categories */}
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category.name} id={category.name.toLowerCase().replace(/\s+/g, '-')}>
                  <h2 className="font-serif text-2xl text-white mb-2">
                    {category.name}
                  </h2>
                  <p className="text-gray-500 mb-6">{category.description}</p>

                  <div className="space-y-4">
                    {category.books.map((book, index) => (
                      <div
                        key={index}
                        className="p-6 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                          <h3 className="font-serif text-lg text-white">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Closing note */}
            <div className="mt-16 p-8 bg-zinc-900/30 border border-zinc-800">
              <p className="text-gray-400 italic mb-4">
                "A book is not merely a thing to be read; it is something to be
                lived with, lived through, lived by."
              </p>
              <p className="text-gray-600 text-sm">— Henry Miller</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
