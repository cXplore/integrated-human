'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="py-6 px-6 bg-black border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-light text-white hover:text-gray-400 transition-colors">
          Integrated Human
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8">
          <Link href="/mind" className="text-gray-400 hover:text-white transition-colors">
            Mind
          </Link>
          <Link href="/body" className="text-gray-400 hover:text-white transition-colors">
            Body
          </Link>
          <Link href="/soul" className="text-gray-400 hover:text-white transition-colors">
            Soul
          </Link>
          <Link href="/relationships" className="text-gray-400 hover:text-white transition-colors">
            Relationships
          </Link>
          <Link href="/library" className="text-gray-400 hover:text-white transition-colors">
            Library
          </Link>
          <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
            About
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-800">
          <div className="flex flex-col gap-4">
            <Link
              href="/mind"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Mind
            </Link>
            <Link
              href="/body"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Body
            </Link>
            <Link
              href="/soul"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Soul
            </Link>
            <Link
              href="/relationships"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Relationships
            </Link>
            <Link
              href="/library"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Library
            </Link>
            <Link
              href="/about"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
