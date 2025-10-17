import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage, AgentUpdate } from '@/types/story';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useWebSocket(sessionId: string | null) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [partialDraft, setPartialDraft] = useState<{ content: string; wordCount: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      setMessages((prev) => [...prev, message]);

      // Handle broadcast messages (unwrap the data)
      let actualMessage = message;
      if (message.type === 'broadcast' && message.data) {
        actualMessage = { ...message.data, type: message.data.type || message.type };
      }

      // Handle agent_update: Basic status update
      if (actualMessage.type === 'agent_update' && actualMessage.agent) {
        setAgentUpdates((prev) => [
          ...prev,
          {
            name: actualMessage.agent,
            status: actualMessage.status as any,
            message: actualMessage.message,
            timestamp: actualMessage.timestamp || Date.now(),
          },
        ]);
      }

      // Handle agent_prompt: Agent is about to send a prompt
      if (actualMessage.type === 'agent_prompt' && actualMessage.agent) {
        setAgentUpdates((prev) => {
          // Find the most recent update for this agent and enrich it
          const newUpdates = [...prev];
          for (let i = newUpdates.length - 1; i >= 0; i--) {
            if (newUpdates[i].name === actualMessage.agent) {
              newUpdates[i] = {
                ...newUpdates[i],
                prompt: actualMessage.prompt,
                reasoning: actualMessage.reasoning,
              };
              break;
            }
          }
          return newUpdates;
        });
      }

      // Handle agent_response: Agent received a response
      if (actualMessage.type === 'agent_response' && actualMessage.agent) {
        setAgentUpdates((prev) => {
          // Find the most recent update for this agent and enrich it
          const newUpdates = [...prev];
          for (let i = newUpdates.length - 1; i >= 0; i--) {
            if (newUpdates[i].name === actualMessage.agent) {
              newUpdates[i] = {
                ...newUpdates[i],
                response: actualMessage.response,
              };
              break;
            }
          }
          return newUpdates;
        });
      }

      // Handle partial_draft: Real-time draft content
      if (actualMessage.type === 'partial_draft') {
        setPartialDraft({
          content: actualMessage.partial_content || '',
          wordCount: actualMessage.word_count || 0,
        });
      }

      // Handle validation_issue: Individual issue found
      if (actualMessage.type === 'validation_issue') {
        console.log('Validation issue found:', actualMessage.issue);
        // You could add these to a separate state for display
      }

      // Handle progress updates
      if (actualMessage.type === 'progress' && actualMessage.progress_percent !== undefined) {
        setProgress(actualMessage.progress_percent);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  return { messages, agentUpdates, isConnected, progress, partialDraft };
}
