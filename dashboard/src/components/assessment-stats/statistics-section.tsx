'use client';

import * as React from 'react';
import { type OverallComparison, PerformanceLevel } from '../../lib/minery/assessment-stats-calculations';
import { OverallComparisonCard } from './overall-comparison-card';
import { DomainComparisonCard } from './domain-comparison-card';

interface StatisticsSectionProps {
  comparison: OverallComparison | null;
  isLoading?: boolean;
  error?: string;
  className?: string;
  translations?: {
    statistics?: Record<string, string>;
    [key: string]: unknown;
  };
}

export function StatisticsSection({
  comparison,
  isLoading = false,
  error,
  className,
  translations
}: StatisticsSectionProps) {
  if (!comparison && !isLoading && !error) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
            {translations?.statistics?.['title'] || 'Assessment Statistics'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {translations?.statistics?.['description'] || 'See how your security assessment compares to organizations globally'}
          </p>
        </div>

        <OverallComparisonCard
          translations={translations}
          comparison={comparison || {
            userPercentage: 0,
            globalAverage: 0,
            difference: 0,
            performanceLevel: {
              level: PerformanceLevel.CRITICAL,
              label: 'Unknown',
              riskLevel: 'Unknown',
              color: 'gray',
              minPercentage: 0
            },
            gapToThreshold: 0,
            pointsToThreshold: 0,
            comparisonMessage: '',
            improvementMessage: '',
            scopeComparisons: []
          }}
          isLoading={isLoading}
          error={error}
        />

        {comparison && comparison.scopeComparisons.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.scopeComparisons.map((scopeComparison) => (
              <DomainComparisonCard
                key={scopeComparison.scopeKey}
                scopeComparison={scopeComparison}
                isLoading={isLoading}
                translations={translations}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}