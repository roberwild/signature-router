'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { MessageCircle, Send,  Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addAdminMessage } from '~/actions/services/add-admin-message';
import { useConversationPolling } from '~/hooks/use-conversation-polling';
import styles from './message-thread.module.css';

interface AdminConversationSectionProps {
  requestId: string;
  requestStatus: string;
  initialMessages: Array<{
    type: 'user' | 'admin';
    content: string;
    timestamp: string;
    label: string;
  }>;
  locale: string;
  contactName: string;
}

export function AdminConversationSection({
  requestId,
  requestStatus,
  initialMessages,
  locale: _locale,
  contactName
}: AdminConversationSectionProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const previousMessageCountRef = useRef(initialMessages.length);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Use polling to get real-time updates
  useConversationPolling({
    requestId,
    enabled: isPollingEnabled && requestStatus !== 'completed',
    onNewMessages: (newMessages) => {
      setMessages(newMessages);
      
      // Check if there are actually new messages
      if (newMessages.length > previousMessageCountRef.current) {
        setHasNewMessages(true);
        previousMessageCountRef.current = newMessages.length;
        
        // Auto-scroll to bottom for new messages
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    },
    pollingInterval: 3000, // Poll every 3 seconds
  });

  // Update messages when initialMessages change (after router.refresh())
  useEffect(() => {
    setMessages(initialMessages);
    previousMessageCountRef.current = initialMessages.length;
  }, [initialMessages]);

  // Clear new message indicator when scrolled to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
          setHasNewMessages(false);
        }
      }
    };

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener('scroll', handleScroll);
    return () => scrollElement?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending || isPending) return;
    
    const messageToSend = inputMessage;
    setInputMessage(''); // Clear input immediately
    setIsSending(true);
    
    // Add optimistic message update
    const timestamp = new Date().toISOString();
    const optimisticMessage = {
      type: 'admin' as const,
      content: messageToSend,
      timestamp: timestamp,
      label: 'Respuesta del equipo'
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      await addAdminMessage(requestId, messageToSend, requestStatus);
      
      // Wait a moment before refreshing to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      startTransition(() => {
        router.refresh();
      });
      
      toast.success('Respuesta enviada');
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m !== optimisticMessage));
      setInputMessage(messageToSend); // Restore message
      toast.error('Error al enviar la respuesta');
      console.error('Error sending admin message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as React.FormEvent);
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b bg-muted/30 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Conversación con {contactName}</CardTitle>
              <p className="text-xs text-muted-foreground">Historial de mensajes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {requestStatus !== 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPollingEnabled(!isPollingEnabled)}
                className="h-7 px-2"
                title={isPollingEnabled ? 'Desactivar actualizaciones en tiempo real' : 'Activar actualizaciones en tiempo real'}
              >
                {isPollingEnabled ? (
                  <Wifi className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
            {requestStatus === 'completed' && (
              <Badge variant="secondary">Conversación cerrada</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <div className="relative h-[500px] bg-muted/10">
        <div 
          ref={scrollRef}
          className={`absolute inset-0 overflow-y-auto p-4 space-y-3 ${styles.scrollContainer}`}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay mensajes en esta conversación
              </p>
            </div>
          ) : (
            <>
              {/* Date separator for first message */}
              {messages.length > 0 && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-2">
                    {format(new Date(messages[0].timestamp), "dd 'de' MMMM", { locale: es })}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              
              {/* New messages indicator */}
              {hasNewMessages && (
                <div className="sticky top-0 z-10 flex justify-center py-2">
                  <Badge variant="default" className="animate-pulse">
                    Nuevos mensajes
                  </Badge>
                </div>
              )}
              
              {/* Messages */}
              {messages.map((msg, index) => {
                const showDateSeparator = index > 0 && 
                  new Date(msg.timestamp).toDateString() !== 
                  new Date(messages[index - 1].timestamp).toDateString();
                
                return (
                  <div key={`msg-${index}`}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground px-2">
                          {format(new Date(msg.timestamp), "dd 'de' MMMM", { locale: es })}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    
                    <div className={`flex ${msg.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.type === 'admin' ? 'order-2' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${msg.type === 'admin' ? 'justify-end' : ''}`}>
                          {msg.type === 'user' && (
                            <span className="text-xs font-medium">{contactName}</span>
                          )}
                          {msg.type === 'admin' && (
                            <span className="text-xs font-medium">Tú</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.timestamp), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                        <div className={`
                          px-3 py-2 rounded-2xl shadow-sm
                          ${msg.type === 'admin' 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-background border rounded-bl-sm'
                          }
                        `}>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator when sending */}
              {isSending && (
                <div className="flex justify-end">
                  <div className="max-w-[70%]">
                    <div className="px-3 py-2 bg-primary/80 rounded-2xl rounded-br-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      {requestStatus !== 'completed' ? (
        <CardContent className="border-t p-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 p-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe una respuesta..."
                disabled={isSending || isPending}
                className="border-0 bg-muted/50 focus-visible:ring-1"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!inputMessage.trim() || isSending || isPending}
              className="rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      ) : (
        <CardContent className="border-t bg-muted/30 py-3">
          <p className="text-center text-sm text-muted-foreground">
            Esta conversación ha sido cerrada
          </p>
        </CardContent>
      )}
    </Card>
  );
}