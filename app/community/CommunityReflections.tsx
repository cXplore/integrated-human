'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Reflection {
  id: string;
  content: string;
  topic: string | null;
  mood: string | null;
  responseCount: number;
  createdAt: string;
}

interface Response {
  id: string;
  content: string;
  createdAt: string;
}

const TOPICS = [
  { id: 'all', label: 'All' },
  { id: 'shadow', label: 'Shadow Work' },
  { id: 'growth', label: 'Growth' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'meaning', label: 'Meaning' },
  { id: 'healing', label: 'Healing' },
  { id: 'general', label: 'General' },
];

const MOODS = [
  { id: 'grateful', label: 'Grateful', emoji: '' },
  { id: 'struggling', label: 'Struggling', emoji: '' },
  { id: 'hopeful', label: 'Hopeful', emoji: '' },
  { id: 'confused', label: 'Confused', emoji: '' },
  { id: 'peaceful', label: 'Peaceful', emoji: '' },
  { id: 'reflective', label: 'Reflective', emoji: '' },
];

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function ReflectionCard({
  reflection,
  onRespond,
}: {
  reflection: Reflection;
  onRespond: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const loadResponses = async () => {
    if (responses.length > 0) {
      setExpanded(!expanded);
      return;
    }

    setLoadingResponses(true);
    try {
      const res = await fetch(`/api/reflections/${reflection.id}/responses`);
      const data = await res.json();
      setResponses(data.responses || []);
      setExpanded(true);
    } catch (error) {
      console.error('Error loading responses:', error);
    }
    setLoadingResponses(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6">
      {/* Topic & Mood Tags */}
      <div className="flex items-center gap-2 mb-3">
        {reflection.topic && reflection.topic !== 'general' && (
          <span className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-400">
            {TOPICS.find((t) => t.id === reflection.topic)?.label || reflection.topic}
          </span>
        )}
        {reflection.mood && (
          <span className="text-xs px-2 py-0.5 bg-zinc-800 text-gray-500">
            {MOODS.find((m) => m.id === reflection.mood)?.label || reflection.mood}
          </span>
        )}
        <span className="text-xs text-gray-600 ml-auto">
          {timeAgo(reflection.createdAt)}
        </span>
      </div>

      {/* Content */}
      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
        {reflection.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
        <button
          onClick={loadResponses}
          className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
        >
          {loadingResponses ? (
            'Loading...'
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {reflection.responseCount > 0
                ? `${reflection.responseCount} ${reflection.responseCount === 1 ? 'response' : 'responses'}`
                : 'Respond'}
            </>
          )}
        </button>
        <button
          onClick={() => onRespond(reflection.id)}
          className="text-sm text-gray-500 hover:text-amber-400 transition-colors"
        >
          Add response
        </button>
      </div>

      {/* Responses */}
      {expanded && responses.length > 0 && (
        <div className="mt-4 space-y-3">
          {responses.map((response) => (
            <div key={response.id} className="pl-4 border-l-2 border-zinc-800">
              <p className="text-gray-400 text-sm leading-relaxed">{response.content}</p>
              <span className="text-xs text-gray-600 mt-1 block">
                {timeAgo(response.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommunityReflections() {
  const { data: session } = useSession();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // New reflection form
  const [newContent, setNewContent] = useState('');
  const [newTopic, setNewTopic] = useState('general');
  const [newMood, setNewMood] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Response form
  const [responseContent, setResponseContent] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    loadReflections();
  }, [topic]);

  const loadReflections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reflections?topic=${topic}&limit=20`);
      const data = await res.json();
      setReflections(data.reflections || []);
    } catch (error) {
      console.error('Error loading reflections:', error);
    }
    setLoading(false);
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          topic: newTopic,
          mood: newMood || undefined,
        }),
      });

      if (res.ok) {
        setNewContent('');
        setNewTopic('general');
        setNewMood('');
        setShowNewForm(false);
        loadReflections();
      }
    } catch (error) {
      console.error('Error submitting reflection:', error);
    }
    setSubmitting(false);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseContent.trim() || !respondingTo || submittingResponse) return;

    setSubmittingResponse(true);
    try {
      const res = await fetch(`/api/reflections/${respondingTo}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: responseContent }),
      });

      if (res.ok) {
        setResponseContent('');
        setRespondingTo(null);
        loadReflections();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
    setSubmittingResponse(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl text-white mb-1">Shared Reflections</h2>
          <p className="text-gray-500 text-sm">
            Anonymous insights from fellow travelers on the path
          </p>
        </div>

        {session?.user ? (
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            Share a Reflection
          </button>
        ) : (
          <Link
            href="/login?callbackUrl=/community"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            Sign in to share
          </Link>
        )}
      </div>

      {/* New Reflection Form */}
      {showNewForm && session?.user && (
        <form onSubmit={handleSubmitReflection} className="bg-zinc-900/50 border border-zinc-800 p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              What's on your mind? (shared anonymously)
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Share a reflection, insight, or struggle..."
              className="w-full h-32 bg-zinc-900 border border-zinc-700 p-4 text-gray-300 placeholder-gray-600 focus:border-zinc-500 focus:outline-none resize-none"
              maxLength={2000}
            />
            <div className="text-right text-xs text-gray-600 mt-1">
              {newContent.length}/2000
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Topic</label>
              <select
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 text-gray-300 focus:border-zinc-500 focus:outline-none"
              >
                {TOPICS.filter((t) => t.id !== 'all').map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">How are you feeling? (optional)</label>
              <select
                value={newMood}
                onChange={(e) => setNewMood(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 text-gray-300 focus:border-zinc-500 focus:outline-none"
              >
                <option value="">Select mood...</option>
                {MOODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Your name and identity remain completely private
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 text-gray-500 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || newContent.trim().length < 10}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sharing...' : 'Share Anonymously'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Response Modal */}
      {respondingTo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmitResponse}
            className="bg-zinc-900 border border-zinc-800 p-6 w-full max-w-lg"
          >
            <h3 className="font-serif text-lg text-white mb-4">Add a Response</h3>
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="Offer encouragement, share your perspective, or ask a question..."
              className="w-full h-24 bg-zinc-800 border border-zinc-700 p-4 text-gray-300 placeholder-gray-600 focus:border-zinc-500 focus:outline-none resize-none mb-4"
              maxLength={1000}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">Anonymous</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRespondingTo(null);
                    setResponseContent('');
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResponse || responseContent.trim().length < 5}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResponse ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Topic Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTopic(t.id)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              topic === t.id
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-800 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reflections List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-zinc-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : reflections.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 text-center">
          <p className="text-gray-500 mb-4">No reflections yet{topic !== 'all' ? ` in ${TOPICS.find((t) => t.id === topic)?.label}` : ''}.</p>
          {session?.user && (
            <button
              onClick={() => setShowNewForm(true)}
              className="text-amber-400 hover:text-amber-300 text-sm"
            >
              Be the first to share
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reflections.map((reflection) => (
            <ReflectionCard
              key={reflection.id}
              reflection={reflection}
              onRespond={(id) => {
                if (!session?.user) {
                  window.location.href = '/login?callbackUrl=/community';
                  return;
                }
                setRespondingTo(id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
