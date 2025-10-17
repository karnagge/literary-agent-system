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
      setMessages((prev) => [...prev, message]);

      // Handle agent_update: Basic status update
      if (message.type === 'agent_update' && message.agent) {
        setAgentUpdates((prev) => [
          ...prev,
          {
            name: message.agent,
            status: message.status as any,
            message: message.message,
            timestamp: message.timestamp || Date.now(),
          },
        ]);
      }

      // Handle agent_prompt: Agent is about to send a prompt
      if (message.type === 'agent_prompt' && message.agent) {
        setAgentUpdates((prev) => {
          // Find the most recent update for this agent and enrich it
          const newUpdates = [...prev];
          for (let i = newUpdates.length - 1; i >= 0; i--) {
            if (newUpdates[i].name === message.agent) {
              newUpdates[i] = {
                ...newUpdates[i],
                prompt: message.prompt,
                reasoning: message.reasoning,
              };
              break;
            }
          }
          return newUpdates;
        });
      }

      // Handle agent_response: Agent received a response
      if (message.type === 'agent_response' && message.agent) {
        setAgentUpdates((prev) => {
          // Find the most recent update for this agent and enrich it
          const newUpdates = [...prev];
          for (let i = newUpdates.length - 1; i >= 0; i--) {
            if (newUpdates[i].name === message.agent) {
              newUpdates[i] = {
                ...newUpdates[i],
                response: message.response,
              };
              break;
            }
          }
          return newUpdates;
        });
      }

      // Handle partial_draft: Real-time draft content
      if (message.type === 'partial_draft') {
        setPartialDraft({
          content: message.partial_content || '',
          wordCount: message.word_count || 0,
        });
      }

      // Handle validation_issue: Individual issue found
      if (message.type === 'validation_issue') {
        console.log('Validation issue found:', message.issue);
        // You could add these to a separate state for display
      }

      // Handle progress updates
      if (message.type === 'progress' && message.progress_percent !== undefined) {
        setProgress(message.progress_percent);
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
