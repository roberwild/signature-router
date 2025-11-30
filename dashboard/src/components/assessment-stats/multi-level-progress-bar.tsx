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

interface MultiLevelProgressBarProps {
  value: number; // User's percentage (0-100)
  globalAverage?: number; // Global average percentage
  threshold?: number; // Healthy threshold (default 70)
  showLabels?: boolean;
  showAnimation?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MultiLevelProgressBar({
  value,
  globalAverage,
  threshold = 70,
  showLabels = true,
  showAnimation = true,
  height = 'md',
  className
}: MultiLevelProgressBarProps) {
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimated(true);
    }
  }, [showAnimation]);

  const performanceLevel = getPerformanceLevel(value);
  
  const getBarColor = () => {
    switch (performanceLevel.level) {
      case PerformanceLevel.CRITICAL:
        return 'bg-red-500';
      case PerformanceLevel.NEEDS_IMPROVEMENT:
        return 'bg-yellow-500';
      case PerformanceLevel.HEALTHY:
        return 'bg-green-500';
      case PerformanceLevel.EXCELLENT:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const _getBackgroundGradient = () => {
    return 'bg-gradient-to-r from-red-100 via-yellow-100 via-green-100 to-blue-100';
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const markerHeightClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8'
  };

  const barHeight = heightClasses[height];
  const _markerHeight = markerHeightClasses[height];

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {/* Marker labels above the progress bar */}
        <div className="relative h-6">
          {/* Threshold label */}
          {threshold && (
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${threshold}%` }}
            >
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                Threshold
              </span>
              <span className="text-xs text-gray-600">{threshold}%</span>
            </div>
          )}
          
          {/* Global average label */}
          {globalAverage !== undefined && (
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ 
                left: `${Math.min(100, Math.max(0, globalAverage))}%`,
                // Adjust position if too close to threshold
                top: Math.abs(globalAverage - (threshold || 0)) < 10 ? '0px' : '0px'
              }}
            >
              <span className="text-xs font-medium text-indigo-600 whitespace-nowrap">
                Global Avg
              </span>
              <span className="text-xs text-indigo-600">{globalAverage.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="relative">
          {/* Background bar with gradient */}
          <div 
            className={cn(
              'relative w-full overflow-hidden rounded-full bg-gray-100',
              barHeight
            )}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Performance score: ${value}%`}
          >
            {/* Filled portion representing user's score */}
            <div
              className={cn(
                'absolute left-0 top-0 h-full transition-all',
                getBarColor(),
                isAnimated ? 'duration-500 ease-out' : 'duration-0'
              )}
              style={{ width: isAnimated ? `${Math.min(100, Math.max(0, value))}%` : '0%' }}
            />
            
            {/* Threshold marker (70%) */}
            {threshold && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute top-0 bottom-0 w-0.5 bg-gray-700 opacity-80 hover:opacity-100 transition-opacity cursor-help'
                    )}
                    style={{ left: `${threshold}%` }}
                    aria-label={`Healthy threshold: ${threshold}%`}
                  >
                    {/* Triangle marker pointing down */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 
                      border-l-[4px] border-l-transparent
                      border-r-[4px] border-r-transparent
                      border-t-[6px] border-t-gray-700"
                    />
                    <span className="sr-only">Healthy threshold marker at {threshold}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Healthy Threshold: {threshold}%</p>
                  <p className="text-xs text-muted-foreground">Organizations above this score have good security</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Global average marker */}
            {globalAverage !== undefined && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute top-0 bottom-0 w-1 bg-indigo-600 opacity-80 hover:opacity-100 transition-opacity cursor-help'
                    )}
                    style={{ left: `${Math.min(100, Math.max(0, globalAverage))}%` }}
                    aria-label={`Global average: ${globalAverage}%`}
                  >
                    {/* Triangle marker pointing down */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 
                      border-l-[4px] border-l-transparent
                      border-r-[4px] border-r-transparent
                      border-t-[6px] border-t-indigo-600"
                    />
                    <span className="sr-only">Global average marker at {globalAverage}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Global Average: {globalAverage.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Average score across all organizations</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Labels */}
        {showLabels && (
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="font-medium">Your Score: {value.toFixed(1)}%</span>
              {globalAverage !== undefined && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block" />
                  <span className="hidden sm:inline">Global:</span>
                  <span className="sm:hidden">Avg:</span> {globalAverage.toFixed(1)}%
                </span>
              )}
              {threshold && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-700 rounded-full inline-block" />
                  <span className="hidden sm:inline">Threshold:</span>
                  <span className="sm:hidden">Goal:</span> {threshold}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}