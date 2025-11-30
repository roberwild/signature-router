'use client';

import * as React from 'react';
import { Users, Settings, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { type ScopeComparison } from '../../lib/minery/assessment-stats-calculations';
import { PerformanceBadge } from './performance-badge';
import { ComparisonMetrics } from './comparison-metrics';
import { LinearComparisonBar } from './linear-comparison-bar';

interface Translations {
  statistics?: Record<string, string>;
  [key: string]: unknown;
}

interface DomainComparisonCardProps {
  scopeComparison: ScopeComparison;
  isLoading?: boolean;
  error?: string;
  translations?: Translations;
}

const getDomainIcon = (scopeKey: string) => {
  switch (scopeKey) {
    case 'personas':
      return Users;
    case 'procesos':
      return Settings;
    case 'tecnologias':
      return Shield;
    default:
      return Shield;
  }
};

const getDomainDescription = (scopeKey: string, translations?: Translations) => {
  switch (scopeKey) {
    case 'personas':
      return translations?.statistics?.['securityAwareness'] || 'Security awareness and training';
    case 'procesos':
      return translations?.statistics?.['securityProcesses'] || 'Security processes and procedures';
    case 'tecnologias':
      return translations?.statistics?.['technicalControls'] || 'Technical security controls';
    default:
      return translations?.statistics?.['securityDomainAssessment'] || 'Security domain assessment';
  }
};

export function DomainComparisonCard({
  scopeComparison,
  isLoading = false,
  error,
  translations
}: DomainComparisonCardProps) {
  const Icon = getDomainIcon(scopeComparison.scopeKey);
  const description = getDomainDescription(scopeComparison.scopeKey, translations);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {scopeComparison.scopeName}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {scopeComparison.scopeName}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <PerformanceBadge performanceLevel={scopeComparison.performanceLevel} translations={translations} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LinearComparisonBar
          userScore={scopeComparison.userPercentage}
          globalAverage={scopeComparison.globalAverage}
          threshold={70}
          size="sm"
          showAnimation={true}
          translations={translations}
        />
        <ComparisonMetrics
          userPercentage={scopeComparison.userPercentage}
          globalAverage={scopeComparison.globalAverage}
          difference={scopeComparison.difference}
          gapToThreshold={scopeComparison.gapToThreshold}
          pointsToThreshold={scopeComparison.pointsToThreshold}
          comparisonMessage={scopeComparison.comparisonMessage}
          improvementMessage={scopeComparison.improvementMessage}
          translations={translations}
        />
      </CardContent>
    </Card>
  );
}