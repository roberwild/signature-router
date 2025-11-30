'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { PerformanceLevel, getPerformanceLevel } from '../../lib/minery/assessment-stats-calculations';

interface Segment {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

interface SegmentedProgressBarProps {
  segments: Segment[];
  showLabels?: boolean;
  showTooltips?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SegmentedProgressBar({
  segments,
  showLabels = true,
  showTooltips = true,
  height = 'md',
  className
}: SegmentedProgressBarProps) {
  const heightClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  const getSegmentColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    const level = getPerformanceLevel(percentage);
    
    switch (level.level) {
      case PerformanceLevel.CRITICAL:
        return 'bg-red-500 hover:bg-red-600';
      case PerformanceLevel.NEEDS_IMPROVEMENT:
        return 'bg-yellow-500 hover:bg-yellow-600';
      case PerformanceLevel.HEALTHY:
        return 'bg-green-500 hover:bg-green-600';
      case PerformanceLevel.EXCELLENT:
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const totalMaxValue = segments.reduce((sum, seg) => sum + seg.maxValue, 0);

  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        <div 
          className={cn(
            'flex w-full overflow-hidden rounded-lg bg-gray-100',
            heightClasses[height]
          )}
          role="group"
          aria-label="Segmented progress bar"
        >
          {segments.map((segment, _index) => {
            const percentage = (segment.value / segment.maxValue) * 100;
            const segmentWidth = (segment.maxValue / totalMaxValue) * 100;
            const fillWidth = (segment.value / segment.maxValue) * 100;

            const SegmentContent = (
              <div
                key={segment.label}
                className="relative flex-shrink-0 border-r border-gray-300 last:border-r-0"
                style={{ width: `${segmentWidth}%` }}
              >
                <div
                  className={cn(
                    'h-full transition-all duration-500 ease-out',
                    segment.color || getSegmentColor(segment.value, segment.maxValue)
                  )}
                  style={{ width: `${fillWidth}%` }}
                  role="progressbar"
                  aria-valuenow={segment.value}
                  aria-valuemin={0}
                  aria-valuemax={segment.maxValue}
                  aria-label={`${segment.label}: ${percentage.toFixed(1)}%`}
                />
              </div>
            );

            if (showTooltips) {
              return (
                <Tooltip key={segment.label}>
                  <TooltipTrigger asChild>
                    {SegmentContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{segment.label}</p>
                      <p>{segment.value}/{segment.maxValue} ({percentage.toFixed(1)}%)</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return SegmentContent;
          })}
        </div>

        {showLabels && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            {segments.map((segment) => {
              const percentage = (segment.value / segment.maxValue) * 100;
              const _level = getPerformanceLevel(percentage);
              
              return (
                <div key={segment.label} className="flex items-center gap-2">
                  <div 
                    className={cn(
                      'w-3 h-3 rounded-full',
                      segment.color?.replace('bg-', 'bg-') || 
                      getSegmentColor(segment.value, segment.maxValue).replace('hover:bg-', '').replace(' ', ' bg-')
                    )}
                  />
                  <span className="text-muted-foreground">
                    {segment.label}: {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}