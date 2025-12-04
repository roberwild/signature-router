'use client';

import { RoutingEvent } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SendHorizontal,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoutingTimelineProps {
  events: RoutingEvent[];
  className?: string;
}

export function RoutingTimeline({ events, className }: RoutingTimelineProps) {
  const getEventIcon = (eventType?: string) => {
    if (!eventType) return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    const upperType = eventType.toUpperCase();
    if (upperType.includes('COMPLETED') || upperType.includes('SUCCESS')) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (upperType.includes('FAILED') || upperType.includes('ERROR')) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (upperType.includes('FALLBACK') || upperType.includes('RETRY')) {
      return <RefreshCw className="h-5 w-5 text-orange-600" />;
    }
    if (upperType.includes('SENT') || upperType.includes('CHALLENGE')) {
      return <SendHorizontal className="h-5 w-5 text-blue-600" />;
    }
    if (upperType.includes('PENDING') || upperType.includes('INITIATED')) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-gray-600" />;
  };

  const getEventColor = (eventType?: string) => {
    if (!eventType) return 'bg-gray-500/10 text-gray-700 border-gray-200';
    const upperType = eventType.toUpperCase();
    if (upperType.includes('COMPLETED') || upperType.includes('SUCCESS')) {
      return 'bg-green-500/10 text-green-700 border-green-200';
    }
    if (upperType.includes('FAILED') || upperType.includes('ERROR')) {
      return 'bg-red-500/10 text-red-700 border-red-200';
    }
    if (upperType.includes('FALLBACK') || upperType.includes('RETRY')) {
      return 'bg-orange-500/10 text-orange-700 border-orange-200';
    }
    if (upperType.includes('SENT') || upperType.includes('CHALLENGE')) {
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    }
    if (upperType.includes('PENDING') || upperType.includes('INITIATED')) {
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    }
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getChannelBadge = (channel: string | null | undefined) => {
    if (!channel) return null;

    const colors = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
    };

    return (
      <Badge variant="outline" className={`text-xs ${colors[channel as keyof typeof colors] || ''}`}>
        {channel}
      </Badge>
    );
  };

  const formatEventType = (type?: string) => {
    if (!type) return 'Unknown';
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className={className}>
      <div className="space-y-3">
        {sortedEvents.map((event, index) => {
          const isLast = index === sortedEvents.length - 1;
          const timestamp = event.timestamp ? parseISO(event.timestamp) : new Date();

          return (
            <div key={index} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[18px] top-[40px] h-[calc(100%+12px)] w-0.5 bg-border" />
              )}

              <Card className="relative bg-white dark:bg-card shadow-sm border-l-4 border-l-primary/20 hover:border-l-primary/60 transition-colors">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getEventIcon(event.eventType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={getEventColor(event.eventType)}
                            >
                              {formatEventType(event.eventType)}
                            </Badge>

                            {/* Channel transition */}
                            {(event.fromChannel || event.toChannel) && (
                              <div className="flex items-center gap-1.5 text-sm">
                                {event.fromChannel && getChannelBadge(event.fromChannel)}
                                {event.fromChannel && event.toChannel && (
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                )}
                                {event.toChannel && getChannelBadge(event.toChannel)}
                              </div>
                            )}
                          </div>

                          {event.reason && (
                            <p className="text-sm text-muted-foreground">
                              {event.reason}
                            </p>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-mono text-muted-foreground">
                            {format(timestamp, 'HH:mm:ss')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(timestamp, {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <Card className="bg-muted/30">
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay eventos en el timeline de routing
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
