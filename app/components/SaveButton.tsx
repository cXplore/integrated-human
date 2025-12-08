'use client';

import { useReadingList } from './ReadingListContext';

interface SaveButtonProps {
  slug: string;
  variant?: 'icon' | 'full';
}

export default function SaveButton({ slug, variant = 'icon' }: SaveButtonProps) {
  const { isInList, addToList, removeFromList } = useReadingList();
  const saved = isInList(slug);

  const handleClick = () => {
    if (saved) {
      removeFromList(slug);
    } else {
      addToList(slug);
    }
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 border transition-colors ${
          saved
            ? 'border-white text-white bg-zinc-800'
            : 'border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500'
        }`}
        aria-label={saved ? 'Remove from reading list' : 'Save to reading list'}
      >
        <svg
          className="w-5 h-5"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {saved ? 'Saved' : 'Save for later'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 transition-colors ${
        saved ? 'text-white' : 'text-gray-500 hover:text-white'
      }`}
      aria-label={saved ? 'Remove from reading list' : 'Save to reading list'}
      title={saved ? 'Remove from reading list' : 'Save to reading list'}
    >
      <svg
        className="w-5 h-5"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
