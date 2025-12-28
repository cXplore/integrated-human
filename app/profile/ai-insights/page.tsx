'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TriggerPattern {
  trigger: string;
  intensity: number;
  occurrenceCount: number;
  preferredResponse: string | null;
  context: string | null;
}

interface ChatPreference {
  category: string;
  preference: string;
  strength: number;
  confidence: number;
}

interface ConversationTheme {
  theme: string;
  count: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface EmotionalStats {
  improvementRate: number;
  commonStartMoods: Array<{ mood: string; count: number }>;
  commonEndMoods: Array<{ mood: string; count: number }>;
}

interface AIInsight {
  insight: string;
  strength: number;
  insightType: string;
}

interface ShadowPattern {
  type: string;
  insight: string;
  strength: number;
  occurrences: number;
}

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'triggers' | 'preferences' | 'themes' | 'emotional' | 'shadow'>('triggers');

  const [triggers, setTriggers] = useState<TriggerPattern[]>([]);
  const [preferences, setPreferences] = useState<ChatPreference[]>([]);
  const [themes, setThemes] = useState<ConversationTheme[]>([]);
  const [emotionalStats, setEmotionalStats] = useState<EmotionalStats | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [shadowPatterns, setShadowPatterns] = useState<ShadowPattern[]>([]);
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);
  const [preferredResponseInput, setPreferredResponseInput] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [triggersRes, themesRes, emotionalRes, shadowRes] = await Promise.all([
          fetch('/api/user/ai-profile'),
          fetch('/api/user/conversation-themes?days=90'),
          fetch('/api/user/emotional-arc?days=30'),
          fetch('/api/user/shadow-patterns'),
        ]);

        if (triggersRes.ok) {
          const data = await triggersRes.json();
          setTriggers(data.triggers || []);
          setPreferences(data.preferences || []);
        }

        if (themesRes.ok) {
          const data = await themesRes.json();
          setThemes(data.themes || []);
          setInsights(data.storedInsights || []);
        }

        if (emotionalRes.ok) {
          const data = await emotionalRes.json();
          setEmotionalStats(data.statistics || null);
          // Add emotional insights
          if (data.insights) {
            setInsights(prev => [...prev, ...data.insights]);
          }
        }

        if (shadowRes.ok) {
          const data = await shadowRes.json();
          setShadowPatterns(data.patterns || []);
        }
      } catch (error) {
        console.error('Failed to load AI insights:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function updateTriggerResponse(trigger: string, response: string) {
    try {
      await fetch('/api/user/ai-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, preferredResponse: response }),
      });
      setTriggers(prev =>
        prev.map(t => (t.trigger === trigger ? { ...t, preferredResponse: response } : t))
      );
      setEditingTrigger(null);
      setPreferredResponseInput('');
    } catch (error) {
      console.error('Failed to update trigger:', error);
    }
  }

  async function deleteTrigger(trigger: string) {
    if (!confirm(`Remove "${trigger}" from your triggers? This cannot be undone.`)) return;

    try {
      await fetch('/api/user/ai-profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'trigger', trigger }),
      });
      setTriggers(prev => prev.filter(t => t.trigger !== trigger));
    } catch (error) {
      console.error('Failed to delete trigger:', error);
    }
  }

  async function deletePreference(category: string, preference: string) {
    if (!confirm(`Remove this preference? This cannot be undone.`)) return;

    try {
      await fetch('/api/user/ai-profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preference', category, preference }),
      });
      setPreferences(prev =>
        prev.filter(p => !(p.category === category && p.preference === preference))
      );
    } catch (error) {
      console.error('Failed to delete preference:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse text-gray-400">Loading AI insights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="font-serif text-3xl font-light">AI Insights & Learning</h1>
          <p className="text-gray-400">
            What the AI has learned about you through your conversations. You have full control
            over this data.
          </p>
        </div>

        {/* Key Insights Banner */}
        {insights.length > 0 && (
          <div className="p-6 border border-zinc-700 rounded-lg space-y-4">
            <h2 className="text-lg text-white">Patterns the AI Has Noticed</h2>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, i) => (
                <div
                  key={i}
                  className="p-4 bg-zinc-900/50 rounded-lg flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">
                    {insight.strength}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">{insight.insight}</p>
                    <p className="text-sm text-gray-500 mt-1">{insight.insightType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800 pb-4">
          {(['triggers', 'preferences', 'themes', 'emotional', 'shadow'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'triggers' && 'Triggers'}
              {tab === 'preferences' && 'Preferences'}
              {tab === 'themes' && 'Themes'}
              {tab === 'emotional' && 'Emotional'}
              {tab === 'shadow' && 'Deeper Patterns'}
            </button>
          ))}
        </div>

        {/* Triggers Tab */}
        {activeTab === 'triggers' && (
          <div className="space-y-6">
            <div className="text-gray-400 text-sm">
              Topics the AI approaches with extra care. You can customize how you'd like the AI to
              respond when these come up.
            </div>

            {triggers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No triggers detected yet. The AI learns these from your conversations over time.
              </div>
            ) : (
              <div className="space-y-4">
                {triggers.map(trigger => (
                  <div
                    key={trigger.trigger}
                    className="p-6 border border-zinc-700 rounded-lg space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg text-white capitalize">{trigger.trigger}</span>
                          <IntensityBadge intensity={trigger.intensity} />
                        </div>
                        {trigger.context && (
                          <p className="text-sm text-gray-500 mt-1">{trigger.context}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-2">
                          Detected {trigger.occurrenceCount} time
                          {trigger.occurrenceCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTrigger(trigger.trigger)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove trigger"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Preferred Response */}
                    <div className="pt-4 border-t border-zinc-800">
                      <div className="text-sm text-gray-500 mb-2">
                        How would you like the AI to respond when this comes up?
                      </div>
                      {editingTrigger === trigger.trigger ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={preferredResponseInput}
                            onChange={e => setPreferredResponseInput(e.target.value)}
                            placeholder="e.g., Be gentle and offer grounding first"
                            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-gray-600"
                          />
                          <button
                            onClick={() => updateTriggerResponse(trigger.trigger, preferredResponseInput)}
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingTrigger(null);
                              setPreferredResponseInput('');
                            }}
                            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTrigger(trigger.trigger);
                            setPreferredResponseInput(trigger.preferredResponse || '');
                          }}
                          className="text-left w-full p-3 bg-zinc-900/50 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          {trigger.preferredResponse || 'Click to set a preferred response...'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="text-gray-400 text-sm">
              Communication styles and approaches that work well for you, learned from your
              feedback.
            </div>

            {preferences.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No preferences learned yet. The AI picks these up from how you respond to its
                messages.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group by category */}
                {Array.from(new Set(preferences.map(p => p.category))).map(category => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-white capitalize">
                      {category.replace(/-/g, ' ')}
                    </h3>
                    <div className="space-y-2">
                      {preferences
                        .filter(p => p.category === category)
                        .map(pref => (
                          <div
                            key={`${pref.category}-${pref.preference}`}
                            className="p-4 bg-zinc-900/50 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <p className="text-white">{pref.preference}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <StrengthMeter strength={pref.strength} />
                                <span className="text-xs text-gray-500">
                                  {pref.confidence}% confidence
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => deletePreference(pref.category, pref.preference)}
                              className="text-gray-500 hover:text-red-400 transition-colors ml-4"
                              title="Remove preference"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            <div className="text-gray-400 text-sm">
              Topics and themes that come up frequently in your conversations.
            </div>

            {themes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No themes detected yet. Continue using the chat to build your theme profile.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {themes.map(theme => (
                  <div
                    key={theme.theme}
                    className="p-6 border border-zinc-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg text-white capitalize">
                        {theme.theme.replace(/-/g, ' ')}
                      </span>
                      <TrendBadge trend={theme.trend} />
                    </div>
                    <p className="text-sm text-gray-500">
                      Appeared in {theme.count} conversation{theme.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emotional Tab */}
        {activeTab === 'emotional' && (
          <div className="space-y-6">
            <div className="text-gray-400 text-sm">
              Patterns in your emotional journey through conversations.
            </div>

            {!emotionalStats ? (
              <div className="text-center py-12 text-gray-500">
                Not enough conversation data yet to analyze emotional patterns.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Improvement Rate */}
                <div className="p-6 border border-zinc-700 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">
                    Conversations Where You Felt Better
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-light text-white">
                      {emotionalStats.improvementRate}%
                    </div>
                    <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500/70 transition-all"
                        style={{ width: `${emotionalStats.improvementRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mood Patterns */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-6 border border-zinc-700 rounded-lg">
                    <div className="text-sm text-gray-500 mb-4">Common Starting Moods</div>
                    <div className="space-y-2">
                      {emotionalStats.commonStartMoods.map(m => (
                        <div
                          key={m.mood}
                          className="flex items-center justify-between"
                        >
                          <span className="text-white capitalize">{m.mood}</span>
                          <span className="text-gray-500">{m.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 border border-zinc-700 rounded-lg">
                    <div className="text-sm text-gray-500 mb-4">Common Ending Moods</div>
                    <div className="space-y-2">
                      {emotionalStats.commonEndMoods.map(m => (
                        <div
                          key={m.mood}
                          className="flex items-center justify-between"
                        >
                          <span className="text-white capitalize">{m.mood}</span>
                          <span className="text-gray-500">{m.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shadow Patterns Tab */}
        {activeTab === 'shadow' && (
          <div className="space-y-6">
            <div className="p-6 border border-amber-500/30 bg-amber-500/5 rounded-lg">
              <h3 className="text-amber-400 mb-2">About Deeper Patterns</h3>
              <p className="text-sm text-gray-400">
                These are unconscious patterns the AI has noticed across your conversations.
                They're offered as invitations for reflection, not diagnoses. You know yourself
                best - take what resonates and leave what doesn't.
              </p>
            </div>

            {shadowPatterns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No patterns detected yet. These emerge from extended conversations over time.
              </div>
            ) : (
              <div className="space-y-4">
                {shadowPatterns.map((pattern, i) => (
                  <div
                    key={i}
                    className="p-6 border border-zinc-700 rounded-lg space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg text-white capitalize">
                          {pattern.type.replace(/-/g, ' ')}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Noticed {pattern.occurrences} time{pattern.occurrences !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Strength</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div
                              key={i}
                              className={`w-2 h-4 rounded-sm ${
                                i <= pattern.strength
                                  ? pattern.strength >= 7
                                    ? 'bg-amber-500'
                                    : 'bg-zinc-400'
                                  : 'bg-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-900/50 rounded-lg">
                      <p className="text-white italic">"{pattern.insight}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border border-zinc-800 rounded-lg text-sm text-gray-500">
              <p>
                <strong className="text-gray-400">A note on shadow work:</strong> These patterns
                often develop as protections - they served a purpose at some point. The goal
                isn't to eliminate them, but to understand them with compassion and choose more
                consciously.
              </p>
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="p-6 border border-zinc-800 rounded-lg">
          <h3 className="text-white mb-2">Your Data, Your Control</h3>
          <p className="text-sm text-gray-500">
            All of this data is used only to personalize your experience. You can delete any
            trigger or preference at any time. For complete data export or deletion, visit your{' '}
            <Link href="/profile" className="text-white hover:underline">
              profile settings
            </Link>
            .
          </p>
        </div>

        {/* Back to Profile */}
        <div className="text-center pt-4">
          <Link
            href="/profile"
            className="text-gray-500 hover:text-white transition-colors"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTS
// =============================================================================

function IntensityBadge({ intensity }: { intensity: number }) {
  const colors = {
    1: 'bg-green-500/20 text-green-400',
    2: 'bg-yellow-500/20 text-yellow-400',
    3: 'bg-orange-500/20 text-orange-400',
    4: 'bg-red-500/20 text-red-400',
    5: 'bg-red-600/30 text-red-300',
  };

  const labels = {
    1: 'Low',
    2: 'Moderate',
    3: 'Medium',
    4: 'High',
    5: 'Very High',
  };

  const color = colors[intensity as keyof typeof colors] || colors[3];
  const label = labels[intensity as keyof typeof labels] || 'Medium';

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${color}`}>
      {label} Sensitivity
    </span>
  );
}

function StrengthMeter({ strength }: { strength: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= strength ? 'bg-white' : 'bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'increasing' | 'stable' | 'decreasing' }) {
  if (trend === 'increasing') {
    return (
      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        Increasing
      </span>
    );
  }
  if (trend === 'decreasing') {
    return (
      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        Decreasing
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-zinc-700 text-gray-400 text-xs rounded">
      Stable
    </span>
  );
}
