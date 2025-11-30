import * as React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';
import { PerformanceLevel, type PerformanceLevelInfo } from '../../lib/minery/assessment-stats-calculations';

interface PerformanceBadgeProps {
  performanceLevel: PerformanceLevelInfo;
  className?: string;
  showRiskLevel?: boolean;
  translations?: {
    statistics?: Record<string, string>;
  };
}

export function PerformanceBadge({ 
  performanceLevel, 
  className,
  showRiskLevel = false,
  translations 
}: PerformanceBadgeProps) {
  const _getVariant = () => {
    switch (performanceLevel.level) {
      case PerformanceLevel.CRITICAL:
        return 'destructive';
      case PerformanceLevel.NEEDS_IMPROVEMENT:
        return 'secondary';
      case PerformanceLevel.HEALTHY:
        return 'default';
      case PerformanceLevel.EXCELLENT:
        return 'default';
      default:
        return 'outline';
    }
  };

  const getColorClass = () => {
    switch (performanceLevel.level) {
      case PerformanceLevel.CRITICAL:
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200 dark:bg-red-900/60 dark:text-red-200 dark:hover:bg-red-900/80 dark:border-red-700';
      case PerformanceLevel.NEEDS_IMPROVEMENT:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-200 dark:hover:bg-yellow-900/80 dark:border-yellow-700';
      case PerformanceLevel.HEALTHY:
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/60 dark:text-green-200 dark:hover:bg-green-900/80 dark:border-green-700';
      case PerformanceLevel.EXCELLENT:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:hover:bg-blue-900/80 dark:border-blue-700';
      default:
        return '';
    }
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        getColorClass(),
        'font-medium text-xs sm:text-sm px-2 py-1 sm:px-2.5 sm:py-0.5',
        className
      )}
    >
      {showRiskLevel 
        ? (translations?.statistics?.[performanceLevel.riskLevel.toLowerCase().replace(/\s+/g, '')] || performanceLevel.riskLevel)
        : (translations?.statistics?.[performanceLevel.label.toLowerCase()] || performanceLevel.label)
      }
    </Badge>
  );
}