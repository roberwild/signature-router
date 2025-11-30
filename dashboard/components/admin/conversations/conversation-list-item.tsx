'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  Loader2,
  Building2,
  Paperclip
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';

interface ConversationListItemProps {
  id: string;
  contactName: string;
  organizationName: string;
  serviceName: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  hasAttachments?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

const statusConfig: Record<string, {
  label: string;
  icon: typeof Clock;
  color: string;
  animate?: boolean;
}> = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400'
  },
  contacted: {
    label: 'Contactado',
    icon: MessageCircle,
    color: 'text-blue-600 dark:text-blue-400'
  },
  'in-progress': {
    label: 'En Progreso',
    icon: Loader2,
    color: 'text-orange-600 dark:text-orange-400',
    animate: true
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400'
  }
};

export function ConversationListItem({
  contactName,
  organizationName,
  serviceName,
  status,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  hasAttachments,
  isSelected,
  onClick
}: ConversationListItemProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const StatusIcon = statusConfig[status].icon;

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 text-left transition-all duration-200 hover:bg-muted/50',
        'border-b border-border/50',
        isSelected && 'bg-muted border-l-4 border-l-primary',
        unreadCount > 0 && 'bg-primary/5 dark:bg-primary/10',
        isAnimating && 'animate-pulse'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(contactName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {contactName}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  {organizationName}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              <StatusIcon
                className={cn(
                  'h-4 w-4',
                  statusConfig[status].color,
                  statusConfig[status].animate && 'animate-spin'
                )}
              />
            </div>
          </div>

          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {serviceName}
            </Badge>
          </div>

          {lastMessage && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-muted-foreground truncate">
                {lastMessage}
              </p>
              {hasAttachments && (
                <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          )}

          {lastMessageTime && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(lastMessageTime), {
                addSuffix: true,
                locale: es
              })}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}