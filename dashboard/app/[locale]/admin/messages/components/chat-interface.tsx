'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MessageCircle,
  Search,
  Phone,
  Mail,
  User,
  Building2,
  Shield,
  Send,
  Clock,
  CheckCircle,
  Loader2,
  MoreVertical,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { addAdminMessage } from '~/actions/services/add-admin-message';

interface ChatMessage {
  type: 'user' | 'admin';
  content: string;
  timestamp: string;
  label: string;
}

interface ChatData {
  id: string;
  serviceName: string;
  serviceType: string | null;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  organizationName: string | null;
  messageCount: number;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageType: 'user' | 'admin';
}

export interface SelectedChatData extends ChatData {
  organizationSlug?: string | null;
  organizationLogo?: string | null;
  organizationWebsite?: string | null;
  organizationDescription?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatInterfaceProps {
  chats: ChatData[];
  selectedChat: SelectedChatData | null;
  locale: string;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'text-yellow-600 bg-yellow-100',
    icon: Clock
  },
  contacted: { 
    label: 'Contactado', 
    color: 'text-blue-600 bg-blue-100',
    icon: MessageCircle
  },
  'in-progress': { 
    label: 'En Progreso', 
    color: 'text-orange-600 bg-orange-100',
    icon: Loader2
  },
  completed: { 
    label: 'Completado', 
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle
  }
};

export function ChatInterface({ chats, selectedChat, locale }: ChatInterfaceProps) {
  const router = useRouter();
  const _searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter chats based on search
  const filteredChats = chats.filter(chat => 
    chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.organizationName && chat.organizationName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  // Auto-focus input when component mounts or chat changes
  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChat]);

  // Auto-focus input after sending message
  useEffect(() => {
    if (!isSending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSending]);

  const handleChatSelect = (chatId: string) => {
    router.push(`/${locale}/admin/messages/chat?id=${chatId}`);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending || !selectedChat) return;
    
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsSending(true);
    
    try {
      await addAdminMessage(selectedChat.id, messageToSend, selectedChat.status);
      toast.success('Mensaje enviado');
      // Refresh the page to get updated messages
      router.refresh();
    } catch (error) {
      setInputMessage(messageToSend);
      toast.error('Error al enviar el mensaje');
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedChat) return;
    
    try {
      const response = await fetch(`/api/admin/services/${selectedChat.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        toast.success('Estado actualizado');
        router.refresh();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Service Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 h-0">
          <div className="p-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                const _status = statusConfig[chat.status];
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={cn(
                      "w-full p-3 rounded-lg mb-1 text-left transition-colors",
                      "hover:bg-muted/50",
                      isSelected && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {chat.contactName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{chat.contactName}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(chat.lastMessageTime), 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-primary truncate">{chat.serviceName}</p>
                          {chat.unreadCount > 0 && (
                            <Badge className="h-5 min-w-[20px] px-1 bg-primary">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.lastMessageType === 'admin' && '✓ '}
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Center - Conversation */}
      {selectedChat ? (
        <>
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedChat.contactName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedChat.contactName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedChat.serviceName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedChat.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowMobileInfo(!showMobileInfo)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea 
              className="flex-1 h-0 p-4"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="space-y-4">
                {selectedChat.messages.map((message, index) => {
                  const isAdmin = message.type === 'admin';
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        isAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          isAdmin 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {format(new Date(message.timestamp), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            {selectedChat.status !== 'completed' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!inputMessage.trim() || isSending} className="h-10">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Right Sidebar - Context Information */}
          <div className={cn(
            "w-80 border-l bg-muted/10 overflow-y-auto",
            "lg:block",
            showMobileInfo ? "block absolute right-0 top-0 h-full z-10" : "hidden"
          )}>
            <div className="p-4 space-y-4">
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden absolute right-2 top-2"
                onClick={() => setShowMobileInfo(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedChat.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${selectedChat.contactEmail}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedChat.contactEmail}
                    </a>
                  </div>
                  {selectedChat.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${selectedChat.contactPhone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedChat.contactPhone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Service</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{selectedChat.serviceName}</span>
                    </div>
                  </div>
                  {selectedChat.serviceType && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="text-sm">{selectedChat.serviceType}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Request ID</p>
                    <p className="text-xs font-mono">{selectedChat.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm">
                      {format(new Date(selectedChat.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Information */}
              {selectedChat.organizationName && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Organization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedChat.organizationName}</span>
                    </div>
                    {selectedChat.organizationWebsite && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={selectedChat.organizationWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {selectedChat.organizationDescription && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{selectedChat.organizationDescription}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href={`mailto:${selectedChat.contactEmail}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                  {selectedChat.contactPhone && (
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <a href={`https://wa.me/${selectedChat.contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  {selectedChat.organizationName && (
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <a href={`/${locale}/admin/organizations/${selectedChat.organizationName}`}>
                        <Building2 className="h-4 w-4 mr-2" />
                        View Organization
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}