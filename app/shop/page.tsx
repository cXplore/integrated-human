'use client';

import Navigation from '../components/Navigation';
import { useState } from 'react';

interface Book {
  title: string;
  author: string;
  description: string;
  category: string;
  asin?: string;
  freeLink?: string;
}

// Store ASIN (Amazon Standard Identification Number) for proper affiliate links
// The affiliate tag will be added at render time
const AFFILIATE_TAG = 'integratedhum-20'; // Replace with your actual Amazon Associates tag

const books: Book[] = [
  {
    title: "Man's Search for Meaning",
    author: 'Viktor Frankl',
    description: "A psychiatrist's experience in Nazi concentration camps and his discovery that meaning can be found even in the darkest circumstances.",
    category: 'Soul',
    asin: '0807014273',
    freeLink: 'https://archive.org/details/manssearchformea00fran',
  },
  {
    title: 'The Body Keeps the Score',
    author: 'Bessel van der Kolk',
    description: 'How trauma reshapes both body and brain, and what it takes to heal. Essential reading for understanding the nervous system.',
    category: 'Mind',
    asin: '0143127748',
  },
  {
    title: 'Iron John',
    author: 'Robert Bly',
    description: 'A modern classic on masculine initiation, archetypes, and the journey from boy to man.',
    category: 'Soul',
    asin: '0306824264',
  },
  {
    title: 'Attached',
    author: 'Amir Levine & Rachel Heller',
    description: 'The science of attachment styles and how they affect your relationships. Practical and accessible.',
    category: 'Relationships',
    asin: '1585429139',
  },
  {
    title: 'The Way of the Superior Man',
    author: 'David Deida',
    description: 'Masculine-feminine polarity, purpose, and depth in relationships. Direct and sometimes confronting.',
    category: 'Relationships',
    asin: '1622038320',
  },
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    description: 'Personal writings of a Roman emperor practicing Stoic philosophy. Timeless wisdom on presence and acceptance.',
    category: 'Mind',
    asin: '0812968255',
    freeLink: 'https://www.gutenberg.org/ebooks/2680',
  },
  {
    title: 'The Doors of Perception',
    author: 'Aldous Huxley',
    description: "Huxley's account of his mescaline experience. A thoughtful exploration of consciousness and perception.",
    category: 'Soul',
    asin: '0061729078',
    freeLink: 'https://archive.org/details/doorsofperceptio0000huxl',
  },
  {
    title: 'Starting Strength',
    author: 'Mark Rippetoe',
    description: 'The definitive guide to barbell training. Technical, thorough, and effective.',
    category: 'Body',
    asin: '0982522738',
  },
  {
    title: 'Light on Yoga',
    author: 'B.K.S. Iyengar',
    description: 'The bible of yoga practice. Comprehensive guide to asanas with detailed instructions and photographs.',
    category: 'Body',
    asin: '0805210318',
  },
  {
    title: 'The Tao Te Ching',
    author: 'Lao Tzu',
    description: 'Ancient Chinese wisdom on living in harmony with the way of things. Short, profound, endlessly rereadable.',
    category: 'Soul',
    asin: '0060812451',
    freeLink: 'https://www.gutenberg.org/ebooks/216',
  },
  {
    title: 'Breath',
    author: 'James Nestor',
    description: 'The lost art and science of breathing. How something so simple can transform your health and performance.',
    category: 'Body',
    asin: '0735213615',
  },
  {
    title: 'King, Warrior, Magician, Lover',
    author: 'Robert Moore & Douglas Gillette',
    description: 'The four masculine archetypes and how to access their mature forms. Essential for understanding masculine psychology.',
    category: 'Soul',
    asin: '0062506064',
  },
];

const categories = ['All', 'Mind', 'Body', 'Soul', 'Relationships'];

function getAffiliateLink(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBooks = selectedCategory === 'All'
    ? books
    : books.filter(book => book.category === selectedCategory);

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
                We&apos;re working on curated products — journals, training gear, and more.
                Join the community to be notified when they launch.
              </p>
            </div>

            {/* Books Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="font-serif text-3xl font-light text-white">
                Recommended Reading
              </h2>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-white text-zinc-900'
                        : 'bg-zinc-900 border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredBooks.map((book) => (
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
                    {book.asin && (
                      <a
                        href={getAffiliateLink(book.asin)}
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

            {filteredBooks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No books found in this category.
              </div>
            )}

            <div className="mt-12 p-8 bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-gray-500 text-sm">
                Some links are affiliate links. We only recommend books we&apos;ve actually read and value.
                <br />
                <span className="text-gray-600 mt-2 block">
                  Purchasing through these links helps support this project at no extra cost to you.
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
