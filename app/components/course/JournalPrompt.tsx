'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface JournalPromptProps {
  id: string;
  prompt: string;
  courseSlug: string;
  moduleSlug: string;
  placeholder?: string;
  minRows?: number;
}

export default function JournalPrompt({
  id,
  prompt,
  courseSlug,
  moduleSlug,
  placeholder = 'Write your response here...',
  minRows = 6,
}: JournalPromptProps) {
  const { data: session } = useSession();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const storageKey = `journal_${courseSlug}_${moduleSlug}_${id}`;

  // Load initial state
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/exercises?courseSlug=${courseSlug}&moduleSlug=${moduleSlug}&exerciseId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.value) {
            setValue(data.value);
          }
        })
        .catch(() => {
          const saved = localStorage.getItem(storageKey);
          if (saved) setValue(saved);
        });
    } else {
      const saved = localStorage.getItem(storageKey);
      if (saved) setValue(saved);
    }
  }, [session, courseSlug, moduleSlug, id, storageKey]);

  // Debounced save
  const saveValue = useCallback(async (text: string) => {
    setSaving(true);
    localStorage.setItem(storageKey, text);

    if (session?.user?.id) {
      try {
        await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseSlug,
            moduleSlug,
            exerciseId: id,
            type: 'journal',
            value: text,
          }),
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save journal:', error);
      }
    } else {
      setLastSaved(new Date());
    }

    setSaving(false);
  }, [session, courseSlug, moduleSlug, id, storageKey]);

  // Auto-save after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        saveValue(value);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [value, saveValue]);

  return (
    <div className="my-8 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Reflection Exercise
        </div>
        <p className="text-gray-300">{prompt}</p>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full bg-zinc-800 border border-zinc-700 text-gray-200 placeholder-gray-600 p-4 resize-y focus:outline-none focus:border-zinc-500 transition-colors"
          style={{ minHeight: `${minRows * 1.5}rem` }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="text-gray-600">
            {value.length > 0 && `${value.split(/\s+/).filter(Boolean).length} words`}
          </div>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-amber-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-green-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            ) : (
              <span className="text-gray-600">Auto-saves as you type</span>
            )}
          </div>
        </div>
      </div>

      {/* Login prompt for non-authenticated users */}
      {!session?.user && (
        <div className="px-5 py-3 bg-zinc-800/50 border-t border-zinc-800 text-center">
          <p className="text-gray-500 text-sm">
            <a href="/login" className="text-gray-400 hover:text-white underline">Sign in</a> to save your responses across devices
          </p>
        </div>
      )}
    </div>
  );
}
