'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle,
  Circle,
  Archive,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import {
  markMessagesAsRead,
  markMessagesAsUnread,
  archiveMessages,
  deleteMessages
} from '~/actions/admin/contact-messages';
import {
  markFeedbackAsRead,
  markFeedbackAsUnread,
  archiveFeedback,
  deleteFeedback
} from '~/actions/admin/feedback-messages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';

interface MessageActionsProps {
  messageId: string;
  messageType: 'contact' | 'feedback';
  currentStatus: 'unread' | 'read' | 'archived';
  locale: string;
}

export function MessageActions({ 
  messageId, 
  messageType, 
  currentStatus,
  locale 
}: MessageActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = async () => {
    startTransition(async () => {
      const markAsRead = messageType === 'contact' ? markMessagesAsRead : markFeedbackAsRead;
      const result = await markAsRead([messageId]);
      if (result.success) {
        toast.success('Message marked as read');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to mark message as read');
      }
    });
  };

  const handleMarkAsUnread = async () => {
    startTransition(async () => {
      const markAsUnread = messageType === 'contact' ? markMessagesAsUnread : markFeedbackAsUnread;
      const result = await markAsUnread([messageId]);
      if (result.success) {
        toast.success('Message marked as unread');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to mark message as unread');
      }
    });
  };

  const handleArchive = async () => {
    startTransition(async () => {
      const archive = messageType === 'contact' ? archiveMessages : archiveFeedback;
      const result = await archive([messageId]);
      if (result.success) {
        toast.success('Message archived');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to archive message');
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    startTransition(async () => {
      const deleteMessage = messageType === 'contact' ? deleteMessages : deleteFeedback;
      const result = await deleteMessage([messageId]);
      if (result.success) {
        toast.success('Message deleted');
        router.push(`/${locale}/admin/messages`);
      } else {
        toast.error(result.error || 'Failed to delete message');
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          Actions
          <MoreHorizontal className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Message Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentStatus === 'unread' ? (
          <DropdownMenuItem 
            onClick={handleMarkAsRead}
            className="cursor-pointer"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Read
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleMarkAsUnread}
            className="cursor-pointer"
          >
            <Circle className="mr-2 h-4 w-4" />
            Mark as Unread
          </DropdownMenuItem>
        )}
        {currentStatus !== 'archived' && (
          <DropdownMenuItem 
            onClick={handleArchive}
            className="cursor-pointer"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className="cursor-pointer text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}