'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot,
  Sparkles,
  Loader2,
  Bug,
  Minimize2,
  ArrowLeft,
  Menu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { useRouter } from 'next/navigation';
import { ConversationSidebarImproved } from './conversation-sidebar-improved';
import { useConversationsSimple, type Conversation } from '@/hooks/use-conversations-simple';

interface ServicesChatbotWithSidebarProps {
  organizationId?: string;
  organizationSlug: string;
  organizationName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export function ServicesChatbotWithSidebar({ 
  organizationId, 
  organizationSlug,
  organizationName,
  userId,
  userName,
  userEmail
}: ServicesChatbotWithSidebarProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const {
    conversations,
    currentConversation,
    messages,
    loading: conversationsLoading,
    loadConversation,
    createConversation,
    addMessage,
    setMessages,
    setCurrentConversation: _setCurrentConversation,
  } = useConversationsSimple({
    organizationId: organizationId || ''
  });

  // Initialize with welcome message when starting new conversation
  const initializeNewConversation = useCallback(async () => {
    const newConversation = await createConversation();
    if (newConversation) {
      const welcomeMessage = {
        id: 'welcome',
        conversationId: newConversation.id,
        role: 'assistant' as const,
        content: '¡Hola! 👋 Soy tu asesor de ciberseguridad de Minery. Estoy aquí para ayudarte a encontrar el servicio perfecto para fortalecer la seguridad de tu organización.\n\n¿En qué puedo ayudarte hoy?',
        metadata: null,
        createdAt: new Date().toISOString(),
      };
      
      await addMessage(newConversation.id, 'assistant', welcomeMessage.content);
    }
    return newConversation;
  }, [createConversation, addMessage]);

  // Initialize on mount - always create a conversation if none exists
  useEffect(() => {
    if (!conversationsLoading && !currentConversation) {
      initializeNewConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentConversation and initializeNewConversation would cause unnecessary re-runs
  }, [conversationsLoading]);

  // Auto-scroll to bottom only if user is not scrolling
  useEffect(() => {
    if (!isUserScrolling && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
        if (isAtBottom || messages.length === 1) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [messages, isUserScrolling]);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;
    
    const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
    setIsUserScrolling(!isNearBottom);
  }, []);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentConversation) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to conversation
    const userMessage = await addMessage(
      currentConversation.id,
      'user',
      userContent
    );

    if (!userMessage) {
      setIsLoading(false);
      return;
    }

    let streamedContent = '';

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userContent,
          sessionId: currentConversation.sessionId,
          conversationId: currentConversation.id,
          organizationId,
          organizationName,
          organizationSlug,
          userId,
          userName,
          userEmail,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream') || !contentType?.includes('application/json')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        // Create temporary message for streaming
        const tempAiMessage = {
          id: `temp-ai-${Date.now()}`,
          conversationId: currentConversation.id,
          role: 'assistant' as const,
          content: '',
          metadata: null,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, tempAiMessage]);

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempAiMessage.id 
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }
        
        // Save the complete AI message to database
        await addMessage(
          currentConversation.id,
          'assistant',
          streamedContent
        );
        
        setIsUserScrolling(false);
      }
    } catch (error) {
      console.error('Chat error:', error);
      await addMessage(
        currentConversation.id,
        'assistant',
        'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.'
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons
  const quickActions = [
    "¿Qué servicio necesito?",
    "Ver precios",
    "Comparar servicios",
    "Contactar ventas"
  ];

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => handleSend(), 100);
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation: Conversation) => {
    await loadConversation(conversation.id);
  };

  // Handle new conversation
  const handleNewConversation = () => {
    initializeNewConversation();
  };

  // Fetch debug info
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/chatbot/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          organizationName,
          organizationSlug,
          userId,
          userName,
          userEmail,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.systemPrompt);
        setShowDebug(true);
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <ConversationSidebarImproved
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          conversations={conversations}
          loading={conversationsLoading}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Asesor de Ciberseguridad</h1>
                  <p className="text-sm text-muted-foreground">Minery Services - {organizationName || 'Tu Organización'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">En línea</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={fetchDebugInfo}
                title="Debug Info"
              >
                <Bug className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => window.open(`/organizations/${organizationSlug}/services`, '_self')}
                title="Volver a servicios"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden" ref={scrollAreaRef}>
          <ScrollArea className="h-full" onScrollCapture={handleScroll}>
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
                      message.role === 'user' ? 'bg-primary' : 'bg-primary/10'
                    )}>
                      {message.role === 'user' ? (
                        <span className="text-sm text-primary-foreground font-medium">TÚ</span>
                      ) : (
                        <Bot className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "flex flex-col gap-1 max-w-[70%]",
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}>
                      <div className={cn(
                        "rounded-lg px-4 py-3",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}>
                        {message.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                li: ({children}) => <li className="mb-1">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                code: ({children}) => <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{children}</code>,
                                pre: ({children}) => <pre className="bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                                a: ({href, children}) => {
                                  const isServiceUrl = href && (
                                    href.includes('minery.io/servicios') || 
                                    href.includes('/services/') ||
                                    children?.toString().toLowerCase().includes('más información')
                                  );
                                  
                                  if (isServiceUrl) {
                                    const fullUrl = href?.startsWith('/') 
                                      ? `/organizations/${organizationSlug}${href}`
                                      : href;
                                    
                                    return (
                                      <Button
                                        size="sm"
                                        className="inline-flex items-center gap-1.5 my-1 bg-yellow-500 hover:bg-yellow-600 text-black border-0"
                                        onClick={() => window.open(fullUrl, '_blank')}
                                      >
                                        <Sparkles className="h-3 w-3" />
                                        {children}
                                      </Button>
                                    );
                                  }
                                  
                                  return (
                                    <a 
                                      href={href} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {children}
                                    </a>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && !isLoading && (
          <div className="border-t px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-muted-foreground mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="outline"
                    className="text-sm"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu pregunta sobre ciberseguridad..."
                disabled={isLoading || !currentConversation}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !currentConversation}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Powered by AI • Respuestas instantáneas
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-6 px-2"
                onClick={() => window.open(`/organizations/${organizationSlug}/services/contact`, '_blank')}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Hablar con ventas
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Dialog */}
      <Dialog open={showDebug} onOpenChange={setShowDebug}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Debug: System Prompt</DialogTitle>
            <DialogDescription>
              Este es el prompt del sistema generado para el chatbot con tu contexto actual
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-y-auto rounded-md border bg-muted/30 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {systemPrompt || 'Cargando...'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}