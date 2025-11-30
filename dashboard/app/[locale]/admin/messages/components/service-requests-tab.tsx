'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MessageCircle,
  Phone,
  Mail,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Shield,
  Search,
  MessagesSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

interface ServiceRequest {
  id: string;
  serviceName: string;
  serviceType: string | null;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  message: string | null;
  adminNotes: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  organizationName: string | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasNewMessages?: boolean;
  lastMessageTime?: Date;
  messageCount?: number;
}

interface ServiceRequestsTabProps {
  serviceRequests: ServiceRequest[];
  stats: {
    total: number;
    pending: number;
    contacted: number;
    inProgress: number;
    completed: number;
    withMessages: number;
  };
  locale: string;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock
  },
  contacted: { 
    label: 'Contactado', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: MessageCircle
  },
  'in-progress': { 
    label: 'En Progreso', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle
  },
  completed: { 
    label: 'Completado', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  }
};

export function ServiceRequestsTab({ serviceRequests, stats, locale }: ServiceRequestsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');

  // Process service requests to determine which have new messages
  const processedRequests = serviceRequests.map(request => {
    // Count messages in the request
    let messageCount = 0;
    const _lastMessageTime = request.createdAt;
    let hasNewMessages = false;

    if (request.message) {
      messageCount++;
      // Check if there are additional user messages
      const additionalMessages = request.message.split('--- Mensaje adicional del usuario').length - 1;
      messageCount += additionalMessages;
    }

    if (request.adminNotes) {
      const adminMessages = request.adminNotes.split('--- Respuesta del admin').length - 1;
      messageCount += adminMessages > 0 ? adminMessages : 1;
    }

    // Consider a request has new messages if updated recently and not completed
    if (request.status !== 'completed') {
      const hoursSinceUpdate = (Date.now() - new Date(request.updatedAt).getTime()) / (1000 * 60 * 60);
      hasNewMessages = hoursSinceUpdate < 24 && request.status === 'pending';
    }

    return {
      ...request,
      hasNewMessages,
      lastMessageTime: request.updatedAt,
      messageCount
    };
  });

  // Filter requests
  const filteredRequests = processedRequests.filter(request => {
    const matchesSearch = 
      request.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.organizationName && request.organizationName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesOrg = organizationFilter === 'all' || 
      (organizationFilter === 'with-org' && request.organizationId) ||
      (organizationFilter === 'no-org' && !request.organizationId);
    
    return matchesSearch && matchesStatus && matchesOrg;
  });

  // Get unique organizations for filter
  const _organizations = [...new Set(serviceRequests
    .filter(r => r.organizationName)
    .map(r => r.organizationName))];

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
            <p className="text-xs text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Service Request Messages</CardTitle>
              <CardDescription>Manage conversations with clients about service requests</CardDescription>
            </div>
            <Link href={`/${locale}/admin/messages/chat`}>
              <Button className="gap-2">
                <MessagesSquare className="h-4 w-4" />
                Open Chat Interface
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, service, email or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                <SelectItem value="with-org">With Organization</SelectItem>
                <SelectItem value="no-org">No Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No service requests found</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const status = statusConfig[request.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card 
                      key={request.id} 
                      className={`transition-all hover:shadow-md ${
                        request.hasNewMessages ? 'border-primary' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-primary" />
                                  <h3 className="font-semibold">{request.serviceName}</h3>
                                  {request.hasNewMessages && (
                                    <Badge variant="default" className="bg-blue-500">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                {request.serviceType && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Type: {request.serviceType}
                                  </p>
                                )}
                              </div>
                              <Badge className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>{request.contactName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">{request.contactEmail}</span>
                              </div>
                              {request.contactPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{request.contactPhone}</span>
                                </div>
                              )}
                              {request.organizationName && (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span>{request.organizationName}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{request.messageCount || 0} messages</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Created {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Updated {format(new Date(request.updatedAt), 'HH:mm', { locale: es })}</span>
                                </div>
                              </div>
                              <Link href={`/${locale}/admin/services/${request.id}`}>
                                <Button variant="ghost" size="sm">
                                  View Conversation
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}