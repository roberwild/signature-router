'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  markFeedbackAsRead,
  markFeedbackAsUnread,
  archiveFeedback,
  deleteFeedback
} from '~/actions/admin/feedback-messages';
import {
  MessageSquare,
  Calendar,
  Building2,
  Tag,
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

interface FeedbackMessage {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  category: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: Date | null;
}

interface FeedbackStatsProps {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byCategory: {
    suggestion: number;
    problem: number;
    question: number;
  };
}

interface FeedbackMessagesTabProps {
  messages: FeedbackMessage[];
  stats: FeedbackStatsProps;
  locale: string;
}

type SortField = 'date' | 'user' | 'category' | 'organization';
type SortOrder = 'asc' | 'desc';

const categoryLabels: Record<string, string> = {
  'suggestion': 'Suggestion',
  'problem': 'Problem',
  'question': 'Question'
};

const categoryColors: Record<string, string> = {
  'suggestion': 'default',
  'problem': 'destructive',
  'question': 'secondary'
};

export function FeedbackMessagesTab({ messages, stats: _stats, locale }: FeedbackMessagesTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
        (msg.userName?.toLowerCase().includes(query) ?? false) ||
        (msg.userEmail?.toLowerCase().includes(query) ?? false) ||
        msg.message.toLowerCase().includes(query) ||
        (msg.organizationName?.toLowerCase().includes(query) ?? false)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(msg => msg.category === categoryFilter);
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
        case 'user':
          comparison = (a.userName ?? '').localeCompare(b.userName ?? '');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'organization':
          comparison = (a.organizationName ?? '').localeCompare(b.organizationName ?? '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [messages, searchQuery, statusFilter, categoryFilter, organizationFilter, sortField, sortOrder]);

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
    router.push(`/${locale}/admin/messages/${messageId}`);
  };

  const handleMarkAsRead = async (feedbackIds: string[]) => {
    startTransition(async () => {
      const result = await markFeedbackAsRead(feedbackIds);
      if (result.success) {
        toast.success(`Marked ${feedbackIds.length} feedback(s) as read`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to mark feedback as read');
      }
    });
  };

  const handleMarkAsUnread = async (feedbackIds: string[]) => {
    startTransition(async () => {
      const result = await markFeedbackAsUnread(feedbackIds);
      if (result.success) {
        toast.success(`Marked ${feedbackIds.length} feedback(s) as unread`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to mark feedback as unread');
      }
    });
  };

  const handleArchive = async (feedbackIds: string[]) => {
    startTransition(async () => {
      const result = await archiveFeedback(feedbackIds);
      if (result.success) {
        toast.success(`Archived ${feedbackIds.length} feedback(s)`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to archive feedback');
      }
    });
  };

  const handleDelete = async (feedbackIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${feedbackIds.length} feedback(s)?`)) {
      return;
    }
    
    startTransition(async () => {
      const result = await deleteFeedback(feedbackIds);
      if (result.success) {
        toast.success(`Deleted ${feedbackIds.length} feedback(s)`);
        setSelectedMessages(new Set());
      } else {
        toast.error(result.error || 'Failed to delete feedback');
      }
    });
  };

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No feedback messages yet</p>
            <p className="text-sm text-muted-foreground">User feedback will appear here</p>
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
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="suggestion">Suggestions</SelectItem>
                  <SelectItem value="problem">Problems</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
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
                      onClick={() => toggleSort('user')}
                      className="h-auto p-0 font-medium"
                    >
                      User
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
                      onClick={() => toggleSort('category')}
                      className="h-auto p-0 font-medium"
                    >
                      Category
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMessages.map((message) => (
                  <TableRow 
                    key={message.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
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
                        variant={
                          message.status === 'unread' ? 'default' : 
                          message.status === 'archived' ? 'outline' : 
                          'secondary'
                        }
                        className={message.status === 'unread' ? 'bg-blue-500' : ''}
                      >
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {message.createdAt 
                            ? format(new Date(message.createdAt), 'dd/MM/yyyy')
                            : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{message.userName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{message.userEmail || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{message.organizationName || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={(categoryColors[message.category] as 'default' | 'secondary' | 'destructive' | 'outline') || 'default'}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {categoryLabels[message.category] || message.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[300px] truncate">{message.message}</p>
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