'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Plus, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Input } from '@workspace/ui/components/input';

interface Conversation {
  id: string;
  title: string;
  summary?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  currentConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
        
        if (currentConversationId === conversationId) {
          onNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok) {
        const _updated = await response.json();
        setConversations(prev => 
          prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  const _formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {
      'Hoy': [],
      'Ayer': [],
      'Últimos 7 días': [],
      'Últimos 30 días': [],
      'Más antiguas': [],
    };

    const now = new Date();
    
    conversations.forEach(conv => {
      const date = new Date(conv.lastMessageAt || conv.updatedAt);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        groups['Hoy'].push(conv);
      } else if (diffDays === 1) {
        groups['Ayer'].push(conv);
      } else if (diffDays < 7) {
        groups['Últimos 7 días'].push(conv);
      } else if (diffDays < 30) {
        groups['Últimos 30 días'].push(conv);
      } else {
        groups['Más antiguas'].push(conv);
      }
    });

    return Object.entries(groups).filter(([_, convs]) => convs.length > 0);
  };

  return (
    <div className="w-64 bg-muted/50 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button
          onClick={onNewConversation}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva conversación
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Cargando conversaciones...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No hay conversaciones
          </div>
        ) : (
          <div className="p-2">
            {groupConversationsByDate(conversations).map(([group, groupConversations]) => (
              <div key={group} className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {group}
                </div>
                {groupConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors",
                      currentConversationId === conversation.id && "bg-muted"
                    )}
                  >
                    {editingId === conversation.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          handleRenameConversation(conversation.id, editingTitle);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameConversation(conversation.id, editingTitle);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                      />
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => onSelectConversation(conversation)}
                        >
                          <div className="text-sm truncate">
                            {conversation.title}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(conversation.id);
                              setEditingTitle(conversation.title);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(conversation.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La conversación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => conversationToDelete && handleDeleteConversation(conversationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}