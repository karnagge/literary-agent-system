'use client';

import { useState } from 'react';
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade dos Agentes</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <p className="text-gray-500 text-sm">Aguardando início...</p>
        ) : (
          updates.map((update, index) => {
            const isExpanded = expandedIndex === index;
            const hasDetails = update.prompt || update.response || update.reasoning;

            return (
              <div key={index} className="bg-gray-50 rounded-md overflow-hidden">
                <div
                  className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => hasDetails && toggleExpand(index)}
                >
                  <span className="text-2xl">{agentEmojis[update.name] || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 capitalize">
                        {update.name.replace('-', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
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
                        {hasDetails && (
                          <button className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                      </div>
                    </div>
                    {update.message && (
                      <p className="text-sm text-gray-600 mt-1">{update.message}</p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-200 bg-white">
                    {update.reasoning && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-700 mb-1">💡 Reasoning:</div>
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          {update.reasoning}
                        </div>
                      </div>
                    )}

                    {update.prompt && (
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">📤 Prompt Sent:</div>
                        <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                          {truncateText(update.prompt, 500)}
                        </div>
                      </div>
                    )}

                    {update.response && (
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">📥 Response Received:</div>
                        <div className="text-xs text-gray-600 bg-green-50 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {truncateText(update.response, 500)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
