/**
 * Assessment Statistics Calculation Utilities
 */

import { AssessmentStats, Scope } from './assessment-stats-types';

export enum PerformanceLevel {
  CRITICAL = 'critical',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  HEALTHY = 'healthy',
  EXCELLENT = 'excellent'
}

export interface PerformanceLevelInfo {
  level: PerformanceLevel;
  label: string;
  riskLevel: string;
  color: string;
  minPercentage: number;
  maxPercentage?: number;
}

export const PERFORMANCE_LEVELS: PerformanceLevelInfo[] = [
  {
    level: PerformanceLevel.CRITICAL,
    label: 'Critical',
    riskLevel: 'High Risk',
    color: 'red',
    minPercentage: 0,
    maxPercentage: 40
  },
  {
    level: PerformanceLevel.NEEDS_IMPROVEMENT,
    label: 'Needs Improvement',
    riskLevel: 'Medium Risk',
    color: 'orange',
    minPercentage: 40,
    maxPercentage: 70
  },
  {
    level: PerformanceLevel.HEALTHY,
    label: 'Healthy',
    riskLevel: 'Low Risk',
    color: 'green',
    minPercentage: 70,
    maxPercentage: 85
  },
  {
    level: PerformanceLevel.EXCELLENT,
    label: 'Excellent',
    riskLevel: 'Very Low Risk',
    color: 'blue',
    minPercentage: 85
  }
];

export const HEALTHY_THRESHOLD = 70;

/**
 * Calculate global average percentage from API stats
 */
export function calculateGlobalAverage(stats: AssessmentStats): number {
  if (!stats || stats.totalMaxScore === 0) {
    return 0;
  }
  return roundPercentage((stats.totalScore / stats.totalMaxScore) * 100);
}

/**
 * Calculate scope average percentage
 */
export function calculateScopeAverage(scope: Pick<Scope, 'totalScore' | 'totalMaxScore'>): number {
  if (!scope || scope.totalMaxScore === 0) {
    return 0;
  }
  return roundPercentage((scope.totalScore / scope.totalMaxScore) * 100);
}

/**
 * Calculate user percentage score
 */
export function calculateUserPercentage(score: number, maxScore: number): number {
  if (maxScore === 0 || score < 0 || maxScore < 0) {
    return 0;
  }
  return roundPercentage((score / maxScore) * 100);
}

/**
 * Get performance level based on percentage
 */
export function getPerformanceLevel(percentage: number): PerformanceLevelInfo {
  const validPercentage = Math.max(0, Math.min(100, percentage));
  
  for (const level of PERFORMANCE_LEVELS) {
    if (level.maxPercentage === undefined) {
      if (validPercentage >= level.minPercentage) {
        return level;
      }
    } else if (validPercentage >= level.minPercentage && validPercentage < level.maxPercentage) {
      return level;
    }
  }
  
  return PERFORMANCE_LEVELS[0]; // Default to critical if no match
}

/**
 * Calculate gap to healthy threshold (70%)
 */
export function calculateGapToThreshold(currentPercentage: number, threshold: number = HEALTHY_THRESHOLD): number {
  if (currentPercentage >= threshold) {
    return 0;
  }
  return roundPercentage(threshold - currentPercentage);
}

/**
 * Calculate points needed to reach threshold
 */
export function calculatePointsToThreshold(
  currentScore: number,
  maxScore: number,
  threshold: number = HEALTHY_THRESHOLD
): number {
  if (maxScore === 0) {
    return 0;
  }
  
  const targetScore = (threshold / 100) * maxScore;
  const pointsNeeded = targetScore - currentScore;
  
  return Math.max(0, Math.round(pointsNeeded));
}

/**
 * Calculate difference from average (positive means above average)
 */
export function calculateDifferenceFromAverage(
  userPercentage: number,
  averagePercentage: number
): number {
  return roundPercentage(userPercentage - averagePercentage);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, includeSign: boolean = false): string {
  const rounded = roundPercentage(value);
  const sign = includeSign && rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

/**
 * Round percentage to 1 decimal place
 */
export function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Get comparison message based on user vs average
 */
export function getComparisonMessage(
  userPercentage: number,
  averagePercentage: number
): string {
  const difference = calculateDifferenceFromAverage(userPercentage, averagePercentage);
  
  if (Math.abs(difference) < 1) {
    return 'At the global average';
  } else if (difference > 0) {
    return `${formatPercentage(Math.abs(difference))} above average`;
  } else {
    return `${formatPercentage(Math.abs(difference))} below average`;
  }
}

/**
 * Get improvement message based on gap to threshold
 */
export function getImprovementMessage(
  currentPercentage: number,
  threshold: number = HEALTHY_THRESHOLD
): string {
  const gap = calculateGapToThreshold(currentPercentage, threshold);
  
  if (gap === 0) {
    const level = getPerformanceLevel(currentPercentage);
    return `${level.label} security posture`;
  }
  
  return `${formatPercentage(gap)} needed to reach healthy threshold`;
}

/**
 * Calculate statistics for a scope comparison
 */
export interface ScopeComparison {
  scopeKey: string;
  scopeName: string;
  userPercentage: number;
  globalAverage: number;
  difference: number;
  performanceLevel: PerformanceLevelInfo;
  gapToThreshold: number;
  pointsToThreshold: number;
  comparisonMessage: string;
  improvementMessage: string;
}

export function calculateScopeComparison(
  scopeKey: string,
  scopeName: string,
  userScore: number,
  userMaxScore: number,
  globalScope: Pick<Scope, 'totalScore' | 'totalMaxScore'>
): ScopeComparison {
  const userPercentage = calculateUserPercentage(userScore, userMaxScore);
  const globalAverage = calculateScopeAverage(globalScope);
  const difference = calculateDifferenceFromAverage(userPercentage, globalAverage);
  const performanceLevel = getPerformanceLevel(userPercentage);
  const gapToThreshold = calculateGapToThreshold(userPercentage);
  const pointsToThreshold = calculatePointsToThreshold(userScore, userMaxScore);
  const comparisonMessage = getComparisonMessage(userPercentage, globalAverage);
  const improvementMessage = getImprovementMessage(userPercentage);

  return {
    scopeKey,
    scopeName,
    userPercentage,
    globalAverage,
    difference,
    performanceLevel,
    gapToThreshold,
    pointsToThreshold,
    comparisonMessage,
    improvementMessage
  };
}

/**
 * Calculate overall statistics comparison
 */
export interface OverallComparison {
  userPercentage: number;
  globalAverage: number;
  difference: number;
  performanceLevel: PerformanceLevelInfo;
  gapToThreshold: number;
  pointsToThreshold: number;
  comparisonMessage: string;
  improvementMessage: string;
  scopeComparisons: ScopeComparison[];
}

export function calculateOverallComparison(
  userTotalScore: number,
  userMaxScore: number,
  stats: AssessmentStats,
  userScopes: Array<{
    key: string;
    name: string;
    score: number;
    maxScore: number;
  }>
): OverallComparison {
  const userPercentage = calculateUserPercentage(userTotalScore, userMaxScore);
  const globalAverage = calculateGlobalAverage(stats);
  const difference = calculateDifferenceFromAverage(userPercentage, globalAverage);
  const performanceLevel = getPerformanceLevel(userPercentage);
  const gapToThreshold = calculateGapToThreshold(userPercentage);
  const pointsToThreshold = calculatePointsToThreshold(userTotalScore, userMaxScore);
  const comparisonMessage = getComparisonMessage(userPercentage, globalAverage);
  const improvementMessage = getImprovementMessage(userPercentage);

  const scopeComparisons = userScopes.map(userScope => {
    const globalScope = stats.scopes.find(s => s.key === userScope.key);
    if (!globalScope) {
      return calculateScopeComparison(
        userScope.key,
        userScope.name,
        userScope.score,
        userScope.maxScore,
        { totalScore: 0, totalMaxScore: 1 }
      );
    }
    return calculateScopeComparison(
      userScope.key,
      userScope.name,
      userScope.score,
      userScope.maxScore,
      globalScope
    );
  });

  return {
    userPercentage,
    globalAverage,
    difference,
    performanceLevel,
    gapToThreshold,
    pointsToThreshold,
    comparisonMessage,
    improvementMessage,
    scopeComparisons
  };
}