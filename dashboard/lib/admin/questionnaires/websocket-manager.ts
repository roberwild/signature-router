'use client';

import { useEffect, useRef, useCallback } from 'react';

export type WebSocketMessage = {
  type: 'metrics_update' | 'new_completion' | 'session_started' | 'session_ended';
  data: unknown;
};

export function useWebSocket(
  url: string,
  onMessage: (message: WebSocketMessage) => void,
  reconnectInterval: number = 5000
) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      ws.current = new WebSocket(`${wsUrl}${url}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect...');
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, reconnectInterval);
    }
  }, [url, onMessage, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return { sendMessage };
}

export function useQuestionnaireWebSocket(onUpdate: (data: unknown) => void) {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'metrics_update':
      case 'new_completion':
      case 'session_started':
      case 'session_ended':
        onUpdate(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [onUpdate]);

  return useWebSocket('/admin/questionnaires', handleMessage);
}