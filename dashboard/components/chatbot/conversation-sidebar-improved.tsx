'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2,
  ChevronDown,
  Trash 
} from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';

interface Conversation {
  id: string;
  title: string;
  summary?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationSidebarImprovedProps {
  currentConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  conversations: Conversation[];
  loading?: boolean;
}

export function ConversationSidebarImproved({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  conversations,
  loading = false,
}: ConversationSidebarImprovedProps) {
  const [localConversations, setLocalConversations] = useState<Conversation[]>(conversations);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Hoy', 'Ayer']));

  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  const handleDeleteConversation = async (conversationId: string) => {
    if (onDeleteConversation) {
      await onDeleteConversation(conversationId);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } else {
      // Fallback to direct API call if no handler provided
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setLocalConversations(prev => prev.filter(c => c.id !== conversationId));
          setDeleteDialogOpen(false);
          setConversationToDelete(null);
          
          if (currentConversationId === conversationId) {
            onNewConversation();
          }
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const handleDeleteAllConversations = async () => {
    try {
      // Use bulk delete endpoint for efficiency
      const response = await fetch('/api/conversations/v2/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteAll: true }),
      });
      
      if (response.ok) {
        setLocalConversations([]);
        setDeleteAllDialogOpen(false);
        
        // Create a new conversation after deleting all
        onNewConversation();
      } else {
        console.error('Failed to delete all conversations');
      }
    } catch (error) {
      console.error('Error deleting all conversations:', error);
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
        setLocalConversations(prev => 
          prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
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

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="w-[260px] border-r bg-sidebar flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none p-3 border-b space-y-2">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start"
          variant="secondary"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva conversación
        </Button>
        {localConversations.length > 0 && (
          <Button
            onClick={() => setDeleteAllDialogOpen(true)}
            className="w-full justify-start text-destructive hover:text-destructive"
            variant="ghost"
            size="sm"
          >
            <Trash className="h-4 w-4 mr-2" />
            Eliminar todas
          </Button>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Cargando conversaciones...
          </div>
        ) : localConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No hay conversaciones anteriores
          </div>
        ) : (
          <div className="py-2">
            {groupConversationsByDate(localConversations).map(([group, groupConversations]) => (
              <Collapsible
                key={group}
                open={expandedGroups.has(group)}
                onOpenChange={() => toggleGroup(group)}
              >
                <CollapsibleTrigger className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground w-full">
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    !expandedGroups.has(group) && "-rotate-90"
                  )} />
                  <span>{group}</span>
                  <span className="ml-auto text-[10px] opacity-60">
                    {groupConversations.length}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-2 space-y-1">
                    {groupConversations.map(conversation => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors",
                          currentConversationId === conversation.id && "bg-sidebar-accent text-sidebar-accent-foreground"
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
                            className="h-6 text-xs"
                            autoFocus
                          />
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => onSelectConversation(conversation)}
                            >
                              <div className="text-xs truncate">
                                {conversation.title}
                              </div>
                            </div>
                            {/* Quick action buttons on hover */}
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-sidebar-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(conversation.id);
                                  setEditingTitle(conversation.title);
                                }}
                                title="Renombrar"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversationToDelete(conversation.id);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
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

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar todas las conversaciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Todas las conversaciones ({localConversations.length}) serán eliminadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConversations}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}