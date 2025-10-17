'use client';

import { useState } from 'react';
import { StoryRequest, Genre, TargetAudience, AuthorStyle } from '@/types/story';

interface StoryFormProps {
  onSubmit: (request: StoryRequest) => void;
  isLoading?: boolean;
}

export default function StoryForm({ onSubmit, isLoading = false }: StoryFormProps) {
  const [plot, setPlot] = useState('');
  const [authorStyle, setAuthorStyle] = useState<AuthorStyle>(AuthorStyle.ZAFON);
  const [genre, setGenre] = useState<Genre>(Genre.TERROR);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(TargetAudience.ADULTO);
  const [wordCount, setWordCount] = useState(10000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      plot,
      author_style: authorStyle,
      genre,
      target_audience: targetAudience,
      word_count_target: wordCount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900">Criar Novo Conto</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plot Inicial <span className="text-red-500">*</span>
        </label>
        <textarea
          value={plot}
          onChange={(e) => setPlot(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Descreva a ideia do seu conto... (50-2000 caracteres)"
          required
          minLength={50}
          maxLength={2000}
        />
        <p className="text-sm text-gray-500 mt-1">{plot.length}/2000 caracteres</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Autor</label>
          <select
            value={authorStyle}
            onChange={(e) => setAuthorStyle(e.target.value as AuthorStyle)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(AuthorStyle).map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gênero</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value={Genre.TERROR}>Terror</option>
            <option value={Genre.FICCAO_CIENTIFICA}>Ficção Científica</option>
            <option value={Genre.FANTASIA}>Fantasia</option>
            <option value={Genre.DRAMA}>Drama</option>
            <option value={Genre.ROMANCE}>Romance</option>
            <option value={Genre.MISTERIO}>Mistério</option>
            <option value={Genre.SUSPENSE}>Suspense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Público-Alvo</label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value={TargetAudience.INFANTIL}>Infantil</option>
            <option value={TargetAudience.YOUNG_ADULT}>Young Adult</option>
            <option value={TargetAudience.ADULTO}>Adulto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número de Palavras</label>
          <input
            type="number"
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            min={5000}
            max={15000}
            step={1000}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || plot.length < 50}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {isLoading ? 'Gerando Conto...' : 'Gerar Conto'}
      </button>
    </form>
  );
}
