'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { MessageSquare, Clock, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { RecentActivity } from '~/data/admin/questionnaires/get-dashboard-metrics';

interface ActivityFeedProps {
  activities: RecentActivity[];
  loading?: boolean;
}

const categoryColors = {
  A1: 'bg-green-500',
  B1: 'bg-blue-500',
  C1: 'bg-yellow-500',
  D1: 'bg-red-500'
};

const categoryLabels = {
  A1: 'High Priority',
  B1: 'Medium Priority',
  C1: 'Low Priority',
  D1: 'Minimal Priority'
};

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 20 questionnaire completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 20 questionnaire completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Completed questionnaires will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Last 20 questionnaire completions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={categoryColors[activity.category as keyof typeof categoryColors] || 'bg-gray-500'}>
                    {activity.leadName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{activity.leadName}</p>
                      <p className="text-xs text-muted-foreground">{activity.leadEmail}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[activity.category as keyof typeof categoryLabels] || activity.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{activity.questionsAnswered} questions</span>
                    </div>
                    {activity.score && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        <span>Score: {activity.score}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(activity.completedAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}