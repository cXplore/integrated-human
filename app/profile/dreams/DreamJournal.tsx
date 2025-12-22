'use client';

import { useState, useEffect, useRef } from 'react';

interface Dream {
  id: string;
  title: string | null;
  content: string;
  dreamDate: string;
  emotions: string[];
  symbols: string[];
  lucid: boolean;
  recurring: boolean;
  interpretation: string | null;
  createdAt: string;
}

interface DreamStats {
  totalDreams: number;
  emotionDistribution: Record<string, number>;
  recurringSymbols: { symbol: string; count: number }[];
}

const EMOTIONS = [
  { value: 'peaceful', label: 'Peaceful', color: 'text-blue-400' },
  { value: 'anxious', label: 'Anxious', color: 'text-amber-400' },
  { value: 'fearful', label: 'Fearful', color: 'text-red-400' },
  { value: 'joyful', label: 'Joyful', color: 'text-green-400' },
  { value: 'confused', label: 'Confused', color: 'text-purple-400' },
  { value: 'sad', label: 'Sad', color: 'text-gray-400' },
  { value: 'powerful', label: 'Powerful', color: 'text-orange-400' },
  { value: 'curious', label: 'Curious', color: 'text-cyan-400' },
];

const COMMON_SYMBOLS = [
  'water', 'flying', 'falling', 'chase', 'teeth', 'house', 'car', 'animal',
  'death', 'baby', 'snake', 'spider', 'fire', 'school', 'work', 'family',
  'stranger', 'lost', 'naked', 'bridge', 'door', 'stairs', 'mirror', 'shadow',
];

export default function DreamJournal() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);

  // New dream form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dreamDate, setDreamDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [customSymbol, setCustomSymbol] = useState('');
  const [lucid, setLucid] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  // Interpretation state
  const [interpreting, setInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [interpretContext, setInterpretContext] = useState('');
  const interpretRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDreams();
  }, []);

  const fetchDreams = async () => {
    try {
      const res = await fetch('/api/dreams');
      if (res.ok) {
        const data = await res.json();
        setDreams(data.dreams);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching dreams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (content.trim().length < 10) return;

    setSaving(true);
    try {
      const res = await fetch('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          dreamDate,
          emotions: selectedEmotions,
          symbols,
          lucid,
          recurring,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDreams([data.dream, ...dreams]);
        resetForm();
        setSelectedDream(data.dream);
        setView('detail');
      }
    } catch (error) {
      console.error('Error saving dream:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDreamDate(new Date().toISOString().split('T')[0]);
    setSelectedEmotions([]);
    setSymbols([]);
    setCustomSymbol('');
    setLucid(false);
    setRecurring(false);
  };

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const addSymbol = (symbol: string) => {
    if (!symbols.includes(symbol)) {
      setSymbols([...symbols, symbol]);
    }
  };

  const removeSymbol = (symbol: string) => {
    setSymbols(symbols.filter(s => s !== symbol));
  };

  const handleAddCustomSymbol = () => {
    if (customSymbol.trim() && !symbols.includes(customSymbol.trim())) {
      setSymbols([...symbols, customSymbol.trim()]);
      setCustomSymbol('');
    }
  };

  const requestInterpretation = async (dream: Dream) => {
    setInterpretation('');
    setInterpreting(true);

    try {
      const res = await fetch('/api/dreams/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamId: dream.id,
          content: dream.content,
          symbols: dream.symbols,
          emotions: dream.emotions,
          recurring: dream.recurring,
          context: interpretContext,
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setInterpretation(`Insufficient credits. You need ${data.required} credits but have ${data.available}. Visit your profile to purchase more.`);
        setInterpreting(false);
        return;
      }

      if (!res.ok) {
        setInterpretation('Unable to get interpretation at this time. Please try again later.');
        setInterpreting(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullInterpretation = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullInterpretation += parsed.content;
                setInterpretation(fullInterpretation);
                // Auto-scroll
                if (interpretRef.current) {
                  interpretRef.current.scrollTop = interpretRef.current.scrollHeight;
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Update dream with interpretation
      setSelectedDream(prev => prev ? { ...prev, interpretation: fullInterpretation } : null);
    } catch (error) {
      console.error('Error getting interpretation:', error);
      setInterpretation('Failed to get interpretation. Please try again.');
    } finally {
      setInterpreting(false);
    }
  };

  const deleteDream = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dream?')) return;

    try {
      const res = await fetch(`/api/dreams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDreams(dreams.filter(d => d.id !== id));
        setView('list');
        setSelectedDream(null);
      }
    } catch (error) {
      console.error('Error deleting dream:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-48 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  // New Dream View
  if (view === 'new') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setView('list')}
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dreams
        </button>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 space-y-6">
          <h2 className="text-xl text-white font-serif">Record a Dream</h2>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your dream a name..."
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-zinc-600 placeholder-gray-600"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">When did you have this dream?</label>
            <input
              type="date"
              value={dreamDate}
              onChange={(e) => setDreamDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Describe your dream</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write down everything you can remember... the setting, people, events, feelings..."
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 focus:outline-none focus:border-zinc-600 placeholder-gray-600 resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">{content.length} characters (minimum 10)</p>
          </div>

          {/* Emotions */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">How did the dream feel? (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => toggleEmotion(e.value)}
                  className={`px-3 py-1.5 border text-sm transition-colors ${
                    selectedEmotions.includes(e.value)
                      ? `${e.color} border-current bg-current/10`
                      : 'border-zinc-800 text-gray-500 hover:border-zinc-600'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symbols */}
          <div>
            <label className="block text-sm text-gray-500 mb-2">Key symbols (select or add your own)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => symbols.includes(s) ? removeSymbol(s) : addSymbol(s)}
                  className={`px-2 py-1 text-xs border transition-colors ${
                    symbols.includes(s)
                      ? 'border-amber-600 text-amber-400 bg-amber-600/10'
                      : 'border-zinc-800 text-gray-600 hover:text-gray-400 hover:border-zinc-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSymbol()}
                placeholder="Add custom symbol..."
                className="flex-1 bg-zinc-900 border border-zinc-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 placeholder-gray-600"
              />
              <button
                onClick={handleAddCustomSymbol}
                disabled={!customSymbol.trim()}
                className="px-3 py-2 border border-zinc-800 text-gray-500 hover:text-white hover:border-zinc-600 disabled:opacity-50 transition-colors text-sm"
              >
                Add
              </button>
            </div>
            {symbols.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {symbols.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-600/10 border border-amber-600 text-amber-400 text-xs"
                  >
                    {s}
                    <button onClick={() => removeSymbol(s)} className="hover:text-amber-200">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={lucid}
                onChange={(e) => setLucid(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-600"
              />
              Lucid dream
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-600 focus:ring-amber-600"
              />
              Recurring dream
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={content.trim().length < 10 || saving}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Dream'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dream Detail View
  if (view === 'detail' && selectedDream) {
    const primaryEmotion = selectedDream.emotions?.[0];
    const emotionInfo = EMOTIONS.find(e => e.value === primaryEmotion);

    return (
      <div className="space-y-6">
        <button
          onClick={() => { setView('list'); setSelectedDream(null); setInterpretation(''); }}
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dreams
        </button>

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl text-white font-serif mb-2">
                {selectedDream.title || 'Untitled Dream'}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{formatDate(selectedDream.dreamDate)}</span>
                {emotionInfo && (
                  <>
                    <span>·</span>
                    <span className={emotionInfo.color}>{emotionInfo.label}</span>
                  </>
                )}
                {selectedDream.emotions?.length > 1 && (
                  <span className="text-gray-600">+{selectedDream.emotions.length - 1}</span>
                )}
                {selectedDream.lucid && (
                  <>
                    <span>·</span>
                    <span className="text-purple-400">Lucid</span>
                  </>
                )}
                {selectedDream.recurring && (
                  <>
                    <span>·</span>
                    <span className="text-cyan-400">Recurring</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteDream(selectedDream.id)}
              className="text-gray-600 hover:text-red-400 transition-colors"
              title="Delete dream"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{selectedDream.content}</p>
          </div>

          {/* Emotions */}
          {selectedDream.emotions?.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Emotions</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDream.emotions.map((e) => {
                  const info = EMOTIONS.find(em => em.value === e);
                  return (
                    <span key={e} className={`px-2 py-1 bg-zinc-800 text-sm ${info?.color || 'text-gray-400'}`}>
                      {info?.label || e}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Symbols */}
          {selectedDream.symbols?.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Symbols</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDream.symbols.map((s) => (
                  <span key={s} className="px-2 py-1 bg-zinc-800 text-gray-400 text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interpretation Section */}
          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-4">AI Interpretation</h3>

            {selectedDream.interpretation && !interpretation && !interpreting ? (
              <div className="space-y-4">
                <div className="prose prose-invert prose-zinc max-w-none bg-zinc-900/50 p-4 border border-zinc-800">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedDream.interpretation}</p>
                </div>
                <button
                  onClick={() => requestInterpretation(selectedDream)}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Get new interpretation (5 credits)
                </button>
              </div>
            ) : interpretation || interpreting ? (
              <div className="space-y-4">
                <div
                  ref={interpretRef}
                  className="prose prose-invert prose-zinc max-w-none bg-zinc-900/50 p-4 border border-zinc-800 max-h-96 overflow-y-auto"
                >
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {interpretation}
                    {interpreting && <span className="animate-pulse">▌</span>}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Get a personalized interpretation of your dream drawing from Jungian psychology and archetypal symbolism.
                </p>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Any context you'd like to share? (optional)
                  </label>
                  <textarea
                    value={interpretContext}
                    onChange={(e) => setInterpretContext(e.target.value)}
                    placeholder="What's going on in your life right now? Any thoughts about what this dream might be about?"
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 placeholder-gray-600 resize-none"
                  />
                </div>
                <button
                  onClick={() => requestInterpretation(selectedDream)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Interpret Dream (5 credits)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-8">
      {/* Stats Banner */}
      {stats && stats.totalDreams > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4">
            <div className="text-3xl text-white font-light mb-1">{stats.totalDreams}</div>
            <div className="text-sm text-gray-500">Dreams recorded</div>
          </div>
          {stats.recurringSymbols.length > 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-4 md:col-span-2">
              <div className="text-sm text-gray-500 mb-2">Recurring symbols</div>
              <div className="flex flex-wrap gap-2">
                {stats.recurringSymbols.slice(0, 6).map((s) => (
                  <span key={s.symbol} className="text-sm text-gray-400">
                    {s.symbol} <span className="text-gray-600">({s.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Dream Button */}
      <button
        onClick={() => setView('new')}
        className="w-full bg-[var(--card-bg)] border border-dashed border-zinc-700 p-6 text-center hover:border-zinc-500 transition-colors group"
      >
        <div className="flex items-center justify-center gap-3 text-gray-500 group-hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">Record a New Dream</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Best done right after waking, while the dream is still fresh
        </p>
      </button>

      {/* Dreams List */}
      {dreams.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <p className="mb-2">No dreams recorded yet</p>
          <p className="text-sm">Start capturing your dream life to uncover patterns and insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dreams.map((dream) => {
            const primaryEmotion = dream.emotions?.[0];
            const emotionInfo = EMOTIONS.find(e => e.value === primaryEmotion);
            return (
              <button
                key={dream.id}
                onClick={() => { setSelectedDream(dream); setView('detail'); }}
                className="w-full text-left bg-[var(--card-bg)] border border-[var(--border-color)] p-5 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium mb-1 truncate">
                      {dream.title || 'Untitled Dream'}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-2">
                      {dream.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{formatDate(dream.dreamDate)}</span>
                      {emotionInfo && (
                        <span className={emotionInfo.color}>{emotionInfo.label}</span>
                      )}
                      {dream.symbols?.length > 0 && (
                        <span>{dream.symbols.length} symbols</span>
                      )}
                      {dream.interpretation && (
                        <span className="text-purple-400">Interpreted</span>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
