import Navigation from '../components/Navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recommended Books | Integrated Human',
  description: 'Curated book recommendations for shadow work, psychology, philosophy, presence, and personal growth. Essential reads for the integration journey.',
  openGraph: {
    title: 'Recommended Books | Integrated Human',
    description: 'Curated book recommendations for shadow work, psychology, and personal growth.',
  },
};

const AMAZON_AFFILIATE_TAG = 'integratedhum-20';

interface Book {
  title: string;
  author: string;
  note?: string;
  isbn?: string; // For Open Library cover lookup
  asin: string; // Amazon ASIN for direct product link
}

interface Category {
  name: string;
  description: string;
  books: Book[];
}

// Direct link to Amazon product page
function getAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;
}

// Open Library cover URL
function getCoverUrl(isbn?: string): string | null {
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}

const categories: Category[] = [
  {
    name: 'Where to Start',
    description: 'Accessible entry points for the journey inward.',
    books: [
      {
        title: 'The Power of Now',
        author: 'Eckhart Tolle',
        isbn: '9781577314806',
        asin: '1577314808',
        note: 'Widely read introduction to presence. Can become its own trap if used to bypass psychology, but useful as a first taste.',
      },
      {
        title: 'The Untethered Soul',
        author: 'Michael Singer',
        isbn: '9781572245372',
        asin: '1572245379',
        note: 'Clear, practical pointing toward awareness. Good bridge between self-help and deeper work.',
      },
      {
        title: 'When Things Fall Apart',
        author: 'Pema Chödrön',
        isbn: '9781570629693',
        asin: '1570629692',
        note: 'Buddhist wisdom for crisis. For when everything is collapsing and you\'re tired of running.',
      },
      {
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        isbn: '9780440351832',
        asin: '0440351839',
        note: 'Jung\'s most accessible work on the unconscious, symbols, and dreams. Start here for shadow work without academic density.',
      },
      {
        title: 'Letters to a Young Poet',
        author: 'Rainer Maria Rilke',
        isbn: '9780393310399',
        asin: '0393310396',
        note: 'Timeless guidance on solitude, patience, and living the questions. Short but inexhaustible.',
      },
      {
        title: 'Flow',
        author: 'Mihaly Csikszentmihalyi',
        isbn: '9780061339202',
        asin: '0061339202',
        note: 'The psychology of optimal experience. When skill meets challenge and self-consciousness dissolves.',
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
        isbn: '9780451217325',
        asin: '0451217322',
        note: 'Jung on individuation and the dangers of mass-mindedness. Short, potent.',
      },
      {
        title: 'Memories, Dreams, Reflections',
        author: 'Carl Jung',
        isbn: '9780679723950',
        asin: '0679723951',
        note: 'Jung\'s autobiography. His own confrontation with the unconscious.',
      },
      {
        title: 'The Soul\'s Code',
        author: 'James Hillman',
        isbn: '9780446673716',
        asin: '0446673714',
        note: 'Hillman\'s acorn theory — that your calling is already present. Challenging, beautiful.',
      },
      {
        title: 'The Hero with a Thousand Faces',
        author: 'Joseph Campbell',
        isbn: '9781577315933',
        asin: '1577315936',
        note: 'The mythological structure of transformation. The hero\'s journey as psychological map.',
      },
      {
        title: 'Myths to Live By',
        author: 'Joseph Campbell',
        isbn: '9780140194616',
        asin: '0140194614',
        note: 'Campbell on how myths still function in modern life. More accessible than Hero.',
      },
      {
        title: 'A Little Book on the Human Shadow',
        author: 'Robert Bly',
        isbn: '9780062548474',
        asin: '0062548476',
        note: 'Brief, powerful introduction to shadow work. How we throw parts of ourselves into "the bag."',
      },
      {
        title: 'Iron John',
        author: 'Robert Bly',
        isbn: '9780306824265',
        asin: '0306824264',
        note: 'Masculine initiation through fairy tale. Polarizing but important for men doing the work.',
      },
      {
        title: 'Women Who Run with the Wolves',
        author: 'Clarissa Pinkola Estés',
        isbn: '9780345409874',
        asin: '034540987X',
        note: 'The wild feminine through myth and story. Essential for women reclaiming instinctual nature.',
      },
      {
        title: 'King, Warrior, Magician, Lover',
        author: 'Robert Moore & Douglas Gillette',
        isbn: '9780062506061',
        asin: '0062506064',
        note: 'Archetypal masculine patterns. Useful framework — hold lightly, integrate what lands.',
      },
      {
        title: 'To Have or To Be?',
        author: 'Erich Fromm',
        isbn: '9780826409126',
        asin: '1472505298',
        note: 'Two modes of existence. Still relevant diagnosis of modern alienation.',
      },
      {
        title: 'Gravity and Grace',
        author: 'Simone Weil',
        isbn: '9780803298019',
        asin: '0415290015',
        note: 'Mystical philosophy. Dense, demanding, occasionally shattering.',
      },
      {
        title: 'Toward a Psychology of Awakening',
        author: 'John Welwood',
        isbn: '9781570628238',
        asin: '1570628238',
        note: 'Where psychology meets spirituality. Welwood coined "spiritual bypassing" — this book shows the integration.',
      },
      {
        title: 'Spiritual Bypassing',
        author: 'Robert Augustus Masters',
        isbn: '9781556439056',
        asin: '1556439059',
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
        isbn: '9780143127741',
        asin: '0143127748',
        note: 'How trauma lives in the body. Why insight alone doesn\'t heal.',
      },
      {
        title: 'Waking the Tiger',
        author: 'Peter Levine',
        isbn: '9781556432330',
        asin: '155643233X',
        note: 'Somatic experiencing and trauma release. How animals discharge trauma — and how we don\'t.',
      },
      {
        title: 'In an Unspoken Voice',
        author: 'Peter Levine',
        isbn: '9781556439438',
        asin: '1556439431',
        note: 'Deeper dive into the body\'s wisdom and trauma resolution.',
      },
      {
        title: 'Attached',
        author: 'Amir Levine & Rachel Heller',
        isbn: '9781585429134',
        asin: '1585429139',
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
        isbn: '9788188018017',
        asin: '8188018015',
        note: 'The core question. Short, direct, foundational for self-inquiry.',
      },
      {
        title: 'Be As You Are',
        author: 'Ramana Maharshi (edited by David Godman)',
        isbn: '9780140190625',
        asin: '0140190627',
        note: 'Essential teachings organized by topic. The best Ramana compilation.',
      },
      {
        title: 'Talks with Sri Ramana Maharshi',
        author: 'Ramana Maharshi',
        isbn: '9788188018079',
        asin: '8188018074',
        note: 'Direct dialogues. Raw, unfiltered.',
      },
      {
        title: 'I Am That',
        author: 'Nisargadatta Maharaj',
        isbn: '9780893860226',
        asin: '0893860220',
        note: 'Dialogues with a Bombay cigarette seller who woke up. Fierce, uncompromising.',
      },
      {
        title: 'Prior to Consciousness',
        author: 'Nisargadatta Maharaj',
        isbn: '9780893860240',
        asin: '0893860247',
        note: 'Later, more radical teachings. For after you\'ve sat with I Am That.',
      },
      {
        title: 'Nothing Ever Happened',
        author: 'Papaji (H.W.L. Poonja)',
        isbn: '9780971078611',
        asin: '0971078610',
        note: 'Stories and teachings from Ramana\'s most famous student.',
      },
      {
        title: 'I Am',
        author: 'Jean Klein',
        isbn: '9781908664167',
        asin: '1908664169',
        note: 'European Advaita. Clear, refined pointing.',
      },
      {
        title: 'The End of Your World',
        author: 'Adyashanti',
        isbn: '9781591797791',
        asin: '1591797799',
        note: 'What happens after awakening. The integration that follows glimpses.',
      },
      {
        title: 'True Meditation',
        author: 'Adyashanti',
        isbn: '9781591794097',
        asin: '1591794099',
        note: 'Meditation as allowing, not doing. Simple instructions.',
      },
      {
        title: 'Freedom from the Known',
        author: 'Jiddu Krishnamurti',
        isbn: '9780060648084',
        asin: '0060648082',
        note: 'Deconstruction of the spiritual search itself. No authority, no method, just seeing.',
      },
      {
        title: 'The First and Last Freedom',
        author: 'Jiddu Krishnamurti',
        isbn: '9780060648312',
        asin: '0060648317',
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
        isbn: '9780060812454',
        asin: '0060812451',
        note: 'Flow, paradox, strength in softness. The water that wears down stone.',
      },
      {
        title: 'The Way of Chuang Tzu',
        author: 'Thomas Merton (translator)',
        isbn: '9780811218511',
        asin: '0811201031',
        note: 'Taoist stories and koans. Merton\'s beautiful rendering.',
      },
      {
        title: 'Zen Mind, Beginner\'s Mind',
        author: 'Shunryu Suzuki',
        isbn: '9781590308493',
        asin: '1590308492',
        note: 'The mind that is empty and ready for anything. Foundational Zen.',
      },
      {
        title: 'The Zen Teaching of Huang Po',
        author: 'Huang Po (John Blofeld translation)',
        isbn: '9780802150929',
        asin: '0802150926',
        note: 'Direct, fierce Chan Buddhism. No gradual path — only sudden seeing.',
      },
      {
        title: 'The Book',
        author: 'Alan Watts',
        isbn: '9780679723011',
        asin: '0679723013',
        note: 'On the taboo against knowing who you are. Watts at his most direct.',
      },
      {
        title: 'The Wisdom of Insecurity',
        author: 'Alan Watts',
        isbn: '9780307741202',
        asin: '0307741206',
        note: 'Why searching for security creates anxiety. Letting go of the ground.',
      },
      {
        title: 'The Way of Zen',
        author: 'Alan Watts',
        isbn: '9780375705106',
        asin: '0375705104',
        note: 'Clear introduction to Zen philosophy and practice. Strips away mystical nonsense.',
      },
      {
        title: 'Psychotherapy East and West',
        author: 'Alan Watts',
        isbn: '9781608684564',
        asin: '1608684563',
        note: 'Where psychology meets liberation. Therapy as awakening, not adjustment.',
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
        isbn: '9780394404288',
        asin: '0394404289',
        note: 'Poetic wisdom on love, work, death, freedom. Timeless.',
      },
      {
        title: 'Sand and Foam',
        author: 'Khalil Gibran',
        isbn: '9780394430690',
        asin: '0394430697',
        note: 'Aphorisms and parables. Brief flashes of insight.',
      },
      {
        title: 'The Essential Rumi',
        author: 'Rumi (Coleman Barks translation)',
        isbn: '9780062509598',
        asin: '0062509594',
        note: 'The beloved mystic. Barks\' translations are beautiful, though scholars note he removes Islamic context.',
      },
      {
        title: 'The Gift',
        author: 'Hafiz (Daniel Ladinsky translation)',
        isbn: '9780140195811',
        asin: '0140195815',
        note: 'Ecstatic, playful, devotional. Like drinking wine with God.',
      },
      {
        title: 'Duino Elegies',
        author: 'Rainer Maria Rilke',
        isbn: '9780393328844',
        asin: '0393328848',
        note: 'Angels, transformation, the difficulty of being human. Demanding but essential.',
      },
      {
        title: 'Sonnets to Orpheus',
        author: 'Rainer Maria Rilke',
        isbn: '9780393329100',
        asin: '0393329100',
        note: 'Song, death, praise. Written in a single burst of inspiration.',
      },
      {
        title: 'Gitanjali',
        author: 'Rabindranath Tagore',
        isbn: '9780684839349',
        asin: '1420954059',
        note: 'Song offerings. Devotional poetry that won the Nobel Prize.',
      },
      {
        title: 'The Marriage of Heaven and Hell',
        author: 'William Blake',
        isbn: '9780486281223',
        asin: '0486281221',
        note: 'Proverbs of Hell, the energy of desire. "The road of excess leads to the palace of wisdom."',
      },
    ],
  },
  {
    name: 'Edge Exploration',
    description: 'Psychedelics, consciousness, and the territory beyond ordinary mind.',
    books: [
      {
        title: 'The Doors of Perception / Heaven and Hell',
        author: 'Aldous Huxley',
        isbn: '9780060595180',
        asin: '0061729078',
        note: 'Huxley\'s mescaline experience and its implications. The book that named The Doors.',
      },
      {
        title: 'Island',
        author: 'Aldous Huxley',
        isbn: '9780061561795',
        asin: '0061561797',
        note: 'Huxley\'s utopian vision. A society built on presence, psychedelics, and integration.',
      },
      {
        title: 'Food of the Gods',
        author: 'Terence McKenna',
        isbn: '9780553371307',
        asin: '0553371304',
        note: 'Plants, consciousness, and human evolution. McKenna\'s stoned ape theory and beyond.',
      },
      {
        title: 'True Hallucinations',
        author: 'Terence McKenna',
        isbn: '9780062506528',
        asin: '0062506528',
        note: 'The Amazon experiment. Wild, strange, unforgettable.',
      },
      {
        title: 'The Archaic Revival',
        author: 'Terence McKenna',
        isbn: '9780062506139',
        asin: '0062506137',
        note: 'Essays and interviews. McKenna\'s vision of a return to the archaic.',
      },
      {
        title: 'The Holotropic Mind',
        author: 'Stanislav Grof',
        isbn: '9780062506597',
        asin: '0062506595',
        note: 'Maps of consciousness from decades of psychedelic research. More clinical than McKenna.',
      },
      {
        title: 'How to Change Your Mind',
        author: 'Michael Pollan',
        isbn: '9780735224155',
        asin: '0735224153',
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
        isbn: '9780980184846',
        asin: '0980184843',
        note: 'Brutal, funny, relentless. Destroys every comfortable spiritual belief. Read when ready.',
      },
      {
        title: 'Spiritually Incorrect Enlightenment',
        author: 'Jed McKenna',
        isbn: '9780980184808',
        asin: '0980184800',
        note: 'The sequel. More destruction.',
      },
      {
        title: 'Jed McKenna\'s Theory of Everything',
        author: 'Jed McKenna',
        isbn: '9780980184822',
        asin: '0980184827',
        note: 'McKenna\'s cosmology. Goes further out.',
      },
      {
        title: 'The Mystique of Enlightenment',
        author: 'U.G. Krishnamurti',
        isbn: '9780971078628',
        asin: '0971078629',
        note: 'The anti-guru. Rejected all spiritual teaching including his own. Disorienting, important.',
      },
    ],
  },
];

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
                      <a
                        key={index}
                        href={getAmazonUrl(book.asin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors group"
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Affiliate disclosure */}
            <div className="mt-12 p-4 bg-zinc-900/30 border border-zinc-800 text-center">
              <p className="text-gray-600 text-xs">
                Links go to Amazon. As an Amazon Associate, we earn from qualifying purchases.
              </p>
            </div>

            {/* Closing note */}
            <div className="mt-8 p-8 bg-zinc-900/30 border border-zinc-800">
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
