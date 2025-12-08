import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-serif text-xl text-white">
              Integrated Human
            </Link>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              Live stronger, feel deeper, become whole.
            </p>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-white font-medium mb-4">Learn</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/mind" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Mind
                </Link>
              </li>
              <li>
                <Link href="/body" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Body
                </Link>
              </li>
              <li>
                <Link href="/soul" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Soul
                </Link>
              </li>
              <li>
                <Link href="/relationships" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Relationships
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-medium mb-4">Explore</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/library" className="text-gray-400 hover:text-white transition-colors text-sm">
                  All Articles
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Books
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-medium mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/connect" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="text-gray-400 hover:text-white transition-colors text-sm">
                  RSS Feed
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Integrated Human. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm italic">
            Small steps. Real talk. No pretending.
          </p>
        </div>
      </div>
    </footer>
  );
}
