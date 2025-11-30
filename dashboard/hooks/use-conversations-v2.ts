'use client';

import { useState, useEffect, useCallback } from 'react';

interface Conversation {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  sessionId: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date | string;
}

export function useConversationsV2({
  organizationId,
  userId: _userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/v2?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string, sessionId?: string) => {
    try {
      const response = await fetch('/api/conversations/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Nueva conversación',
          sessionId: sessionId || `session-${Date.now()}`,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const newConversation = await response.json();
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      return null;
    }
  }, [organizationId]);

  // Update a conversation
  const updateConversation = useCallback(async (
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title' | 'isArchived' | 'isActive'>>
  ) => {
    try {
      const response = await fetch(`/api/conversations/v2/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation');
      }

      const updatedConversation = await response.json();
      setConversations(prev =>
        prev.map(conv => conv.id === conversationId ? updatedConversation : conv)
      );
      return updatedConversation;
    } catch (err) {
      console.error('Error updating conversation:', err);
      setError('Failed to update conversation');
      return null;
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/v2/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      return true;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
      return false;
    }
  }, []);

  // Archive a conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    return updateConversation(conversationId, { isArchived: true });
  }, [updateConversation]);

  // Clear all conversations (archive all)
  const clearConversations = useCallback(async () => {
    try {
      const promises = conversations
        .filter(conv => !conv.isArchived)
        .map(conv => archiveConversation(conv.id));
      
      await Promise.all(promises);
      return true;
    } catch (err) {
      console.error('Error clearing conversations:', err);
      setError('Failed to clear conversations');
      return false;
    }
  }, [conversations, archiveConversation]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/conversations/v2/${conversationId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }, []);

  // Add a message to a conversation
  const addMessage = useCallback(async (
    conversationId: string,
    content: string,
    role: 'user' | 'assistant' | 'system'
  ): Promise<Message | null> => {
    try {
      const response = await fetch(`/api/conversations/v2/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message');
      }

      const newMessage = await response.json();
      
      // Update the conversation's updatedAt in local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, updatedAt: new Date() }
            : conv
        )
      );

      return newMessage;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    clearConversations,
    fetchMessages,
    addMessage,
    refetch: fetchConversations,
  };
}