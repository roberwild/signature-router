'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { PerformanceLevel, getPerformanceLevel } from '../../lib/minery/assessment-stats-calculations';

interface CompactProgressIndicatorProps {
  value: number;
  globalAverage?: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export function CompactProgressIndicator({
  value,
  globalAverage,
  size = 'md',
  showPercentage = true,
  className
}: CompactProgressIndicatorProps) {
  const performanceLevel = getPerformanceLevel(value);
  const isAboveAverage = globalAverage ? value > globalAverage : false;

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const getStrokeColor = () => {
    switch (performanceLevel.level) {
      case PerformanceLevel.CRITICAL:
        return 'stroke-red-500';
      case PerformanceLevel.NEEDS_IMPROVEMENT:
        return 'stroke-yellow-500';
      case PerformanceLevel.HEALTHY:
        return 'stroke-green-500';
      case PerformanceLevel.EXCELLENT:
        return 'stroke-blue-500';
      default:
        return 'stroke-gray-500';
    }
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const averageAngle = globalAverage ? (globalAverage / 100) * 360 - 90 : 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', sizeClasses[size], className)}>
      <svg
        className="transform -rotate-90"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        aria-label={`Performance score: ${value}%`}
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="4"
          fill="none"
          className={cn('transition-all duration-500 ease-out', getStrokeColor())}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        
        {/* Global average marker */}
        {globalAverage !== undefined && (
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="5"
            stroke="currentColor"
            strokeWidth="2"
            className="text-indigo-600"
            transform={`rotate(${averageAngle} 50 50)`}
            opacity="0.7"
          />
        )}
      </svg>
      
      {/* Center text */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', textSizeClasses[size])}>
            {value.toFixed(0)}%
          </span>
          {isAboveAverage && (
            <span className="text-xs text-green-600 font-medium">
              Above Avg
            </span>
          )}
          {!isAboveAverage && globalAverage !== undefined && (
            <span className="text-xs text-orange-600 font-medium">
              Below Avg
            </span>
          )}
        </div>
      )}
    </div>
  );
}