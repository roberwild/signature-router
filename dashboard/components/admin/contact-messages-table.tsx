'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  markMessagesAsRead,
  markMessagesAsUnread,
  archiveMessages,
  deleteMessages
} from '~/actions/admin/contact-messages';
import {
  MessageCircle,
  Calendar,
  Building2,
  Eye,
  Search,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  X,
  MoreHorizontal,
  Archive,
  CheckCircle,
  Circle
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Card, CardContent } from '@workspace/ui/components/card';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: Date | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
}

interface ContactMessagesTableProps {
  messages: ContactMessage[];
  locale: string;
}

type SortField = 'date' | 'name' | 'subject' | 'organization';
type SortOrder = 'asc' | 'desc';

export function ContactMessagesTable({ messages, locale }: ContactMessagesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Get unique organizations for filter
  const uniqueOrganizations = useMemo(() => {
    const orgs = new Set<string>();
    messages.forEach(msg => {
      if (msg.organizationName) {
        orgs.add(msg.organizationName);
      }
    });
    return Array.from(orgs).sort();
  }, [messages]);

  // Filter and sort messages
  const filteredAndSortedMessages = useMemo(() => {
    let filtered = messages;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.name.toLowerCase().includes(query) ||
        msg.email.toLowerCase().includes(query) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.message.toLowerCase().includes(query) ||
        (msg.organizationName?.toLowerCase().includes(query) ?? false)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Apply organization filter
    if (organizationFilter !== 'all') {
      filtered = filtered.filter(msg => msg.organizationName === organizationFilter);
    }

    // Sort messages
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        case 'organization':
          comparison = (a.organizationName ?? '').localeCompare(b.organizationName ?? '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [messages, searchQuery, statusFilter, organizationFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);
  };

  const toggleAllMessages = () => {
    if (selectedMessages.size === filteredAndSortedMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(filteredAndSortedMessages.map(m => m.id)));
    }
  };

  const handleRowClick = (messageId: string) => {
    router.push(`/${locale}/admin/contacts/${messageId}`);
  };

  const handleMarkAsRead = async (messageIds: string[]) => {
    startTransition(async () => {
      const result = await markMessagesAsRead(messageIds);
      if (result.success) {
        toast.success(`Marked ${messageIds.length} message(s) as read`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to mark messages as read');
      }
    });
  };

  const handleMarkAsUnread = async (messageIds: string[]) => {
    startTransition(async () => {
      const result = await markMessagesAsUnread(messageIds);
      if (result.success) {
        toast.success(`Marked ${messageIds.length} message(s) as unread`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to mark messages as unread');
      }
    });
  };

  const handleArchive = async (messageIds: string[]) => {
    startTransition(async () => {
      const result = await archiveMessages(messageIds);
      if (result.success) {
        toast.success(`Archived ${messageIds.length} message(s)`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to archive messages');
      }
    });
  };

  const handleDelete = async (messageIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${messageIds.length} message(s)?`)) {
      return;
    }
    
    startTransition(async () => {
      const result = await deleteMessages(messageIds);
      if (result.success) {
        toast.success(`Deleted ${messageIds.length} message(s)`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to delete messages');
      }
    });
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No contact messages yet</p>
            <p className="text-sm text-muted-foreground">Messages will appear here when submitted</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: unknown) => setStatusFilter(value as 'all' | 'unread' | 'read')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              {uniqueOrganizations.length > 0 && (
                <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {uniqueOrganizations.map(org => (
                      <SelectItem key={org} value={org}>{org}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedMessages.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedMessages.size} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={isPending}>
                      Actions
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleMarkAsRead(Array.from(selectedMessages))}
                      className="cursor-pointer"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Read
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleMarkAsUnread(Array.from(selectedMessages))}
                      className="cursor-pointer"
                    >
                      <Circle className="mr-2 h-4 w-4" />
                      Mark as Unread
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleArchive(Array.from(selectedMessages))}
                      className="cursor-pointer"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(Array.from(selectedMessages))}
                      className="cursor-pointer text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedMessages(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredAndSortedMessages.length > 0 &&
                        selectedMessages.size === filteredAndSortedMessages.length
                      }
                      onCheckedChange={toggleAllMessages}
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('date')}
                      className="h-auto p-0 font-medium"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('name')}
                      className="h-auto p-0 font-medium"
                    >
                      From
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('organization')}
                      className="h-auto p-0 font-medium"
                    >
                      Organization
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('subject')}
                      className="h-auto p-0 font-medium"
                    >
                      Subject
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMessages.map((message) => (
                  <TableRow 
                    key={message.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      // Don't navigate if clicking on checkbox or action button
                      const target = e.target as HTMLElement;
                      if (!target.closest('button') && !target.closest('input[type="checkbox"]')) {
                        handleRowClick(message.id);
                      }
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedMessages.has(message.id)}
                        onCheckedChange={() => toggleMessageSelection(message.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={message.status === 'unread' ? 'default' : 'secondary'}
                        className={message.status === 'unread' ? 'bg-blue-500' : ''}
                      >
                        {message.status === 'unread' ? 'Unread' : 'Read'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {message.createdAt 
                            ? format(new Date(message.createdAt), 'dd/MM/yyyy', { locale: es })
                            : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{message.name}</p>
                        <p className="text-sm text-muted-foreground">{message.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{message.organizationName || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[200px] truncate">{message.subject}</p>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleRowClick(message.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {message.status === 'unread' ? (
                            <DropdownMenuItem 
                              onClick={() => handleMarkAsRead([message.id])}
                              className="cursor-pointer"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Read
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleMarkAsUnread([message.id])}
                              className="cursor-pointer"
                            >
                              <Circle className="mr-2 h-4 w-4" />
                              Mark as Unread
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleArchive([message.id])}
                            className="cursor-pointer"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete([message.id])}
                            className="cursor-pointer text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}