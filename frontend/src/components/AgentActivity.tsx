'use client';

import { AgentUpdate } from '@/types/story';

interface AgentActivityProps {
  updates: AgentUpdate[];
}

const agentEmojis: Record<string, string> = {
  'orchestrator': '🎭',
  'plot-architect': '📐',
  'character-designer': '👥',
  'style-master': '🎨',
  'writer': '✍️',
  'consistency-validator': '🔍',
  'literary-critic': '⭐',
  'editor': '📝',
};

export default function AgentActivity({ updates }: AgentActivityProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade dos Agentes</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <p className="text-gray-500 text-sm">Aguardando início...</p>
        ) : (
          updates.map((update, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
              <span className="text-2xl">{agentEmojis[update.name] || '🤖'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 capitalize">
                    {update.name.replace('-', ' ')}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      update.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : update.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {update.status}
                  </span>
                </div>
                {update.message && (
                  <p className="text-sm text-gray-600 mt-1">{update.message}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
