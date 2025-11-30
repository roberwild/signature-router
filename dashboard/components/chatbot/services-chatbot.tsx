'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2,
  Maximize2,
  Bot,
  Sparkles,
  Loader2,
  Bug,
  Expand
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Card } from '@workspace/ui/components/card';
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ServicesChatbotProps {
  organizationId?: string;
  organizationSlug: string;
  organizationName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export function ServicesChatbot({ 
  organizationId, 
  organizationSlug,
  organizationName,
  userId,
  userName,
  userEmail
}: ServicesChatbotProps) {
  console.log('ServicesChatbot rendered with:', { 
    organizationId, 
    organizationSlug,
    organizationName,
    userId,
    userName,
    userEmail
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const router = useRouter();

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: '¡Hola! 👋 Soy tu asesor de ciberseguridad de Minery. Estoy aquí para ayudarte a encontrar el servicio perfecto para fortalecer la seguridad de tu organización.\n\n¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom only if user is not scrolling
  useEffect(() => {
    if (!isUserScrolling && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Check if we're at the bottom (within 50px tolerance)
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
    
    // Check if user is near the bottom (within 50px)
    const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
    setIsUserScrolling(!isNearBottom);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = `ai-${Date.now()}`;
    let streamedContent = '';

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          organizationId,
          organizationName,
          organizationSlug,
          userId,
          userName,
          userEmail,
          stream: true,
        }),
      });

      // Get session ID from headers if present
      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId) {
        setSessionId(newSessionId);
      }

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream') || !contentType?.includes('application/json')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        // Add initial empty message for streaming
        const aiMessage: Message = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          // Update the message with accumulated content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }
        
        // Reset scrolling state when streaming completes
        setIsUserScrolling(false);
      } else {
        // Fallback to non-streaming response
        const data = await response.json();
        const aiMessage: Message = {
          id: aiMessageId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  // Fetch debug info (system prompt)
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

  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] group cursor-pointer"
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      >
        <div className="relative">
          {/* Pulse animation */}
          <div className="absolute -inset-1 bg-primary/40 rounded-full animate-pulse" />
          
          {/* Main button */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all hover:shadow-xl hover:scale-110">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-1.5 shadow-lg">
              <p className="text-xs font-medium text-white dark:text-gray-900">
                ¿Necesitas ayuda?
              </p>
              <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 z-50 w-80 shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-sm">Asesor Minery</span>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Asesor de Ciberseguridad</h3>
              <p className="text-xs text-muted-foreground">Minery Services</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                // Save current conversation state to sessionStorage
                sessionStorage.setItem('chatbot-messages', JSON.stringify(messages));
                sessionStorage.setItem('chatbot-session-id', sessionId || '');
                // Navigate to full-page view without refresh
                router.push(`/organizations/${organizationSlug}/chatbot`);
              }}
              title="Expandir conversación"
            >
              <Expand className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={fetchDebugInfo}
              title="Debug Info"
            >
              <Bug className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">En línea</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden" ref={scrollAreaRef}>
        <ScrollArea className="h-full p-4" onScrollCapture={handleScroll}>
          <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                message.role === 'user' ? 'bg-primary' : 'bg-primary/10'
              )}>
                {message.role === 'user' ? (
                  <span className="text-xs text-primary-foreground font-medium">TÚ</span>
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className={cn(
                "flex flex-col gap-1 max-w-[80%]",
                message.role === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  "rounded-lg px-3 py-2",
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
                            // Check if this is a service info URL
                            const isServiceUrl = href && (
                              href.includes('minery.io/servicios') || 
                              href.includes('/services/') ||
                              children?.toString().toLowerCase().includes('más información')
                            );
                            
                            if (isServiceUrl) {
                              // Construct full URL if it's a relative path
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
                            
                            // Regular link
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
                  {format(message.timestamp, 'HH:mm', { locale: es })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Preguntas frecuentes:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
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
      </Card>
      
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
    </>
  );
}