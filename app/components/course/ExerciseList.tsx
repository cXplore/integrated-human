'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ExerciseListItem {
  id: string;
  text: string;
}

interface ExerciseListProps {
  id: string;
  title: string;
  items: ExerciseListItem[];
  courseSlug: string;
  moduleSlug: string;
}

export default function ExerciseList({
  id,
  title,
  items,
  courseSlug,
  moduleSlug,
}: ExerciseListProps) {
  const { data: session } = useSession();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const storageKey = `list_${courseSlug}_${moduleSlug}_${id}`;

  // Load initial state
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/exercises?courseSlug=${courseSlug}&moduleSlug=${moduleSlug}&exerciseId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.value) {
            try {
              setChecked(JSON.parse(data.value));
            } catch {
              // Invalid JSON, ignore
            }
          }
        })
        .catch(() => {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try {
              setChecked(JSON.parse(saved));
            } catch {
              // Invalid JSON, ignore
            }
          }
        });
    } else {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setChecked(JSON.parse(saved));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, [session, courseSlug, moduleSlug, id, storageKey]);

  const handleToggle = async (itemId: string) => {
    const newChecked = { ...checked, [itemId]: !checked[itemId] };
    setChecked(newChecked);
    setSaving(true);

    const value = JSON.stringify(newChecked);
    localStorage.setItem(storageKey, value);

    if (session?.user?.id) {
      try {
        await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseSlug,
            moduleSlug,
            exerciseId: id,
            type: 'list',
            value,
          }),
        });
      } catch (error) {
        console.error('Failed to save list:', error);
      }
    }

    setSaving(false);
  };

  const completedCount = Object.values(checked).filter(Boolean).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="my-8 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {title}
          </div>
          <span className="text-xs text-gray-500">
            {completedCount}/{items.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-zinc-800">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors"
          >
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={checked[item.id] || false}
                onChange={() => handleToggle(item.id)}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded transition-colors ${
                checked[item.id]
                  ? 'bg-green-600 border-green-600'
                  : 'border-zinc-600 hover:border-zinc-500'
              }`}>
                {checked[item.id] && (
                  <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className={`text-sm transition-colors ${
              checked[item.id] ? 'text-gray-500 line-through' : 'text-gray-300'
            }`}>
              {item.text}
            </span>
          </label>
        ))}
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="px-5 py-2 bg-zinc-800/50 border-t border-zinc-800 text-center">
          <span className="text-amber-500 text-xs flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Saving...
          </span>
        </div>
      )}
    </div>
  );
}
