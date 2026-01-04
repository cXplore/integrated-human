'use client';

import { useState } from 'react';
import { MessageCircle, FileText } from 'lucide-react';
import { SkillDemo, SimulationChat } from '@/app/components/verification';

type Tab = 'scenarios' | 'conversations';

export default function PracticeContent() {
  const [activeTab, setActiveTab] = useState<Tab>('scenarios');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-lg">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'scenarios'
              ? 'bg-amber-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
          }`}
        >
          <FileText className="w-5 h-5" />
          Skill Scenarios
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'conversations'
              ? 'bg-amber-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          Practice Conversations
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        {activeTab === 'scenarios' ? (
          <SkillDemo />
        ) : (
          <SimulationChat />
        )}
      </div>

      {/* Info Section */}
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">
          How Practice Works
        </h3>
        <ul className="text-sm text-zinc-500 space-y-2">
          <li>
            <strong className="text-zinc-400">Skill Scenarios:</strong> Read a situation and write out how you would respond. Get detailed feedback on your approach against a professional rubric.
          </li>
          <li>
            <strong className="text-zinc-400">Practice Conversations:</strong> Have a real-time conversation with an AI playing different roles (anxious partner, critical parent, etc.). Get feedback on each turn.
          </li>
          <li>
            <strong className="text-zinc-400">No wrong answers:</strong> This is practice. The feedback helps you grow - it's not a test. Try different approaches and see what works.
          </li>
        </ul>
      </div>
    </div>
  );
}
