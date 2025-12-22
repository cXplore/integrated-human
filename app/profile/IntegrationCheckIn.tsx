'use client';

import { useState, useEffect } from 'react';

interface CheckIn {
  id: string;
  type: string;
  promptType: string;
  response: string;
  createdAt: string;
}

interface CheckInData {
  checkIns: CheckIn[];
  isCheckInDue: boolean;
  nextPrompt: {
    type: string;
    prompt: string;
  };
  totalCount: number;
  lastCheckInDate: string | null;
}

const PROMPT_TYPE_LABELS: Record<string, string> = {
  'what-shifted': 'What Shifted',
  'applying-learning': 'Applying Learning',
  'current-edge': 'Current Edge',
  'gratitude': 'Gratitude',
};

export default function IntegrationCheckIn() {
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    try {
      const res = await fetch('/api/check-ins');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!response.trim() || !data?.nextPrompt) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly',
          promptType: data.nextPrompt.type,
          response: response.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setResponse('');
        // Refresh data after a moment
        setTimeout(() => {
          fetchCheckIns();
          setSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysSinceLastCheckIn = () => {
    if (!data?.lastCheckInDate) return null;
    const last = new Date(data.lastCheckInDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-24 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  // Show success message after submission
  if (submitted) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-gray-500">
          Integration Check-in
        </h2>
        <div className="bg-emerald-900/20 border border-emerald-800 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-emerald-400 font-medium mb-1">Thank you for reflecting</p>
          <p className="text-gray-500 text-sm">Your check-in has been saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wide text-gray-500">
          Integration Check-in
        </h2>
        {data.totalCount > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showHistory ? 'Hide History' : `${data.totalCount} check-ins`}
          </button>
        )}
      </div>

      {/* Check-in Prompt */}
      {data.isCheckInDue ? (
        <div className="bg-amber-900/10 border border-amber-800/50 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">
                Weekly Reflection
              </p>
              <p className="text-white font-serif text-lg italic">
                "{data.nextPrompt.prompt}"
              </p>
            </div>
          </div>

          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Take a moment to reflect..."
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-zinc-600 placeholder-gray-600 resize-none mb-3"
          />

          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-xs">
              {response.length} characters
            </span>
            <button
              onClick={handleSubmit}
              disabled={response.trim().length < 10 || submitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white text-sm font-medium transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Reflection'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 text-center">
          <div className="text-gray-500 mb-1">
            Last check-in: {data.lastCheckInDate ? formatDate(data.lastCheckInDate) : 'Never'}
          </div>
          <div className="text-gray-400 text-sm">
            {daysSinceLastCheckIn() !== null && daysSinceLastCheckIn()! < 7 ? (
              <>Your next reflection will be ready in {7 - daysSinceLastCheckIn()!} days</>
            ) : (
              <>Time for a new reflection</>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && data.checkIns.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Previous Reflections
          </div>
          {data.checkIns.slice(0, 5).map((checkIn) => (
            <div
              key={checkIn.id}
              className="bg-zinc-900 border border-zinc-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500">
                  {PROMPT_TYPE_LABELS[checkIn.promptType] || checkIn.promptType}
                </span>
                <span className="text-gray-600 text-xs">
                  {formatDate(checkIn.createdAt)}
                </span>
              </div>
              <p className="text-gray-400 text-sm line-clamp-3">
                {checkIn.response}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
