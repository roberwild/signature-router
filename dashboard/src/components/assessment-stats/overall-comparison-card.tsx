'use client';

import * as React from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { type OverallComparison } from '../../lib/minery/assessment-stats-calculations';
import { PerformanceBadge } from './performance-badge';
import { ComparisonMetrics } from './comparison-metrics';
import { LinearComparisonBar } from './linear-comparison-bar';

interface OverallComparisonCardProps {
  comparison: OverallComparison;
  isLoading?: boolean;
  error?: string;
  translations?: {
    statistics?: {
      overallStatistics?: string;
      overallDescription?: string;
      unableToLoadStatistics?: string;
      failedToFetchStatistics?: string;
      scoreComparison?: string;
      performanceSummary?: string;
      goodSecurityPosture?: string;
      securityPostureDescription?: string;
      improvementNeeded?: string;
      improvementNeededDescription?: string;
      criticalSecurityGaps?: string;
      criticalSecurityGapsDescription?: string;
      healthyThreshold?: string;
      yourPosition?: string;
      above?: string;
      below?: string;
      at?: string;
      average?: string;
    };
  };
}

export function OverallComparisonCard({
  comparison,
  isLoading = false,
  error,
  translations
}: OverallComparisonCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {translations?.statistics?.overallStatistics || 'Overall Assessment Statistics'}
          </CardTitle>
          <CardDescription>
            {translations?.statistics?.overallDescription || 'Your security posture compared to global averages'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <div>
              <AlertTitle className="ml-6 mt-1">{translations?.statistics?.unableToLoadStatistics || 'Unable to load statistics'}</AlertTitle>
              <AlertDescription className="mt-1">
                {error || translations?.statistics?.failedToFetchStatistics || 'Failed to fetch global statistics. Your assessment results are still available.'}
              </AlertDescription>
            </div>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isHealthy = comparison.performanceLevel.minPercentage >= 70;
  const needsImprovement = comparison.performanceLevel.minPercentage < 70 && comparison.performanceLevel.minPercentage >= 40;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {translations?.statistics?.overallStatistics || 'Overall Assessment Statistics'}
            </CardTitle>
            <CardDescription>
              {translations?.statistics?.overallDescription || 'Your security posture compared to global averages'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <PerformanceBadge 
              performanceLevel={comparison.performanceLevel} 
              showRiskLevel={true}
              translations={translations}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <LinearComparisonBar
          userScore={comparison.userPercentage}
          globalAverage={comparison.globalAverage}
          threshold={70}
          size="md"
          showAnimation={true}
          translations={translations}
        />
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium mb-3">{translations?.statistics?.scoreComparison || 'Overall Score Comparison'}</h3>
            <ComparisonMetrics
              userPercentage={comparison.userPercentage}
              globalAverage={comparison.globalAverage}
              difference={comparison.difference}
              gapToThreshold={comparison.gapToThreshold}
              pointsToThreshold={comparison.pointsToThreshold}
              comparisonMessage={comparison.comparisonMessage}
              improvementMessage={comparison.improvementMessage}
              translations={translations}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">{translations?.statistics?.performanceSummary || 'Performance Summary'}</h3>
            
            {isHealthy && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-600 dark:bg-green-900/50">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div>
                  <AlertTitle className="ml-6 mt-1 text-green-800 dark:text-green-200">{translations?.statistics?.goodSecurityPosture || 'Good Security Posture'}</AlertTitle>
                  <AlertDescription className="mt-1 text-green-700 dark:text-green-300">
                    {translations?.statistics?.securityPostureDescription || 'Your organization has a healthy security posture. Continue monitoring and improving.'}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {needsImprovement && (
              <Alert className="border-yellow-300 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/50">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <AlertTitle className="ml-6 mt-1 text-yellow-800 dark:text-yellow-200">{translations?.statistics?.improvementNeeded || 'Improvement Needed'}</AlertTitle>
                  <AlertDescription className="mt-1 text-yellow-700 dark:text-yellow-300">
                    {translations?.statistics?.improvementNeededDescription || 'Your security posture needs attention. Focus on areas below the healthy threshold.'}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {comparison.performanceLevel.minPercentage < 40 && (
              <Alert className="border-red-300 bg-red-100 dark:border-red-600 dark:bg-red-900/50">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <div>
                  <AlertTitle className="ml-6 mt-1 text-red-800 dark:text-red-200">{translations?.statistics?.criticalSecurityGaps || 'Critical Security Gaps'}</AlertTitle>
                  <AlertDescription className="mt-1 text-red-700 dark:text-red-300">
                    {translations?.statistics?.criticalSecurityGapsDescription || 'Immediate action required to address critical security vulnerabilities.'}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{translations?.statistics?.healthyThreshold || 'Healthy Threshold'}</span>
                <span className="font-medium">70%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{translations?.statistics?.yourPosition || 'Your Position'}</span>
                <span className="font-medium">
                  {comparison.difference > 0 ? (translations?.statistics?.above || 'Above') : comparison.difference < 0 ? (translations?.statistics?.below || 'Below') : (translations?.statistics?.at || 'At')} {translations?.statistics?.average || 'Average'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}