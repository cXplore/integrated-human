import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="py-6 px-6 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-light text-stone-900 hover:text-stone-600 transition-colors">
          Integrated Human
        </Link>
        <div className="flex gap-8">
          <Link href="/mind" className="text-stone-700 hover:text-stone-900 transition-colors">
            Mind
          </Link>
          <Link href="/body" className="text-stone-700 hover:text-stone-900 transition-colors">
            Body
          </Link>
          <Link href="/soul" className="text-stone-700 hover:text-stone-900 transition-colors">
            Soul
          </Link>
          <Link href="/relationships" className="text-stone-700 hover:text-stone-900 transition-colors">
            Relationships
          </Link>
          <Link href="/library" className="text-stone-700 hover:text-stone-900 transition-colors">
            Library
          </Link>
          <Link href="/about" className="text-stone-700 hover:text-stone-900 transition-colors">
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
