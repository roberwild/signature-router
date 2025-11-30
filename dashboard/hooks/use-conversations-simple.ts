'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Conversation {
  id: string;
  title: string;
  summary?: string | null;
  sessionId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  metadata?: unknown;
  createdAt: string;
}

interface UseConversationsProps {
  organizationId: string;
  organizationSlug?: string;
  userId?: string;
}

export function useConversationsSimple({ organizationId }: UseConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/conversations/simple');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createConversation = useCallback(async (title?: string, sessionId?: string) => {
    if (!organizationId) return null;
    
    try {
      const response = await fetch('/api/conversations/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          sessionId,
          organizationId 
        }),
      });

      if (response.ok) {
        const newConversation = await response.json();
        setCurrentConversation(newConversation);
        setMessages([]);
        await fetchConversations();
        return newConversation;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
    return null;
  }, [fetchConversations, organizationId]);

  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: unknown
  ) => {
    if (!conversationId) return null;
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, content, metadata, organizationId }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        
        // Update conversation title if it's the first user message
        if (role === 'user' && messages.length === 0 && currentConversation?.title === 'Nueva conversación') {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          await updateConversation(conversationId, { title });
        }
        
        return newMessage;
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- updateConversation would cause circular dependency
  }, [messages, currentConversation, organizationId]);

  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updates, organizationId }),
      });

      if (response.ok) {
        const updated = await response.json();
        setCurrentConversation(updated);
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? updated : c)
        );
        return updated;
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
    return null;
  }, [organizationId]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}?organizationId=${organizationId}`);
      if (response.ok) {
        const { conversation, messages } = await response.json();
        setCurrentConversation(conversation);
        setMessages(messages);
        return { conversation, messages };
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }, [organizationId]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}?organizationId=${organizationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        return true;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
    return false;
  }, [currentConversation, organizationId]);

  // Initialize conversation on mount
  useEffect(() => {
    if (!initialized && organizationId && !loading) {
      setInitialized(true);
      fetchConversations().then(() => {
        // If no conversations, create one
        if (conversations.length === 0 && !currentConversation) {
          createConversation('Nueva conversación');
        }
      });
    }
  }, [initialized, organizationId, loading, fetchConversations, createConversation, conversations.length, currentConversation]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    fetchConversations,
    loadConversation,
    createConversation,
    addMessage,
    updateConversation,
    deleteConversation,
    setCurrentConversation,
    setMessages,
  };
}