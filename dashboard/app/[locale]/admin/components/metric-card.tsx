/**
 * Metric Card Component
 * Displays a single metric with icon, value, and optional trend
 * Styled with Singular Bank design
 */

import { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  className = '',
}: MetricCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <Card
      className={cn(
        'bg-white shadow-sm hover:shadow-md transition-shadow border-l-4',
        color === 'primary' && 'border-l-primary',
        color === 'success' && 'border-l-green-600',
        color === 'warning' && 'border-l-yellow-600',
        color === 'danger' && 'border-l-red-600',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2 rounded-lg bg-singular-gray">
            <Icon className={cn('h-4 w-4', colorClasses[color])} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-primary" />
              ) : trend === 'down' ? (
                <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
              ) : null}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' ? 'text-primary' : 'text-red-600'
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

