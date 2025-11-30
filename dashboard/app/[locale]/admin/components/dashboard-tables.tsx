'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Clock,
  AlertCircle,
  ChevronRight,
  UserCheck,
  UserX,
  Mail,
  Building2,
  Calendar,
  ArrowRight,
  Sparkles,
  Timer,
  FileText
} from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date | null;
  organizationName: string | null;
  organizationId: string | null;
}

interface ServiceRequest {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  serviceType: string | null;
  status: string;
  createdAt: Date | null;
  contactName: string;
  contactEmail: string;
}

interface Message {
  id: string;
  organizationId: string;
  organizationName: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  status: string;
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();

  const getTimeIndicator = (date: Date | null) => {
    if (!date) return { color: 'text-muted-foreground', bg: '', icon: Clock };
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return { 
        color: 'text-green-600 dark:text-green-400', 
        bg: 'bg-green-50 dark:bg-green-950/20',
        icon: Sparkles,
        badge: 'New'
      };
    } else if (diffInHours < 24) {
      return { 
        color: 'text-blue-600 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        icon: Clock,
        badge: 'Recent'
      };
    } else if (diffInHours < 72) {
      return { 
        color: 'text-orange-600 dark:text-orange-400', 
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        icon: Timer,
        badge: null
      };
    }
    return { 
      color: 'text-muted-foreground', 
      bg: '',
      icon: Calendar,
      badge: null
    };
  };

  return (
    <div className="overflow-x-auto">
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Contact</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const timeInfo = getTimeIndicator(lead.createdAt);
          const TimeIcon = timeInfo.icon;
          
          return (
            <TableRow 
              key={lead.id} 
              className={`cursor-pointer hover:bg-muted/50 transition-colors ${timeInfo.bg}`}
              onClick={() => router.push(`/admin/users/${lead.id}`)}
            >
              <TableCell>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full bg-background/80 ${lead.name ? 'bg-primary/10' : 'bg-muted'}`}>
                    {lead.name ? (
                      <UserCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <UserX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {lead.name || <span className="text-muted-foreground italic">No name provided</span>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {lead.email || <span className="italic">No email provided</span>}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {lead.organizationName ? (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="font-normal">
                      {lead.organizationName}
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    No organization
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {timeInfo.badge && (
                    <Badge 
                      variant={timeInfo.badge === 'New' ? 'default' : 'secondary'}
                      className={`text-xs ${timeInfo.badge === 'New' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {timeInfo.badge}
                    </Badge>
                  )}
                  <div className={`flex items-center gap-1 ${timeInfo.color}`}>
                    <TimeIcon className="h-3 w-3" />
                    <span className="text-xs">
                      {formatTimeAgo(lead.createdAt)}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-primary/10"
                  asChild
                >
                  <Link href={`/admin/users/${lead.id}`}>
                    <span>View</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      </Table>
    </div>
  );
}

export function ServiceRequestsList({ requests }: { requests: ServiceRequest[] }) {
  const router = useRouter();

  const getServiceIcon = (serviceType: string | null) => {
    const type = serviceType?.toLowerCase() || '';
    if (type.includes('consult')) return { icon: UserCheck, color: 'text-blue-500' };
    if (type.includes('audit')) return { icon: AlertCircle, color: 'text-orange-500' };
    if (type.includes('support')) return { icon: Building2, color: 'text-green-500' };
    return { icon: FileText, color: 'text-primary' };
  };

  const getTimeUrgency = (date: Date | null) => {
    if (!date) return { urgent: false, color: '' };
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours > 48) {
      return { urgent: true, color: 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20' };
    } else if (diffInHours > 24) {
      return { urgent: false, color: 'border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20' };
    }
    return { urgent: false, color: '' };
  };

  return (
    <div className="space-y-2">
      {requests.map((request) => {
        const serviceInfo = getServiceIcon(request.serviceType);
        const ServiceIcon = serviceInfo.icon;
        const urgency = getTimeUrgency(request.createdAt);
        
        return (
          <div
            key={request.id}
            onClick={() => router.push(`/admin/services/${request.id}`)}
            className={`group relative p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${urgency.color}`}
          >
            {urgency.urgent && (
              <div className="absolute -top-1 -right-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-background/80 ${serviceInfo.color} bg-opacity-10`}>
                <ServiceIcon className={`h-4 w-4 ${serviceInfo.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {request.contactName}
                      </span>
                      {urgency.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs font-normal">
                        {request.serviceType || 'General'}
                      </Badge>
                      {request.organizationName && (
                        <span className="text-xs text-muted-foreground">
                          • {request.organizationName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(request.createdAt)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MessagesList({ messages }: { messages: Message[] }) {
  const router = useRouter();

  const getPriorityFromSubject = (subject: string) => {
    const lower = subject.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('emergency')) {
      return { priority: 'high', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' };
    }
    if (lower.includes('important') || lower.includes('priority')) {
      return { priority: 'medium', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' };
    }
    return { priority: 'normal', color: 'text-blue-500', bg: '' };
  };

  return (
    <div className="space-y-2">
      {messages.map((message) => {
        const priority = getPriorityFromSubject(message.subject);
        const isNew = message.createdAt && 
          (new Date().getTime() - new Date(message.createdAt).getTime()) < (1000 * 60 * 60 * 24);
        
        return (
          <div
            key={message.id}
            onClick={() => router.push(`/admin/messages/${message.id}`)}
            className={`group relative p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer ${priority.bg}`}
          >
            {isNew && (
              <div className="absolute top-2 right-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${priority.bg || 'bg-primary/10'}`}>
                <Mail className={`h-4 w-4 ${priority.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm line-clamp-1">
                        {message.subject}
                      </span>
                      {priority.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        <span>{message.name}</span>
                      </div>
                      <span>•</span>
                      <span className="truncate">{message.email}</span>
                    </div>
                    
                    <div className="relative">
                      <div 
                        className="text-xs text-muted-foreground line-clamp-2 pr-4"
                        dangerouslySetInnerHTML={{ 
                          __html: stripHtmlToText(message.message).substring(0, 150) + '...'
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(message.createdAt)}
                      </div>
                      <Badge 
                        variant={message.status === 'unread' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {message.status === 'unread' ? 'Unread' : 'Read'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'N/A';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

function stripHtmlToText(html: string): string {
  const tmp = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  return tmp;
}