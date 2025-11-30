'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useNotificationSound } from './use-notification-sound';

interface Message {
  type: 'user' | 'admin';
  content: string;
  timestamp: string;
  label: string;
}

interface UseConversationPollingProps {
  requestId: string;
  enabled: boolean;
  onNewMessages?: (messages: Message[]) => void;
  pollingInterval?: number;
}

export function useConversationPolling({
  requestId,
  enabled,
  onNewMessages,
  pollingInterval = 3000, // Poll every 3 seconds
}: UseConversationPollingProps) {
  const lastUpdatedRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstFetchRef = useRef(true);
  const { playNotification } = useNotificationSound();

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/services/${requestId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      
      // Check if there are new messages
      if (lastUpdatedRef.current && data.lastUpdated !== lastUpdatedRef.current) {
        // Not the first fetch and there are updates
        if (!isFirstFetchRef.current && onNewMessages) {
          onNewMessages(data.messages);
          
          // Find the newest message to show notification
          const sortedMessages = [...data.messages].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          const newestMessage = sortedMessages[0];
          if (newestMessage && new Date(newestMessage.timestamp).getTime() > new Date(lastUpdatedRef.current).getTime()) {
            // Play notification sound
            playNotification();
            
            // Show notification for new message
            if (newestMessage.type === 'admin') {
              toast.info('Nueva respuesta del equipo', {
                description: newestMessage.content.substring(0, 50) + '...',
              });
            } else {
              toast.info('Nuevo mensaje del cliente', {
                description: newestMessage.content.substring(0, 50) + '...',
              });
            }
          }
        }
      }
      
      lastUpdatedRef.current = data.lastUpdated;
      isFirstFetchRef.current = false;
      
      return data.messages;
    } catch (error) {
      console.error('Error polling messages:', error);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- playNotification would cause unnecessary polling restarts
  }, [requestId, onNewMessages]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchMessages();

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchMessages();
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, fetchMessages, pollingInterval]);

  return { refetch: fetchMessages };
}