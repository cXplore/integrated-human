'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Play, Square, ChevronRight, MessageCircle, Award, AlertTriangle } from 'lucide-react';

interface Simulation {
  id: string;
  title: string;
  description: string;
  role: string;
  targetSkills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxTurns: number;
  scenario?: string;
}

interface Turn {
  role: 'user' | 'simulation';
  content: string;
  timestamp: string;
  evaluation?: {
    skillsShown: string[];
    effectiveness: number;
    feedback: string;
    suggestions?: string[];
  };
}

interface FinalResult {
  overall: number;
  level: string;
  result: 'pass' | 'needs-depth' | 'try-again';
  feedback: string;
  overallSkillsShown: Record<string, number>;
  breakthroughMoments: string[];
  areasForPractice: string[];
}

interface Props {
  simulationId?: string;
  skill?: string;
  onComplete?: (result: FinalResult) => void;
}

export default function SimulationChat({ simulationId, skill, onComplete }: Props) {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    simulation: Simulation;
    turns: Turn[];
  } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSimulations();
  }, [skill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.turns]);

  async function loadSimulations() {
    try {
      const params = new URLSearchParams();
      if (skill) params.set('skill', skill);

      const res = await fetch(`/api/verification/simulation?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSimulations(data.simulations);

        // If specific simulation requested, start it
        if (simulationId) {
          const found = data.simulations.find((s: Simulation) => s.id === simulationId);
          if (found) startSimulation(found.id);
        }
      }
    } catch (error) {
      console.error('Failed to load simulations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startSimulation(simId: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/verification/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          simulationId: simId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSession({
          sessionId: data.sessionId,
          simulation: data.simulation,
          turns: [{ role: 'simulation', content: data.firstTurn, timestamp: new Date().toISOString() }],
        });
      }
    } catch (error) {
      console.error('Failed to start simulation:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!activeSession || !message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setSending(true);

    // Optimistically add user message
    setActiveSession(prev => prev ? {
      ...prev,
      turns: [...prev.turns, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }],
    } : null);

    try {
      const res = await fetch('/api/verification/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'continue',
          sessionId: activeSession.sessionId,
          message: userMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Update user turn with evaluation
        setActiveSession(prev => {
          if (!prev) return null;
          const turns = [...prev.turns];
          const lastUserTurn = turns.findLastIndex(t => t.role === 'user');
          if (lastUserTurn !== -1) {
            turns[lastUserTurn] = { ...turns[lastUserTurn], evaluation: data.turnEvaluation };
          }
          // Add simulation response
          turns.push({ role: 'simulation', content: data.response, timestamp: new Date().toISOString() });
          return { ...prev, turns };
        });

        if (data.isComplete && data.finalResult) {
          setFinalResult(data.finalResult);
          onComplete?.(data.finalResult);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }

  async function endEarly() {
    if (!activeSession) return;

    setSending(true);
    try {
      const res = await fetch('/api/verification/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          sessionId: activeSession.sessionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFinalResult(data.finalResult);
        onComplete?.(data.finalResult);
      }
    } catch (error) {
      console.error('Failed to end simulation:', error);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setActiveSession(null);
    setFinalResult(null);
    setMessage('');
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
        <div className="h-48 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  // Final result display
  if (finalResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-zinc-100">
            Practice Complete
          </h3>
          <button onClick={reset} className="text-sm text-zinc-400 hover:text-zinc-200">
            Try another
          </button>
        </div>

        {/* Overall Score */}
        <div className={`p-6 rounded-lg border ${
          finalResult.result === 'pass'
            ? 'bg-green-900/20 border-green-700/50'
            : 'bg-amber-900/20 border-amber-700/50'
        }`}>
          <div className="flex items-center gap-4">
            <Award className={`w-12 h-12 ${
              finalResult.result === 'pass' ? 'text-green-400' : 'text-amber-400'
            }`} />
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-zinc-100">
                  {finalResult.overall}%
                </span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  finalResult.result === 'pass'
                    ? 'bg-green-600/30 text-green-300'
                    : 'bg-amber-600/30 text-amber-300'
                }`}>
                  {finalResult.level}
                </span>
              </div>
              <p className="text-zinc-300 mt-1">{finalResult.feedback}</p>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="bg-zinc-800/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-4">Skills Demonstrated</h4>
          <div className="grid gap-3">
            {Object.entries(finalResult.overallSkillsShown).map(([skill, score]) => (
              <div key={skill}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400 capitalize">{skill.replace(/-/g, ' ')}</span>
                  <span className="text-zinc-200">{score}%</span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      score >= 60 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakthrough Moments */}
        {finalResult.breakthroughMoments.length > 0 && (
          <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-400 mb-2">
              Breakthrough Moments
            </h4>
            <ul className="text-sm text-zinc-300 space-y-2">
              {finalResult.breakthroughMoments.slice(0, 3).map((moment, i) => (
                <li key={i} className="pl-3 border-l-2 border-green-600">
                  "{moment.slice(0, 150)}..."
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Practice */}
        {finalResult.areasForPractice.length > 0 && (
          <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-amber-400 mb-2">
              Continue Practicing
            </h4>
            <ul className="text-sm text-zinc-300">
              {finalResult.areasForPractice.map((area, i) => (
                <li key={i}>• {area}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={reset}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
        >
          Practice Another Scenario
        </button>
      </div>
    );
  }

  // Simulation selection
  if (!activeSession) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">
            Practice Conversations
          </h3>
          <p className="text-zinc-400 text-sm">
            Practice difficult conversations in a safe space.
            The AI will play a role, and you'll get feedback on each response.
          </p>
        </div>

        <div className="grid gap-4">
          {simulations.map((sim) => (
            <button
              key={sim.id}
              onClick={() => startSimulation(sim.id)}
              className="text-left p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-amber-400" />
                    <h4 className="font-medium text-zinc-100 group-hover:text-white">
                      {sim.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      sim.difficulty === 'beginner'
                        ? 'bg-green-900/50 text-green-300'
                        : sim.difficulty === 'intermediate'
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-red-900/50 text-red-300'
                    }`}>
                      {sim.difficulty}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">
                    {sim.description}
                  </p>
                  <div className="flex gap-2">
                    {sim.targetSkills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-0.5 rounded">
                        {skill.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <Play className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Active conversation
  return (
    <div className="flex flex-col h-[600px] bg-zinc-900/50 border border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800/50">
        <div>
          <h4 className="font-medium text-zinc-100">{activeSession.simulation.title}</h4>
          <p className="text-xs text-zinc-500">
            Turn {Math.floor(activeSession.turns.length / 2) + 1} of {activeSession.simulation.maxTurns}
          </p>
        </div>
        <button
          onClick={endEarly}
          disabled={sending}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
        >
          <Square className="w-4 h-4" />
          End & Get Feedback
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scenario context */}
        {activeSession.simulation.scenario && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-400 italic">
            {activeSession.simulation.scenario}
          </div>
        )}

        {activeSession.turns.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${turn.role === 'user' ? 'order-2' : ''}`}>
              <div className={`rounded-lg p-3 ${
                turn.role === 'user'
                  ? 'bg-amber-600/20 border border-amber-600/30 text-zinc-100'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
              </div>

              {/* Turn feedback */}
              {turn.evaluation && (
                <div className="mt-2 p-2 bg-zinc-800/50 rounded text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      turn.evaluation.effectiveness >= 60 ? 'text-green-400' : 'text-amber-400'
                    }`}>
                      {turn.evaluation.effectiveness}%
                    </span>
                    {turn.evaluation.skillsShown.length > 0 && (
                      <span className="text-zinc-500">
                        {turn.evaluation.skillsShown.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400">{turn.evaluation.feedback}</p>
                  {turn.evaluation.suggestions && turn.evaluation.suggestions.length > 0 && (
                    <p className="text-amber-400/80">
                      Tip: {turn.evaluation.suggestions[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-700 bg-zinc-800/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your response..."
            className="flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !message.trim()}
            className="p-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
