'use client';

import ReactMarkdown from 'react-markdown';

interface StoryViewerProps {
  content: string;
  wordCount?: number;
}

export default function StoryViewer({ content, wordCount }: StoryViewerProps) {
  const calculatedWordCount = content.split(/\s+/).length;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Conto Gerado</h2>
        <div className="text-sm text-gray-600">
          {wordCount || calculatedWordCount} palavras
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-4">
        <button
          onClick={() => {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'conto.txt';
            a.click();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Download .txt
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(content)}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Copiar
        </button>
      </div>
    </div>
  );
}
