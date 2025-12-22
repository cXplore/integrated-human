'use client';

import { useState, useEffect, useCallback } from 'react';
import JournalInsights from './JournalInsights';
import JournalCompanion from './JournalCompanion';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  promptId: string | null;
  mood: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CourseJournalEntry {
  id: string;
  courseSlug: string;
  moduleSlug: string;
  exerciseId: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

const DAILY_PROMPTS = [
  "What am I grateful for today?",
  "What emotions came up for me today, and what might they be telling me?",
  "What pattern did I notice in myself today?",
  "What would I tell my younger self about today?",
  "What part of myself am I avoiding right now?",
  "What does my body need that I haven't been giving it?",
  "What fear is holding me back, and what might be on the other side of it?",
  "What would unconditional self-acceptance look like today?",
  "What boundary do I need to set or reinforce?",
  "What am I ready to let go of?",
  "What is my inner critic saying, and what does it need to hear?",
  "What would my wisest self advise me right now?",
];

const MOODS = [
  { value: 'peaceful', label: 'Peaceful', color: 'text-blue-400' },
  { value: 'grateful', label: 'Grateful', color: 'text-green-400' },
  { value: 'curious', label: 'Curious', color: 'text-purple-400' },
  { value: 'anxious', label: 'Anxious', color: 'text-yellow-400' },
  { value: 'sad', label: 'Sad', color: 'text-gray-400' },
  { value: 'angry', label: 'Angry', color: 'text-red-400' },
  { value: 'hopeful', label: 'Hopeful', color: 'text-amber-400' },
  { value: 'confused', label: 'Confused', color: 'text-orange-400' },
];

export default function JournalView() {
  const [activeTab, setActiveTab] = useState<'write' | 'entries' | 'insights' | 'companion' | 'course'>('write');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [courseEntries, setCourseEntries] = useState<CourseJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New entry state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [usePrompt, setUsePrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Get a daily prompt based on the date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    setCurrentPrompt(DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length]);
  }, []);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const [journalRes, courseRes] = await Promise.all([
        fetch('/api/journal'),
        fetch('/api/journal/course-entries'),
      ]);

      const journalData = await journalRes.json();
      const courseData = await courseRes.json();

      if (journalData.entries) setEntries(journalData.entries);
      if (courseData.entries) setCourseEntries(courseData.entries);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Save new entry
  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          content,
          promptId: usePrompt ? currentPrompt : null,
          mood: mood || null,
        }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        setMood('');
        setUsePrompt(false);
        fetchEntries();
        setActiveTab('entries');
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(entries.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format course slug to readable title
  const formatCourseTitle = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('write')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'write'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          New Entry
          {activeTab === 'write' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'entries'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          My Entries ({entries.length})
          {activeTab === 'entries' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'insights'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Insights
          {activeTab === 'insights' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('companion')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'companion'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          AI Companion
          {activeTab === 'companion' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('course')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'course'
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Course Journals ({courseEntries.length})
          {activeTab === 'course' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
      </div>

      {/* Write Tab */}
      {activeTab === 'write' && (
        <div className="space-y-6">
          {/* Daily Prompt */}
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-amber-400 text-xs uppercase tracking-wide mb-2">
                  Today's Prompt
                </p>
                <p className="text-gray-300 text-lg font-serif italic">
                  "{currentPrompt}"
                </p>
              </div>
              <button
                onClick={() => {
                  setUsePrompt(!usePrompt);
                  if (!usePrompt) setTitle(currentPrompt);
                  else setTitle('');
                }}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  usePrompt
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'border-zinc-700 text-gray-500 hover:text-gray-300 hover:border-zinc-600'
                }`}
              >
                {usePrompt ? 'Using Prompt' : 'Use This'}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-zinc-600 placeholder-gray-600"
            />
          </div>

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? What are you noticing? What wants to be expressed?"
              rows={12}
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-zinc-600 placeholder-gray-600 resize-y"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {/* Mood */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
              How are you feeling?
            </p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? '' : m.value)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    mood === m.value
                      ? `bg-zinc-800 border-zinc-600 ${m.color}`
                      : 'border-zinc-800 text-gray-500 hover:text-gray-300 hover:border-zinc-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {/* Entries Tab */}
      {activeTab === 'entries' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No journal entries yet</p>
              <button
                onClick={() => setActiveTab('write')}
                className="text-amber-500 hover:text-amber-400"
              >
                Write your first entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-zinc-900 border border-zinc-800 overflow-hidden"
                >
                  {/* Entry Header */}
                  <button
                    onClick={() =>
                      setExpandedEntry(expandedEntry === entry.id ? null : entry.id)
                    }
                    className="w-full px-5 py-4 flex items-start justify-between text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-gray-500 text-sm">
                          {formatDate(entry.createdAt)}
                        </span>
                        {entry.mood && (
                          <span
                            className={`text-xs ${
                              MOODS.find((m) => m.value === entry.mood)?.color ||
                              'text-gray-400'
                            }`}
                          >
                            {MOODS.find((m) => m.value === entry.mood)?.label}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-medium truncate">
                        {entry.title || entry.content.slice(0, 60) + '...'}
                      </h3>
                      {expandedEntry !== entry.id && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {entry.content.slice(0, 150)}
                          {entry.content.length > 150 && '...'}
                        </p>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedEntry === entry.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {expandedEntry === entry.id && (
                    <div className="px-5 pb-5 border-t border-zinc-800">
                      {entry.promptId && (
                        <p className="text-amber-400/70 text-sm italic mt-4 mb-3">
                          Prompt: "{entry.promptId}"
                        </p>
                      )}
                      <div className="text-gray-300 whitespace-pre-wrap mt-4">
                        {entry.content}
                      </div>
                      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-800">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-500/70 hover:text-red-400 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && <JournalInsights />}

      {/* AI Companion Tab */}
      {activeTab === 'companion' && <JournalCompanion />}

      {/* Course Journals Tab */}
      {activeTab === 'course' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : courseEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                No course journal entries yet
              </p>
              <a
                href="/courses"
                className="text-amber-500 hover:text-amber-400"
              >
                Explore courses with journal exercises
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {courseEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-zinc-900 border border-zinc-800 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedEntry(
                        expandedEntry === entry.id ? null : entry.id
                      )
                    }
                    className="w-full px-5 py-4 flex items-start justify-between text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-amber-500/70 text-xs uppercase tracking-wide">
                          {formatCourseTitle(entry.courseSlug)}
                        </span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-500 text-sm">
                          {formatDate(entry.updatedAt)}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">
                        {entry.exerciseId
                          .split('-')
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(' ')}
                      </h3>
                      {expandedEntry !== entry.id && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {entry.value.slice(0, 150)}
                          {entry.value.length > 150 && '...'}
                        </p>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedEntry === entry.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {expandedEntry === entry.id && (
                    <div className="px-5 pb-5 border-t border-zinc-800">
                      <div className="text-gray-300 whitespace-pre-wrap mt-4">
                        {entry.value}
                      </div>
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <a
                          href={`/courses/${entry.courseSlug}/${entry.moduleSlug}`}
                          className="text-amber-500 hover:text-amber-400 text-sm transition-colors"
                        >
                          View in course →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
