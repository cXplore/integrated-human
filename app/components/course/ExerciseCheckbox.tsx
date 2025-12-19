'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ExerciseCheckboxProps {
  id: string;
  label: string;
  courseSlug: string;
  moduleSlug: string;
}

export default function ExerciseCheckbox({
  id,
  label,
  courseSlug,
  moduleSlug,
}: ExerciseCheckboxProps) {
  const { data: session } = useSession();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const storageKey = `exercise_${courseSlug}_${moduleSlug}_${id}`;

  // Load initial state
  useEffect(() => {
    if (session?.user?.id) {
      // Try to load from API
      fetch(`/api/exercises?courseSlug=${courseSlug}&moduleSlug=${moduleSlug}&exerciseId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.value !== undefined) {
            setChecked(data.value === 'true');
          }
        })
        .catch(() => {
          // Fall back to localStorage
          const saved = localStorage.getItem(storageKey);
          if (saved) setChecked(saved === 'true');
        });
    } else {
      // Use localStorage for non-authenticated users
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(saved === 'true');
    }
  }, [session, courseSlug, moduleSlug, id, storageKey]);

  const handleChange = async () => {
    const newValue = !checked;
    setChecked(newValue);
    setSaving(true);

    // Save to localStorage immediately
    localStorage.setItem(storageKey, String(newValue));

    // If authenticated, also save to API
    if (session?.user?.id) {
      try {
        await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseSlug,
            moduleSlug,
            exerciseId: id,
            type: 'checkbox',
            value: String(newValue),
          }),
        });
      } catch (error) {
        console.error('Failed to save exercise:', error);
      }
    }

    setSaving(false);
  };

  return (
    <label className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 border-2 rounded transition-colors ${
          checked
            ? 'bg-green-600 border-green-600'
            : 'border-zinc-600 group-hover:border-zinc-500'
        }`}>
          {checked && (
            <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        {saving && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </div>
      <span className={`text-sm transition-colors ${checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
        {label}
      </span>
    </label>
  );
}
