'use client';

import React from 'react';
import { StatisticsSection } from '~/src/components/assessment-stats';
import { useAssessmentStats } from '~/src/hooks/use-assessment-stats';
import { AssessmentStatsErrorBoundary } from '~/src/components/assessment-stats/error-boundary';

interface AssessmentStatsWrapperProps {
  userScores: {
    total: number;
    personas: number;
    procesos: number;
    sistemas: number;
  };
  className?: string;
  translations?: {
    statistics?: Record<string, string>;
    [key: string]: unknown;
  };
}

export function AssessmentStatsWrapper({ 
  userScores,
  className,
  translations 
}: AssessmentStatsWrapperProps) {
  const { comparison, isLoading, error } = useAssessmentStats({
    userScores,
    enabled: true
  });

  // Don't render anything if there's no data and not loading
  if (!isLoading && !error && !comparison) {
    return null;
  }

  return (
    <AssessmentStatsErrorBoundary>
      <StatisticsSection
        comparison={comparison}
        isLoading={isLoading}
        error={error || undefined}
        className={className}
        translations={translations}
      />
    </AssessmentStatsErrorBoundary>
  );
}