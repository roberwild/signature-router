'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Phone,
  Mail,
  ExternalLink
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
import { ConversationSidebarImproved } from './conversation-sidebar-improved';
import { useConversationsV2 } from '@/hooks/use-conversations-v2';

// Conversation type from hook
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

// Type adapter for conversations
type ConversationAdapter = {
  id: string;
  title: string;
  summary?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

interface ServicesChatbotV2Props {
  organizationId: string;
  organizationSlug: string;
  organizationName?: string;
  userId: string;
  userName?: string;
  userEmail: string;
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date | string;
}

export function ServicesChatbotV2({
  organizationId,
  organizationSlug,
  organizationName,
  userId,
  userName,
  userEmail,
  sidebarOpen = true,
  onToggleSidebar: _onToggleSidebar
}: ServicesChatbotV2Props & { sidebarOpen?: boolean; onToggleSidebar?: () => void }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [generatingContact, setGeneratingContact] = useState<'whatsapp' | 'email' | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneContext, setPhoneContext] = useState<string>('');
  
  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
    updateConversation,
    deleteConversation,
    archiveConversation,
    fetchMessages,
    addMessage: addMessageToDb,
  } = useConversationsV2({
    organizationId,
    userId,
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id).then(setMessages);
    }
  }, [currentConversation, fetchMessages]);

  // Initialize with welcome message when starting new conversation
  const initializeNewConversation = useCallback(async () => {
    const sessionId = `session-${Date.now()}`;
    const newConversation = await createConversation('Nueva conversación', sessionId);
    
    if (newConversation) {
      setCurrentConversation(newConversation);
      
      const welcomeMessage: Message = {
        id: 'welcome',
        conversationId: newConversation.id,
        role: 'assistant' as const,
        content: '¡Hola! 👋 Soy tu asesor de ciberseguridad de Minery. Estoy aquí para ayudarte a encontrar el servicio perfecto para fortalecer la seguridad de tu organización.\n\n¿En qué puedo ayudarte hoy?',
        createdAt: new Date().toISOString(),
      };
      
      setMessages([welcomeMessage]);
      await addMessageToDb(newConversation.id, welcomeMessage.content, 'assistant');
    }
    return newConversation;
  }, [createConversation, addMessageToDb]);

  // Initialize on mount - always create a new conversation
  useEffect(() => {
    if (!conversationsLoading && !currentConversation) {
      initializeNewConversation();
    }
  }, [conversationsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Listen for debug trigger from parent component
  useEffect(() => {
    const handleDebugTrigger = () => {
      fetchDebugInfo();
    };

    window.addEventListener('chatbot-debug-trigger', handleDebugTrigger);
    return () => window.removeEventListener('chatbot-debug-trigger', handleDebugTrigger);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentConversation) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversationId: currentConversation.id,
      role: 'user',
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    await addMessageToDb(currentConversation.id, userContent, 'user');

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
        const tempAiMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          conversationId: currentConversation.id,
          role: 'assistant',
          content: '',
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
        const savedMessage = await addMessageToDb(
          currentConversation.id,
          streamedContent,
          'assistant'
        );
        
        if (savedMessage) {
          // Replace temp message with saved one
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempAiMessage.id 
                ? { ...savedMessage, createdAt: savedMessage.createdAt || new Date().toISOString() }
                : msg
            )
          );
        }
        
        // Update conversation title if it's the first real exchange
        if (messages.length === 1) { // Only welcome message exists
          const title = userContent.slice(0, 50) + (userContent.length > 50 ? '...' : '');
          await updateConversation(currentConversation.id, { title });
          setCurrentConversation((prev) => prev ? { ...prev, title } : null);
        }
        
        setIsUserScrolling(false);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        conversationId: currentConversation.id,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      await addMessageToDb(
        currentConversation.id,
        errorMessage.content,
        'assistant'
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
  const _quickActions = [
    "¿Qué servicio necesito?",
    "Ver precios",
    "Comparar servicios",
    "Contactar ventas"
  ];

  const handleQuickAction = async (action: string) => {
    if (!currentConversation || isLoading) return;
    
    // Set the input value first so user sees what's being sent
    setInput(action);
    
    // Use a small delay to ensure the UI updates before sending
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Now trigger the send
    handleSend();
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: ConversationAdapter) => {
    // Find the full conversation object from our conversations list
    const fullConversation = conversations.find(c => c.id === conversation.id);
    if (fullConversation) {
      setCurrentConversation(fullConversation);
    }
  };

  // Handle new conversation
  const handleNewConversation = async () => {
    const newConversation = await initializeNewConversation();
    if (newConversation) {
      setCurrentConversation(newConversation);
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
    if (currentConversation?.id === conversationId) {
      // If we deleted the current conversation, create a new one
      await initializeNewConversation();
    }
  };

  // Handle archive conversation
  const _handleArchiveConversation = async (conversationId: string) => {
    await archiveConversation(conversationId);
    if (currentConversation?.id === conversationId) {
      // If we archived the current conversation, create a new one
      await initializeNewConversation();
    }
  };

  // Copy message content to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Reset after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Generate conversation context for sales team using LLM
  const generateConversationContext = async (messageType: 'whatsapp' | 'email'): Promise<string> => {
    try {
      const response = await fetch('/api/chatbot/generate-contact-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          userName,
          userEmail,
          messages: messages.slice(-8), // Send last 8 messages for context
          messageType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Generated contact message using LLM');
        return data.message;
      } else {
        console.warn('⚠️ LLM generation failed, using fallback');
        return data.message; // Fallback message
      }
    } catch (error) {
      console.error('❌ Error calling contact message API:', error);
      
      // Fallback to simple template if API fails
      return `🤖 *FUENTE: Minery Guard Platform*

Hola, soy ${userName || 'un cliente'} de ${organizationName || 'una organización'}.

📋 *DATOS DE CONTACTO:*
• Organización: ${organizationName || 'No especificada'}
• Nombre: ${userName || 'No especificado'}
• Email: ${userEmail || 'No especificado'}

💬 He estado consultando con su asesor de ciberseguridad y me gustaría obtener más información sobre los servicios recomendados.

¿Podrían ayudarme con más detalles?

Gracias.`;
    }
  };

  // Handle WhatsApp contact
  const handleWhatsAppContact = async () => {
    if (generatingContact) return; // Prevent multiple simultaneous calls
    
    try {
      setGeneratingContact('whatsapp');
      const phoneNumber = '+34919049788'; // Remove spaces and format for WhatsApp
      const message = await generateConversationContext('whatsapp');
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      // Still try to open WhatsApp with a basic message
      const fallbackUrl = `https://wa.me/+34919049788?text=${encodeURIComponent('Hola, me gustaría obtener información sobre sus servicios de ciberseguridad.')}`;
      window.open(fallbackUrl, '_blank');
    } finally {
      setGeneratingContact(null);
    }
  };

  // Handle email contact
  const _handleEmailContact = async () => {
    if (generatingContact) return; // Prevent multiple simultaneous calls
    
    try {
      setGeneratingContact('email');
      const email = 'contacto@minery.io';
      const subject = encodeURIComponent(`[Minery Guard Platform] Consulta de ${organizationName || 'Organización'}`);
      
      console.log('🔄 Generating email message...');
      const message = await generateConversationContext('email');
      console.log('✅ Email message generated:', message.substring(0, 100) + '...');
      
      const body = encodeURIComponent(message);
      const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      
      console.log('📧 Opening email URL:', emailUrl.substring(0, 200) + '...');
      
      // Try opening with both methods for better compatibility
      const opened = window.open(emailUrl, '_self');
      if (!opened) {
        // Fallback: try with location.href
        console.log('🔄 Trying with location.href...');
        window.location.href = emailUrl;
      }
      
    } catch (error) {
      console.error('❌ Error generating email message:', error);
      // Still try to open email with basic info
      const fallbackSubject = encodeURIComponent('Consulta sobre servicios de ciberseguridad');
      const fallbackBody = encodeURIComponent('Hola, me gustaría obtener información sobre sus servicios de ciberseguridad.');
      const fallbackUrl = `mailto:contacto@minery.io?subject=${fallbackSubject}&body=${fallbackBody}`;
      
      console.log('🔄 Using fallback email URL...');
      const opened = window.open(fallbackUrl, '_self');
      if (!opened) {
        window.location.href = fallbackUrl;
      }
    } finally {
      setGeneratingContact(null);
    }
  };

  // Generate phone talking points from conversation
  const generatePhoneTalkingPoints = async (): Promise<string> => {
    try {
      const response = await fetch('/api/chatbot/generate-contact-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          userName,
          userEmail,
          messages: messages.slice(-8), // Send last 8 messages for context
          messageType: 'phone',
          useFirstPerson: true // Request first-person format for phone calls
        })
      });

      const data = await response.json();
      
      if (data.success && data.analysis) {
        // Format for phone conversation
        const talkingPoints = `📞 PUNTOS CLAVE PARA LA LLAMADA:

🏢 DATOS DE CONTACTO:
• Organización: ${organizationName || 'No especificada'}
• Nombre: ${userName || 'No especificado'}
• Email: ${userEmail || 'No especificado'}

💬 RESUMEN DE CONSULTAS:
${data.analysis.conversationSummary || 'Consulta general sobre servicios de ciberseguridad'}

🎯 RECOMENDACIONES MENCIONADAS:
${data.analysis.assistantRecommendation || 'Se proporcionaron recomendaciones específicas'}

💡 PUNTOS A MENCIONAR:
• He estado consultando con su asesor de IA
• Necesito más información personalizada
• Me interesan los servicios recomendados
• Quiero conocer precios y tiempos de implementación

📌 CONSEJOS PARA LA LLAMADA:
• Menciona que vienes del asesor virtual de Minery Guard
• Pregunta por ofertas personalizadas para tu organización
• Consulta tiempos de implementación específicos
• Solicita un presupuesto detallado

🤖 Fuente: Minery Guard Platform`;
        
        return talkingPoints;
      } else {
        throw new Error('Failed to generate talking points');
      }
    } catch (error) {
      console.error('Error generating phone talking points:', error);
      
      // Fallback talking points
      return `📞 PUNTOS CLAVE PARA LA LLAMADA:

🏢 DATOS DE CONTACTO:
• Organización: ${organizationName || 'No especificada'}
• Nombre: ${userName || 'No especificado'}
• Email: ${userEmail || 'No especificado'}

💬 MI CONSULTA:
He estado consultando con su asesor de ciberseguridad virtual y necesito información más personalizada sobre los servicios que podrían adaptarse a mi organización.

💡 PUNTOS A MENCIONAR:
• Necesito asesoramiento en ciberseguridad
• Me interesan sus servicios profesionales
• Quiero conocer precios y opciones disponibles
• Prefiero una consulta telefónica personalizada

📌 CONSEJOS PARA LA LLAMADA:
• Menciona que vienes del asesor virtual de Minery Guard
• Pregunta por ofertas personalizadas
• Consulta sobre tiempos de implementación
• Solicita un presupuesto adaptado a tu organización

🤖 Fuente: Minery Guard Platform`;
    }
  };

  // Handle phone contact - show modal with context
  const handlePhoneContact = async () => {
    try {
      setGeneratingContact('whatsapp'); // Reuse loading state
      const talkingPoints = await generatePhoneTalkingPoints();
      setPhoneContext(talkingPoints);
      setShowPhoneModal(true);
    } catch (error) {
      console.error('Error preparing phone context:', error);
      // Still show modal with basic info
      setPhoneContext(`📞 LLAMAR A MINERY

Teléfono: +34 919 049 788
Organización: ${organizationName || 'No especificada'}
Contacto: ${userName || 'No especificado'}

Menciona que vienes del asesor de ciberseguridad virtual para obtener información personalizada.`);
      setShowPhoneModal(true);
    } finally {
      setGeneratingContact(null);
    }
  };

  // Actually make the phone call
  const makePhoneCall = () => {
    const phoneNumber = 'tel:+34919049788';
    window.open(phoneNumber, '_self');
    setShowPhoneModal(false);
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
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <ConversationSidebarImproved
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          conversations={conversations.map(c => ({
            id: c.id,
            title: c.title,
            summary: null,
            lastMessageAt: null,
            createdAt: typeof c.createdAt === 'string' ? c.createdAt : c.createdAt.toISOString(),
            updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : c.updatedAt.toISOString()
          }) as ConversationAdapter)}
          loading={conversationsLoading}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Messages area */}
        <div className="flex-1 overflow-hidden relative" ref={scrollAreaRef}>
          {/* Show minimalistic centered prompt when no real messages */}
          {messages.length <= 1 && messages[0]?.role === 'assistant' ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="max-w-2xl w-full">
                {/* Centered input field */}
                <div className="mb-6">
                  <div className="relative">
                    <Input
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Escribe tu pregunta sobre ciberseguridad..."
                      disabled={isLoading || !currentConversation}
                      className="w-full pl-4 pr-12 py-6 text-base rounded-full border-2 focus:border-primary"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading || !currentConversation}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick action cards - simplified */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickAction("¿Qué servicio necesito?")}
                    className="p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-all text-sm font-medium"
                  >
                    ¿Qué servicio necesito?
                  </button>

                  <button
                    onClick={() => handleQuickAction("Ver precios")}
                    className="p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-all text-sm font-medium"
                  >
                    Ver precios
                  </button>

                  <button
                    onClick={() => handleQuickAction("Comparar servicios")}
                    className="p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-all text-sm font-medium"
                  >
                    Comparar servicios
                  </button>

                  <button
                    onClick={() => handleQuickAction("Contactar ventas")}
                    className="p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-all text-sm font-medium"
                  >
                    Contactar ventas
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full w-full" onScrollCapture={handleScroll}>
              <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 group",
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
                        "rounded-lg px-4 py-3 relative",
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
                        
                        {/* Copy button inside the card for assistant messages */}
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            title="Copiar respuesta"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
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
          )}
        </div>
        {/* Input area - only show when in conversation mode */}
        {!(messages.length <= 1 && messages[0]?.role === 'assistant') && (
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
        )}

        {/* Contact buttons - Always visible when in conversation */}
        {!(messages.length <= 1 && messages[0]?.role === 'assistant') && (
          <div className="border-t p-3 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">¿Necesitas hablar con nuestro equipo?</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {/* WhatsApp Button */}
                  <Button
                    onClick={handleWhatsAppContact}
                    disabled={generatingContact === 'whatsapp'}
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 disabled:opacity-70"
                    size="sm"
                  >
                    {generatingContact === 'whatsapp' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {generatingContact === 'whatsapp' ? 'Preparando...' : 'WhatsApp'}
                    {generatingContact !== 'whatsapp' && <ExternalLink className="h-3 w-3 ml-1" />}
                  </Button>
                  
                  {/* Email Button */}
                  <Button
                    onClick={() => {
                      // Simple email handler for testing
                      const email = 'contacto@minery.io';
                      const subject = encodeURIComponent(`Consulta desde Minery Guard Platform - ${organizationName || 'Organización'}`);
                      const body = encodeURIComponent(`Hola,

Me interesa obtener más información sobre los servicios de ciberseguridad de Minery.

Datos de contacto:
- Organización: ${organizationName || 'No especificada'}
- Nombre: ${userName || 'No especificado'}
- Email: ${userEmail || 'No especificado'}

He estado consultando con el asesor virtual y me gustaría hablar con el equipo de ventas.

Gracias.`);
                      
                      const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
                      console.log('📧 Simple email URL:', emailUrl);
                      
                      // Try multiple methods
                      try {
                        window.location.href = emailUrl;
                      } catch (error) {
                        console.error('Error with location.href:', error);
                        try {
                          window.open(emailUrl, '_self');
                        } catch (error2) {
                          console.error('Error with window.open:', error2);
                          // Last resort: copy to clipboard
                          navigator.clipboard.writeText(`${email}\n\nAsunto: ${decodeURIComponent(subject)}\n\n${decodeURIComponent(body)}`);
                          alert('Email copiado al portapapeles. Por favor pégalo en tu cliente de email.');
                        }
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  {/* Phone Button */}
                  <Button
                    onClick={handlePhoneContact}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {generatingContact ? 
                    'Generando mensaje personalizado con IA...' : 
                    'Incluye automáticamente el contexto de tu conversación'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
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

      {/* Phone Contact Modal - Simplified UX */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Preparar Llamada Telefónica
            </DialogTitle>
            <DialogDescription>
              Información clave para tu consulta telefónica con nuestro equipo
            </DialogDescription>
          </DialogHeader>
          
          {/* Phone Number Section - Outside scroll area */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                <Phone className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Teléfono de Ventas</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">+34 919 049 788</p>
              </div>
            </div>
            <Button
              onClick={makePhoneCall}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Llamar Ahora
            </Button>
          </div>

          {/* Single scrollable context area */}
          <div className="bg-muted/50 rounded-lg p-4 max-h-[45vh] overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground/90">
              {phoneContext || (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generando información contextual...</span>
                </div>
              )}
            </pre>
          </div>

          {/* Footer Actions - Always visible */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPhoneModal(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(phoneContext);
                // Show brief success feedback
                const btn = document.getElementById('copy-btn');
                if (btn) {
                  btn.textContent = '✓ Copiado';
                  setTimeout(() => {
                    btn.textContent = 'Copiar Info';
                  }, 2000);
                }
              }}
              variant="secondary"
              className="flex items-center gap-2"
              id="copy-btn"
            >
              <Copy className="h-4 w-4" />
              <span>Copiar Info</span>
            </Button>
            <Button
              onClick={makePhoneCall}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4" />
              Llamar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}