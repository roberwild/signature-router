'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Send,
  Paperclip,
  Download,
  User,
  Shield,
  Clock,
  CheckCircle,
  MessageCircle,
  Loader2,
  ArrowDown,
  FileText,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';

interface Message {
  id: string;
  type: 'user' | 'admin';
  content: string;
  timestamp: string;
  senderName?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

interface ConversationViewProps {
  serviceRequestId: string;
  _serviceRequestId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  organizationName: string;
  serviceName: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  onStatusChange: (status: string) => Promise<void>;
  onAttachFile?: (file: File) => Promise<void>;
}

const statusOptions = [
  { value: 'pending', label: 'Pendiente', icon: Clock },
  { value: 'contacted', label: 'Contactado', icon: MessageCircle },
  { value: 'in-progress', label: 'En Progreso', icon: Loader2 },
  { value: 'completed', label: 'Completado', icon: CheckCircle }
];

export function ConversationView({
  _serviceRequestId,
  contactName,
  contactEmail,
  contactPhone,
  organizationName,
  serviceName,
  status,
  messages,
  onSendMessage,
  onStatusChange,
  onAttachFile
}: ConversationViewProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus message input on component mount and after sending messages
  useEffect(() => {
    const focusInput = () => {
      if (messageInputRef.current && !isSending) {
        messageInputRef.current.focus();
      }
    };

    focusInput();

    // Re-focus when sending state changes (after message is sent)
    if (!isSending && message === '') {
      setTimeout(focusInput, 100); // Small delay to ensure DOM updates
    }
  }, [isSending, message]);

  // Handle focus restoration when user clicks elsewhere but hasn't actively focused another input
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't auto-focus if user clicked on another input/textarea/button or interactive element
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('[contenteditable]') ||
        target.closest('.select-trigger')
      ) {
        return;
      }

      // Auto-focus back to message input if clicking in the conversation area
      if (messageInputRef.current && !isSending) {
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [isSending]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      // Focus will be restored by the useEffect that watches isSending and message changes
    } catch (error) {
      console.error('Error sending message:', error);
      // Re-focus on error
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachFile) {
      await onAttachFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{contactName}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{contactEmail}</span>
              {contactPhone && <span>{contactPhone}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{organizationName}</Badge>
              <Badge variant="secondary">{serviceName}</Badge>
            </div>
          </div>

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea
          className="h-full w-full p-4"
          onScrollCapture={handleScroll}
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
          {messages.length === 0 ? (
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription className="mt-1">
                No hay mensajes aún. Inicia la conversación enviando un mensaje.
              </AlertDescription>
            </Alert>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={cn(
                  'flex gap-3',
                  msg.type === 'admin' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    {msg.type === 'admin' ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    'flex flex-col gap-1 max-w-[70%]',
                    msg.type === 'admin' ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {msg.type === 'admin' ? 'Equipo de soporte' : msg.senderName || contactName}
                    </span>
                    <span>
                      {format(new Date(msg.timestamp), 'HH:mm', { locale: es })}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'rounded-lg px-3 py-2',
                      msg.type === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((attachment) => {
                        const FileIcon = getFileIcon(attachment.fileType);
                        return (
                          <a
                            key={attachment.id}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-md transition-colors',
                              'hover:bg-muted',
                              msg.type === 'admin'
                                ? 'bg-primary/10'
                                : 'bg-muted/50'
                            )}
                          >
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.fileSize)}
                              </p>
                            </div>
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        </ScrollArea>

        {showScrollButton && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          {onAttachFile && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}

          <Textarea
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isSending}
          />

          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="h-[40px] self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}