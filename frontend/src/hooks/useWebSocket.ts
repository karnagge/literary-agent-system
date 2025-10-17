import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage, AgentUpdate } from '@/types/story';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useWebSocket(sessionId: string | null) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState<number>(0);
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

  return { messages, agentUpdates, isConnected, progress };
}
