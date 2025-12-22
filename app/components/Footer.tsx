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
                <Link href="/courses" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/practices" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Practices
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Recommended Books
                </Link>
              </li>
              <li>
                <Link href="/archetypes" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Archetype Quiz
                </Link>
              </li>
              <li>
                <Link href="/stuck" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Where I'm Stuck
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-medium mb-4">About</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/transparency" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Transparency
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Membership
                </Link>
              </li>
              <li>
                <Link href="/connect" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
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
          <div className="flex items-center gap-6 text-gray-600 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
