import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-zinc-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-xl font-light text-white mb-3">
              Integrated Human
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Live stronger, feel deeper, become whole.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm uppercase tracking-wide text-gray-500 mb-3">Navigate</h4>
            <div className="flex flex-col gap-2">
              <Link href="/mind" className="text-gray-400 hover:text-white text-sm transition-colors">
                Mind
              </Link>
              <Link href="/body" className="text-gray-400 hover:text-white text-sm transition-colors">
                Body
              </Link>
              <Link href="/soul" className="text-gray-400 hover:text-white text-sm transition-colors">
                Soul
              </Link>
              <Link href="/relationships" className="text-gray-400 hover:text-white text-sm transition-colors">
                Relationships
              </Link>
              <Link href="/library" className="text-gray-400 hover:text-white text-sm transition-colors">
                Library
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm uppercase tracking-wide text-gray-500 mb-3">Connect</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Community and social links coming soon.
            </p>
            <p className="text-gray-400 text-sm">
              For now, explore the content and let it settle.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Integrated Human. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Built with intention. No shortcuts.
          </p>
        </div>
      </div>
    </footer>
  );
}
