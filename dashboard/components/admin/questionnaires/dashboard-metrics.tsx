'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { 
  BarChart3, 
  Users, 
  ClipboardList, 
  Target,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { DashboardMetrics } from '~/data/admin/questionnaires/get-dashboard-metrics';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
}

function MetricCard({ title, value, description, icon, trend, loading }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{value}</div>
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center text-xs",
                  trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  metrics: DashboardMetrics | null | undefined;
  loading?: boolean;
}

export function DashboardMetricsCards({ metrics, loading }: DashboardMetricsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Completion Rate"
        value={metrics?.completionRate ? `${metrics.completionRate}%` : '0%'}
        description="Last 30 days"
        icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      
      <MetricCard
        title="Active Sessions"
        value={metrics?.activeSessions || 0}
        description="Currently active"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      
      <MetricCard
        title="Today's Responses"
        value={metrics?.todaysResponses || 0}
        description="Last 24 hours"
        icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
      
      <MetricCard
        title="Avg Lead Score"
        value={metrics?.avgLeadScore || '-'}
        description="Last 30 days"
        icon={<Target className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
    </div>
  );
}

interface SystemHealthProps {
  health: DashboardMetrics['systemHealth'] | undefined;
}

export function SystemHealthIndicator({ health }: SystemHealthProps) {
  if (!health) return null;

  const statusColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500'
  };

  const statusText = {
    operational: 'All systems operational',
    degraded: 'Experiencing degraded performance',
    down: 'System is currently down'
  };

  return (
    <div className="flex items-center gap-2">
      <Activity className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-2 w-2 rounded-full animate-pulse",
          statusColors[health.status]
        )} />
        <span className="text-sm text-muted-foreground">
          {statusText[health.status]}
        </span>
      </div>
      {health.activeSessionCount > 0 && (
        <span className="text-sm text-muted-foreground">
          • {health.activeSessionCount} active {health.activeSessionCount === 1 ? 'session' : 'sessions'}
        </span>
      )}
    </div>
  );
}