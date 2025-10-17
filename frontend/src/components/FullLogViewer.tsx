'use client';

import { useState } from 'react';
import { WebSocketMessage } from '@/types/story';

interface FullLogViewerProps {
  messages: WebSocketMessage[];
}

export default function FullLogViewer({ messages }: FullLogViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    return msg.type === filter;
  });

  const messageTypes = Array.from(new Set(messages.map(m => m.type)));

  const getMessageColor = (type: string) => {
    const colors: Record<string, string> = {
      'connection': 'bg-gray-100 border-gray-300',
      'agent_update': 'bg-blue-100 border-blue-300',
      'agent_prompt': 'bg-yellow-100 border-yellow-300',
      'agent_response': 'bg-green-100 border-green-300',
      'progress': 'bg-purple-100 border-purple-300',
      'partial_draft': 'bg-pink-100 border-pink-300',
      'validation': 'bg-orange-100 border-orange-300',
      'validation_issue': 'bg-red-100 border-red-300',
      'final': 'bg-emerald-100 border-emerald-300',
      'error': 'bg-red-200 border-red-400',
      'broadcast': 'bg-indigo-100 border-indigo-300',
    };
    return colors[type] || 'bg-gray-100 border-gray-300';
  };

  const getMessageIcon = (type: string) => {
    const icons: Record<string, string> = {
      'connection': '🔌',
      'agent_update': '🤖',
      'agent_prompt': '📤',
      'agent_response': '📥',
      'progress': '⏱️',
      'partial_draft': '📝',
      'validation': '✅',
      'validation_issue': '⚠️',
      'final': '🎉',
      'error': '❌',
      'broadcast': '📡',
    };
    return icons[type] || '📋';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Log Completo de Mensagens</h3>
            <p className="text-sm text-gray-600">{messages.length} mensagens recebidas</p>
          </div>
        </div>
        <button className="text-2xl text-gray-400 hover:text-gray-600">
          {isExpanded ? '📖' : '📕'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Filter Bar */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({messages.length})
            </button>
            {messageTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getMessageIcon(type)} {type} ({messages.filter(m => m.type === type).length})
              </button>
            ))}
          </div>

          {/* Messages Timeline */}
          <div className="space-y-3 max-h-[800px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Nenhuma mensagem com este filtro</p>
              </div>
            ) : (
              filteredMessages.map((message, index) => (
                <details key={index} className={`border-2 rounded-lg overflow-hidden ${getMessageColor(message.type)}`}>
                  <summary className="p-3 cursor-pointer hover:bg-opacity-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{getMessageIcon(message.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-900">{message.type}</span>
                            {message.agent && (
                              <span className="ml-2 text-sm text-gray-600">
                                → {message.agent}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {message.timestamp 
                              ? new Date(message.timestamp * 1000).toLocaleTimeString('pt-BR')
                              : new Date().toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        {message.message && (
                          <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                        )}
                        {message.phase && (
                          <p className="text-xs text-gray-600 mt-1">
                            Fase: {message.phase} | Iteração: {message.iteration}/{message.max_iterations}
                          </p>
                        )}
                      </div>
                    </div>
                  </summary>

                  <div className="bg-white p-4 border-t-2">
                    <pre className="text-xs whitespace-pre-wrap break-words overflow-x-auto bg-gray-50 p-3 rounded">
                      {JSON.stringify(message, null, 2)}
                    </pre>
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
