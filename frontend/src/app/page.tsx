'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StoryForm from '@/components/StoryForm';
import ProgressTracker from '@/components/ProgressTracker';
import AgentActivity from '@/components/AgentActivity';
import StoryViewer from '@/components/StoryViewer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { StoryRequest } from '@/types/story';

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalStory, setFinalStory] = useState<string | null>(null);
  const router = useRouter();

  const { messages, agentUpdates, isConnected, progress } = useWebSocket(sessionId);

  const handleGenerateStory = async (request: StoryRequest) => {
    try {
      setIsGenerating(true);
      const response = await api.generateStory(request);
      setSessionId(response.session_id);
    } catch (error) {
      console.error('Error generating story:', error);
      alert('Erro ao gerar conto. Verifique se o backend está rodando.');
      setIsGenerating(false);
    }
  };

  // Check for final story in messages
  const finalMessage = messages.find((msg) => msg.type === 'final');
  if (finalMessage && !finalStory && finalMessage.data?.final_draft) {
    setFinalStory(finalMessage.data.final_draft);
    setIsGenerating(false);
  }

  const currentPhase = messages.filter((msg) => msg.type === 'progress').pop()?.phase || 'initiated';
  const currentIteration = messages.filter((msg) => msg.type === 'progress').pop()?.iteration || 0;

  return (
    <div className="space-y-8">
      {!sessionId && !isGenerating ? (
        <StoryForm onSubmit={handleGenerateStory} isLoading={isGenerating} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressTracker
              progress={progress}
              phase={currentPhase}
              iteration={currentIteration}
              maxIterations={10}
            />
            <AgentActivity updates={agentUpdates} />
          </div>

          {finalStory && <StoryViewer content={finalStory} />}

          {isGenerating && !finalStory && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="animate-pulse mb-2">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              </div>
              <p className="text-blue-900 font-medium">Gerando seu conto...</p>
              <p className="text-blue-700 text-sm mt-2">
                {isConnected ? 'Conectado via WebSocket' : 'Conectando...'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
