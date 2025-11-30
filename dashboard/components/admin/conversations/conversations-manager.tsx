'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle,
  MessageCircle,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { ConversationListItem } from './conversation-list-item';
import { ConversationView } from './conversation-view';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Badge } from '@workspace/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@workspace/ui/components/dropdown-menu';
import { Card, CardContent } from '@workspace/ui/components/card';

import { cn } from '@workspace/ui/lib/utils';

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

interface ServiceRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  serviceName: string;
  serviceType?: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  message?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: string;
  hasAttachments?: boolean;
}

interface ConversationsManagerProps {
  initialRequests: ServiceRequest[];
  currentUserId: string;
}

export function ConversationsManager({
  initialRequests,
  currentUserId: _
}: ConversationsManagerProps) {
  const _router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group requests by status for tabs
  const requestsByStatus = {
    all: filteredRequests,
    pending: filteredRequests.filter(r => r.status === 'pending'),
    contacted: filteredRequests.filter(r => r.status === 'contacted'),
    'in-progress': filteredRequests.filter(r => r.status === 'in-progress'),
    completed: filteredRequests.filter(r => r.status === 'completed')
  };

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    unread: requests.reduce((sum, r) => sum + (r.unreadCount || 0), 0)
  };

  // Load messages for selected request
  const loadMessages = useCallback(async (requestId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/services/${requestId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Handle message send
  const handleSendMessage = async (message: string) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/services/${selectedRequest.id}/admin-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        // Reload messages
        await loadMessages(selectedRequest.id);
        // Refresh requests to update last message
        await refreshRequests();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/services/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setRequests(prev => prev.map(r =>
          r.id === selectedRequest.id
            ? { ...r, status: newStatus as 'pending' | 'contacted' | 'in-progress' | 'completed' }
            : r
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Refresh requests
  const refreshRequests = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/service-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error refreshing requests:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshRequests, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Load messages when request is selected
  useEffect(() => {
    if (selectedRequestId) {
      loadMessages(selectedRequestId);
    }
  }, [selectedRequestId, loadMessages]);

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className="w-96 border-r flex flex-col bg-background flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Conversaciones</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={refreshRequests}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Configuración</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  >
                    Auto-actualizar
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showNotifications}
                    onCheckedChange={setShowNotifications}
                  >
                    Notificaciones
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </CardContent>
            </Card>
            <Card className="p-2">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-red-600">
                  {stats.unread}
                </div>
                <p className="text-xs text-muted-foreground">Sin leer</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 px-4 flex-shrink-0">
            <TabsTrigger value="all">
              Todas
              {requestsByStatus.all.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1">
                  {requestsByStatus.all.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="contacted">
              <MessageCircle className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              <Loader2 className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-3 w-3" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay conversaciones {statusFilter !== 'all' ? `con estado ${statusFilter}` : ''}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredRequests.map((request) => (
                    <ConversationListItem
                      key={request.id}
                      id={request.id}
                      contactName={request.contactName}
                      organizationName={request.organizationName}
                      serviceName={request.serviceName}
                      status={request.status}
                      lastMessage={request.lastMessage}
                      lastMessageTime={request.updatedAt}
                      unreadCount={request.unreadCount}
                      hasAttachments={request.hasAttachments}
                      isSelected={selectedRequestId === request.id}
                      onClick={() => setSelectedRequestId(request.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {selectedRequest ? (
          isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ConversationView
              serviceRequestId={selectedRequest.id}
              contactName={selectedRequest.contactName}
              contactEmail={selectedRequest.contactEmail}
              contactPhone={selectedRequest.contactPhone}
              organizationName={selectedRequest.organizationName}
              serviceName={selectedRequest.serviceName}
              status={selectedRequest.status}
              messages={messages}
              onSendMessage={handleSendMessage}
              onStatusChange={handleStatusChange}
            />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Elige una conversación de la lista para ver los mensajes y responder a los usuarios
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}