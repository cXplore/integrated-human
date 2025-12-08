import Navigation from '../components/Navigation';
import Link from 'next/link';

interface Book {
  title: string;
  author: string;
  description: string;
  category: string;
  affiliateLink?: string;
  freeLink?: string;
}

const books: Book[] = [
  {
    title: 'Man\'s Search for Meaning',
    author: 'Viktor Frankl',
    description: 'A psychiatrist\'s experience in Nazi concentration camps and his discovery that meaning can be found even in the darkest circumstances.',
    category: 'Soul',
    affiliateLink: 'https://www.amazon.com/Mans-Search-Meaning-Viktor-Frankl/dp/0807014273',
    freeLink: 'https://archive.org/details/manssearchformea00fran',
  },
  {
    title: 'The Body Keeps the Score',
    author: 'Bessel van der Kolk',
    description: 'How trauma reshapes both body and brain, and what it takes to heal. Essential reading for understanding the nervous system.',
    category: 'Mind',
    affiliateLink: 'https://www.amazon.com/Body-Keeps-Score-Healing-Trauma/dp/0143127748',
  },
  {
    title: 'Iron John',
    author: 'Robert Bly',
    description: 'A modern classic on masculine initiation, archetypes, and the journey from boy to man.',
    category: 'Soul',
    affiliateLink: 'https://www.amazon.com/Iron-John-Book-About-Men/dp/0306824264',
  },
  {
    title: 'Attached',
    author: 'Amir Levine & Rachel Heller',
    description: 'The science of attachment styles and how they affect your relationships. Practical and accessible.',
    category: 'Relationships',
    affiliateLink: 'https://www.amazon.com/Attached-Science-Adult-Attachment-YouFind/dp/1585429139',
  },
  {
    title: 'The Way of the Superior Man',
    author: 'David Deida',
    description: 'Masculine-feminine polarity, purpose, and depth in relationships. Direct and sometimes confronting.',
    category: 'Relationships',
    affiliateLink: 'https://www.amazon.com/Way-Superior-Man-Spiritual-Challenges/dp/1622038320',
  },
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    description: 'Personal writings of a Roman emperor practicing Stoic philosophy. Timeless wisdom on presence and acceptance.',
    category: 'Mind',
    freeLink: 'https://www.gutenberg.org/ebooks/2680',
    affiliateLink: 'https://www.amazon.com/Meditations-New-Translation-Marcus-Aurelius/dp/0812968255',
  },
  {
    title: 'The Doors of Perception',
    author: 'Aldous Huxley',
    description: 'Huxley\'s account of his mescaline experience. A thoughtful exploration of consciousness and perception.',
    category: 'Soul',
    freeLink: 'https://archive.org/details/doorsofperceptio0000huxl',
    affiliateLink: 'https://www.amazon.com/Doors-Perception-Heaven-Hell/dp/0061729078',
  },
  {
    title: 'Starting Strength',
    author: 'Mark Rippetoe',
    description: 'The definitive guide to barbell training. Technical, thorough, and effective.',
    category: 'Body',
    affiliateLink: 'https://www.amazon.com/Starting-Strength-Basic-Barbell-Training/dp/0982522738',
  },
  {
    title: 'Light on Yoga',
    author: 'B.K.S. Iyengar',
    description: 'The bible of yoga practice. Comprehensive guide to asanas with detailed instructions and photographs.',
    category: 'Body',
    affiliateLink: 'https://www.amazon.com/Light-Yoga-Definitive-Guide-Practice/dp/0805210318',
  },
  {
    title: 'The Tao Te Ching',
    author: 'Lao Tzu',
    description: 'Ancient Chinese wisdom on living in harmony with the way of things. Short, profound, endlessly rereadable.',
    category: 'Soul',
    freeLink: 'https://www.gutenberg.org/ebooks/216',
    affiliateLink: 'https://www.amazon.com/Tao-Te-Ching-Laozi/dp/0060812451',
  },
];

const categories = ['All', 'Mind', 'Body', 'Soul', 'Relationships'];

export default function ShopPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-white mb-6">
              Shop
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
              Books that shaped this project. Some are available free online — we link to both when possible.
            </p>

            {/* Coming Soon: Products */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 mb-16">
              <h2 className="font-serif text-2xl font-light text-white mb-4">
                Products Coming Soon
              </h2>
              <p className="text-gray-400 leading-relaxed">
                We're working on curated products — journals, training gear, and more.
                Join the community to be notified when they launch.
              </p>
            </div>

            {/* Books Section */}
            <h2 className="font-serif text-3xl font-light text-white mb-8">
              Recommended Reading
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {books.map((book) => (
                <div
                  key={book.title}
                  className="bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
                >
                  <span className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">
                    {book.category}
                  </span>
                  <h3 className="font-serif text-xl text-white mb-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">by {book.author}</p>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {book.description}
                  </p>
                  <div className="flex gap-4">
                    {book.freeLink && (
                      <a
                        href={book.freeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-white transition-colors underline"
                      >
                        Read Free
                      </a>
                    )}
                    {book.affiliateLink && (
                      <a
                        href={book.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-white transition-colors underline"
                      >
                        Buy on Amazon
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-gray-500 text-sm">
                Some links are affiliate links. We only recommend books we've actually read and value.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
