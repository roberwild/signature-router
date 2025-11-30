/**
 * Assessment Statistics API Client
 */

import {
  AssessmentStats,
  AssessmentStatsResponse,
  NetworkError,
  AuthenticationError,
  ValidationError,
  AssessmentStatsError
} from './assessment-stats-types';

// Use our API route instead of calling external API directly from client
const API_ENDPOINT = '/api/assessment-stats';

const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface FetchOptions {
  usePreproduction?: boolean;
  signal?: AbortSignal;
}

function validateAssessmentStats(data: unknown): AssessmentStats {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid response: data is not an object');
  }

  const statsData = data as Record<string, unknown>;

  if (typeof statsData.totalScore !== 'number') {
    throw new ValidationError('Invalid response: totalScore is not a number');
  }

  if (typeof statsData.totalMaxScore !== 'number') {
    throw new ValidationError('Invalid response: totalMaxScore is not a number');
  }

  if (!Array.isArray(statsData.scopes)) {
    throw new ValidationError('Invalid response: scopes is not an array');
  }

  for (const scope of statsData.scopes) {
    if (!scope || typeof scope !== 'object') {
      throw new ValidationError('Invalid response: scope is not an object');
    }

    if (!['personas', 'procesos', 'tecnologias'].includes(scope.key)) {
      throw new ValidationError(`Invalid response: invalid scope key "${scope.key}"`);
    }

    if (typeof scope.totalScore !== 'number') {
      throw new ValidationError(`Invalid response: scope ${scope.key} totalScore is not a number`);
    }

    if (typeof scope.totalMaxScore !== 'number') {
      throw new ValidationError(`Invalid response: scope ${scope.key} totalMaxScore is not a number`);
    }
  }

  return statsData as unknown as AssessmentStats;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  endpoint: string,
  options: RequestInit,
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(endpoint, options);
    
    if (response.status === 401) {
      throw new AuthenticationError('Unauthorized: Invalid API key');
    }

    if (!response.ok && retryCount < MAX_RETRY_ATTEMPTS - 1) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(`Request failed with status ${response.status}. Retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchWithRetry(endpoint, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.warn(`Request failed: ${error}. Retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchWithRetry(endpoint, options, retryCount + 1);
    }

    if (error instanceof Error) {
      throw new NetworkError(`Network error after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`, error);
    }
    
    throw new NetworkError(`Unknown network error after ${MAX_RETRY_ATTEMPTS} attempts`, error);
  }
}

export async function fetchAssessmentStats(
  options: FetchOptions = {}
): Promise<AssessmentStatsResponse> {
  const { usePreproduction = false, signal } = options;
  const endpoint = usePreproduction ? `${API_ENDPOINT}?preproduction=true` : API_ENDPOINT;

  try {
    const response = await fetchWithRetry(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      throw new AssessmentStatsError(
        `API request failed with status ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    const validatedData = validateAssessmentStats(data);

    return {
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof AssessmentStatsError) {
      console.error('Assessment stats error:', error.message);
      return {
        error: error.message,
        retryCount: MAX_RETRY_ATTEMPTS,
      };
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error fetching assessment stats:', errorMessage);
    
    return {
      error: errorMessage,
      retryCount: MAX_RETRY_ATTEMPTS,
    };
  }
}

export function calculateGlobalAveragePercentage(stats: AssessmentStats): number {
  if (stats.totalMaxScore === 0) return 0;
  return (stats.totalScore / stats.totalMaxScore) * 100;
}

export function calculateScopeAveragePercentage(scope: { totalScore: number; totalMaxScore: number }): number {
  if (scope.totalMaxScore === 0) return 0;
  return (scope.totalScore / scope.totalMaxScore) * 100;
}