/**
 * TypeScript interfaces for Assessment Statistics API
 */

export interface Scope {
  key: 'personas' | 'procesos' | 'tecnologias';
  name?: string;
  totalScore: number;
  totalMaxScore: number;
}

export interface AssessmentStats {
  totalScore: number;
  totalMaxScore: number;
  scopes: Scope[];
}

export interface AssessmentStatsResponse {
  data?: AssessmentStats;
  error?: string;
  retryCount?: number;
}

export class AssessmentStatsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AssessmentStatsError';
  }
}

export class NetworkError extends AssessmentStatsError {
  constructor(message: string, originalError?: unknown) {
    super(message, undefined, originalError);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AssessmentStatsError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AssessmentStatsError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}