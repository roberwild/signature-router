'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { PerformanceLevel, getPerformanceLevel } from '../../lib/minery/assessment-stats-calculations';

interface Translations {
  statistics?: Record<string, string>;
  [key: string]: unknown;
}

interface LinearComparisonBarProps {
  userScore: number;
  globalAverage: number;
  threshold?: number;
  showAnimation?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  translations?: Translations;
}

export function LinearComparisonBar({
  userScore,
  globalAverage,
  threshold = 70,
  showAnimation = true,
  className,
  size = 'md',
  translations
}: LinearComparisonBarProps) {
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimated(true);
    }
  }, [showAnimation]);

  const performanceLevel = getPerformanceLevel(userScore);
  
  const getUserBarColor = () => {
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

  const sizeConfig = {
    sm: {
      barHeight: 'h-2',
      userBarHeight: 'h-3',
      spacing: 'space-y-2',
      fontSize: 'text-xs',
      labelWidth: 'w-20'
    },
    md: {
      barHeight: 'h-3',
      userBarHeight: 'h-4',
      spacing: 'space-y-3',
      fontSize: 'text-sm',
      labelWidth: 'w-24'
    },
    lg: {
      barHeight: 'h-4',
      userBarHeight: 'h-5',
      spacing: 'space-y-4',
      fontSize: 'text-base',
      labelWidth: 'w-28'
    }
  };

  const config = sizeConfig[size];

  const bars = [
    {
      label: translations?.statistics?.['yourScore'] || 'Your Score',
      value: userScore,
      color: getUserBarColor(),
      height: config.userBarHeight,
      isMain: true
    },
    {
      label: translations?.statistics?.['globalAvg'] || 'Global Avg',
      value: globalAverage,
      color: 'bg-indigo-500',
      height: config.barHeight,
      isMain: false
    }
  ];

  return (
    <div className={cn(config.spacing, className)}>
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className={cn(
              config.fontSize,
              config.labelWidth,
              'text-muted-foreground',
              bar.isMain && 'font-semibold text-foreground'
            )}>
              {bar.label}
            </span>
            
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                {/* Progress bar container */}
                <div className={cn(
                  "relative rounded-full overflow-hidden",
                  bar.height,
                  "bg-secondary/30"
                )}>
                  <div
                    className={cn(
                      'h-full transition-all rounded-full',
                      bar.color,
                      isAnimated ? 'duration-500 ease-out' : 'duration-0',
                      bar.isMain && 'shadow-md'
                    )}
                    style={{ width: isAnimated ? `${Math.min(100, Math.max(0, bar.value))}%` : '0%' }}
                    role="progressbar"
                    aria-valuenow={bar.value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${bar.label}: ${bar.value}%`}
                  />
                </div>
                
                {/* Threshold vertical line */}
                {threshold && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-600"
                    style={{ 
                      left: `${threshold}%`,
                      height: '100%',
                      backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 3px, rgb(75 85 99) 3px, rgb(75 85 99) 6px)'
                    }}
                    aria-label={`Healthy threshold at ${threshold}%`}
                  >
                    {/* Threshold label - only show on main bar */}
                    {bar.isMain && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                        {translations?.statistics?.['threshold'] || 'Threshold'} {threshold}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <span className={cn(
                config.fontSize,
                'min-w-[3rem] text-right',
                bar.isMain ? 'font-semibold' : 'text-muted-foreground'
              )}>
                {bar.value.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance indicator text */}
      {size !== 'sm' && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', getUserBarColor())} />
            <span className={cn(config.fontSize, 'text-muted-foreground')}>
              {translations?.statistics?.[performanceLevel.label.toLowerCase().replace(' ', '')] || performanceLevel.label}
            </span>
          </div>
          {userScore >= threshold ? (
            <span className={cn(config.fontSize, 'text-green-600 font-medium')}>
              ✓ {translations?.statistics?.['aboveThreshold'] || 'Above Threshold'}
            </span>
          ) : (
            <span className={cn(config.fontSize, 'text-muted-foreground')}>
              {(threshold - userScore).toFixed(1)}% {translations?.statistics?.['toThreshold'] || 'to threshold'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}