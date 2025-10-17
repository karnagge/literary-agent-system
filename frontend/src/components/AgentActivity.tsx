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
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedIndices);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIndices(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedIndices(new Set());
    } else {
      setExpandedIndices(new Set(updates.map((_, i) => i)));
    }
    setExpandAll(!expandAll);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">🤖 Comunicação dos Agentes</h3>
        {updates.length > 0 && (
          <button
            onClick={toggleExpandAll}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {expandAll ? '📕 Colapsar Tudo' : '📖 Expandir Tudo'}
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-sm">Aguardando início da geração...</p>
          </div>
        ) : (
          updates.map((update, index) => {
            const isExpanded = expandedIndices.has(index);
            const hasDetails = update.prompt || update.response || update.reasoning;

            return (
              <div 
                key={index} 
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200'
                }`}
              >
                {/* Header Card */}
                <div
                  className={`flex items-start space-x-3 p-4 cursor-pointer transition-colors ${
                    isExpanded ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => hasDetails && toggleExpand(index)}
                >
                  <span className="text-3xl">{agentEmojis[update.name] || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-bold text-gray-900 text-base capitalize">
                          {update.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(update.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            update.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : update.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : update.status === 'starting'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {update.status === 'starting' ? '🚀 Iniciando' :
                           update.status === 'completed' ? '✅ Completo' :
                           update.status === 'failed' ? '❌ Falhou' :
                           '⚙️ Executando'}
                        </span>
                        {hasDetails && (
                          <button className="text-lg text-gray-400 hover:text-gray-600 transition-colors">
                            {isExpanded ? '📖' : '📕'}
                          </button>
                        )}
                      </div>
                    </div>
                    {update.message && (
                      <p className="text-sm text-gray-700 font-medium">{update.message}</p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <div className="bg-white border-t-2 border-gray-200">
                    {/* Reasoning Section */}
                    {update.reasoning && (
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">💡</span>
                          <span className="text-sm font-bold text-gray-900">Por que este agente foi chamado:</span>
                        </div>
                        <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {update.reasoning}
                        </div>
                      </div>
                    )}

                    {/* Prompt Section */}
                    {update.prompt && (
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">📤</span>
                            <span className="text-sm font-bold text-gray-900">Prompt Enviado ao LLM:</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {update.prompt.length.toLocaleString('pt-BR')} caracteres
                          </span>
                        </div>
                        <div className="text-xs text-gray-800 bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-h-96 overflow-y-auto font-mono whitespace-pre-wrap">
                          {update.prompt}
                        </div>
                      </div>
                    )}

                    {/* Response Section */}
                    {update.response && (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">📥</span>
                            <span className="text-sm font-bold text-gray-900">Resposta Recebida do LLM:</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {update.response.length.toLocaleString('pt-BR')} caracteres
                          </span>
                        </div>
                        <div className="text-xs text-gray-800 bg-green-50 p-4 rounded-lg border border-green-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
                          {update.response}
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
