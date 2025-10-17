'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface PartialDraftViewerProps {
  content: string;
  wordCount: number;
  targetWordCount?: number;
}

export default function PartialDraftViewer({
  content,
  wordCount,
  targetWordCount
}: PartialDraftViewerProps) {
  const [showRaw, setShowRaw] = useState(false);

  const progressPercentage = targetWordCount
    ? Math.min((wordCount / targetWordCount) * 100, 100)
    : 0;

  if (!content) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Rascunho em Tempo Real</h3>
        <p className="text-gray-500 text-sm">Aguardando o início da escrita...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">📝 Rascunho em Tempo Real</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            {wordCount} palavras
            {targetWordCount && ` / ${targetWordCount}`}
          </span>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {showRaw ? '📖 Renderizado' : '📄 Markdown'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {targetWordCount && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progressPercentage.toFixed(1)}% do objetivo de palavras
          </p>
        </div>
      )}

      {/* Content Display */}
      <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {showRaw ? (
          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
            {content}
          </pre>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="mt-3 flex items-center space-x-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-xs text-gray-600">Atualizando em tempo real</span>
      </div>
    </div>
  );
}
