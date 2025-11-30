import * as React from 'react';
import { ArrowUp, ArrowDown, Target, TrendingUp } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { formatPercentage } from '../../lib/minery/assessment-stats-calculations';

interface Translations {
  statistics?: Record<string, string>;
  [key: string]: unknown;
}

interface ComparisonMetricsProps {
  userPercentage: number;
  globalAverage: number;
  difference: number;
  gapToThreshold?: number;
  pointsToThreshold?: number;
  comparisonMessage?: string;
  improvementMessage?: string;
  className?: string;
  translations?: Translations;
}

export function ComparisonMetrics({
  userPercentage,
  globalAverage,
  difference,
  gapToThreshold,
  pointsToThreshold,
  comparisonMessage,
  improvementMessage,
  className,
  translations
}: ComparisonMetricsProps) {
  const isAboveAverage = difference > 0;
  const hasGap = gapToThreshold !== undefined && gapToThreshold > 0;

  // Format comparison message with translations
  const getTranslatedComparisonMessage = () => {
    if (!comparisonMessage) return '';
    
    // Parse the comparison message to extract the percentage and type
    if (comparisonMessage.includes('above average')) {
      const percentage = comparisonMessage.match(/([\d.]+%)/)?.[1];
      return `${percentage} ${translations?.statistics?.['aboveAverage'] || 'above average'}`;
    } else if (comparisonMessage.includes('below average')) {
      const percentage = comparisonMessage.match(/([\d.]+%)/)?.[1];
      return `${percentage} ${translations?.statistics?.['belowAverage'] || 'below average'}`;
    } else if (comparisonMessage === 'At the global average') {
      return translations?.statistics?.['atGlobalAverage'] || 'At the global average';
    }
    return comparisonMessage;
  };

  // Format improvement message with translations
  const getTranslatedImprovementMessage = () => {
    if (!improvementMessage) return '';
    
    // Parse the improvement message to extract the percentage
    if (improvementMessage.includes('needed to reach healthy threshold')) {
      const percentage = improvementMessage.match(/([\d.]+%)/)?.[1];
      return `${percentage} ${translations?.statistics?.['neededToReachHealthyThreshold'] || 'needed to reach healthy threshold'}`;
    } else if (improvementMessage.includes('security posture')) {
      // Extract the level (e.g., "Excellent", "Healthy", etc.)
      const level = improvementMessage.split(' security posture')[0];
      const levelKey = level.toLowerCase().replace(' ', '');
      const statistics = translations?.statistics;
      const translatedLevel = statistics && levelKey in statistics ? statistics[levelKey] : level;
      return `${translatedLevel} ${translations?.statistics?.['securityPosture'] || 'security posture'}`;
    }
    return improvementMessage;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground">{translations?.statistics?.['yourScore'] || 'Your Score'}</span>
        <span className="text-xl sm:text-2xl font-bold">{formatPercentage(userPercentage)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground">{translations?.statistics?.['globalAverage'] || 'Global Average'}</span>
        <span className="text-base sm:text-lg font-medium">{formatPercentage(globalAverage)}</span>
      </div>

      {comparisonMessage && (
        <div className="flex items-center gap-2 text-sm">
          {isAboveAverage ? (
            <ArrowUp className="h-4 w-4 text-green-600" />
          ) : difference < 0 ? (
            <ArrowDown className="h-4 w-4 text-red-600" />
          ) : (
            <TrendingUp className="h-4 w-4 text-gray-600" />
          )}
          <span className={cn(
            'font-medium',
            isAboveAverage ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'
          )}>
            {getTranslatedComparisonMessage()}
          </span>
        </div>
      )}

      {hasGap && improvementMessage && (
        <div className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-orange-600" />
          <span className="text-orange-600 font-medium">
            {getTranslatedImprovementMessage()}
          </span>
        </div>
      )}

      {pointsToThreshold !== undefined && pointsToThreshold > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{translations?.statistics?.['pointsToHealthy'] || 'Points to Healthy'}</span>
            <span className="font-medium">{pointsToThreshold} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}