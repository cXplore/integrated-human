'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Pillar = 'mind' | 'body' | 'soul' | 'relationships';

interface CheckInData {
  todayCheckIn: {
    mood: number;
    energy: number;
    note: string | null;
    pillarFocus: string | null;
  } | null;
  hasCheckedInToday: boolean;
  streak: number;
  averages: {
    mood: number | null;
    energy: number | null;
  };
}

const MOOD_LABELS = ['Struggling', 'Low', 'Okay', 'Good', 'Great'];
const ENERGY_LABELS = ['Exhausted', 'Low', 'Moderate', 'Good', 'High'];

const PILLAR_INFO: Record<Pillar, { label: string; color: string }> = {
  mind: { label: 'Mind', color: 'text-purple-400' },
  body: { label: 'Body', color: 'text-green-400' },
  soul: { label: 'Soul', color: 'text-amber-400' },
  relationships: { label: 'Relationships', color: 'text-rose-400' },
};

export default function QuickCheckIn() {
  const { data: session, status } = useSession();
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Form state
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [pillarFocus, setPillarFocus] = useState<Pillar | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCheckIn();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  async function fetchCheckIn() {
    try {
      const res = await fetch('/api/quick-check-in');
      if (res.ok) {
        const data = await res.json();
        setCheckInData(data);
        if (data.todayCheckIn) {
          setMood(data.todayCheckIn.mood);
          setEnergy(data.todayCheckIn.energy);
          setNote(data.todayCheckIn.note || '');
          setPillarFocus(data.todayCheckIn.pillarFocus as Pillar | null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch check-in:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/quick-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          energy,
          note: note.trim() || null,
          pillarFocus,
        }),
      });

      if (res.ok) {
        await fetchCheckIn();
        setExpanded(false);
      }
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (status !== 'authenticated') return null;
  if (loading) return null;

  // Collapsed state - show prompt or status
  if (!expanded) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checkInData?.hasCheckedInToday ? (
              <>
                <div className="flex gap-1">
                  <span className="text-2xl">{getMoodEmoji(checkInData.todayCheckIn!.mood)}</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">
                    {MOOD_LABELS[checkInData.todayCheckIn!.mood - 1]} &middot;{' '}
                    {ENERGY_LABELS[checkInData.todayCheckIn!.energy - 1]} energy
                  </p>
                  {checkInData.streak > 1 && (
                    <p className="text-amber-500 text-xs">{checkInData.streak} day streak</p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="text-gray-300 text-sm">How are you right now?</p>
                <p className="text-gray-500 text-xs">Takes 10 seconds</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {checkInData?.hasCheckedInToday ? 'Update' : 'Check in'}
          </button>
        </div>
      </div>
    );
  }

  // Expanded state - show form
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Quick Check-in</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mood */}
      <div className="mb-5">
        <label className="text-gray-400 text-sm mb-2 block">How are you feeling?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setMood(value)}
              className={`flex-1 py-2 rounded text-center transition-all ${
                mood === value
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
              }`}
            >
              <span className="text-lg">{getMoodEmoji(value)}</span>
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-1 text-center">{MOOD_LABELS[mood - 1]}</p>
      </div>

      {/* Energy */}
      <div className="mb-5">
        <label className="text-gray-400 text-sm mb-2 block">Energy level?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setEnergy(value)}
              className={`flex-1 py-2 rounded text-center transition-all ${
                energy === value
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
              }`}
            >
              <span className="text-lg">{getEnergyEmoji(value)}</span>
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-1 text-center">{ENERGY_LABELS[energy - 1]}</p>
      </div>

      {/* Pillar Focus (optional) */}
      <div className="mb-5">
        <label className="text-gray-400 text-sm mb-2 block">
          What needs attention today? <span className="text-gray-600">(optional)</span>
        </label>
        <div className="flex gap-2">
          {(Object.keys(PILLAR_INFO) as Pillar[]).map((pillar) => (
            <button
              key={pillar}
              onClick={() => setPillarFocus(pillarFocus === pillar ? null : pillar)}
              className={`flex-1 py-2 px-1 rounded text-xs transition-all ${
                pillarFocus === pillar
                  ? `bg-zinc-700 ${PILLAR_INFO[pillar].color}`
                  : 'bg-zinc-800 text-gray-500 hover:bg-zinc-700'
              }`}
            >
              {PILLAR_INFO[pillar].label}
            </button>
          ))}
        </div>
      </div>

      {/* Note (optional) */}
      <div className="mb-5">
        <label className="text-gray-400 text-sm mb-2 block">
          Brief note <span className="text-gray-600">(optional)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 200))}
          placeholder="What's on your mind?"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-2 bg-white text-black font-medium rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Saving...' : checkInData?.hasCheckedInToday ? 'Update' : 'Check in'}
      </button>
    </div>
  );
}

function getMoodEmoji(mood: number): string {
  const emojis = ['😔', '😕', '😐', '🙂', '😊'];
  return emojis[mood - 1] || '😐';
}

function getEnergyEmoji(energy: number): string {
  const emojis = ['🔋', '🪫', '⚡', '💪', '🔥'];
  return emojis[energy - 1] || '⚡';
}
