'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAssessmentStats } from '../lib/minery/assessment-stats-client';
import { calculateOverallComparison } from '../lib/minery/assessment-stats-calculations';
import type { AssessmentStats, AssessmentStatsResponse } from '../lib/minery/assessment-stats-types';
import type { OverallComparison } from '../lib/minery/assessment-stats-calculations';

interface UseAssessmentStatsOptions {
  userScores: {
    total: number;
    personas: number;
    procesos: number;
    sistemas: number;
  };
  maxScores?: {
    total: number;
    personas: number;
    procesos: number;
    sistemas: number;
  };
  enabled?: boolean;
  usePreproduction?: boolean;
}

interface UseAssessmentStatsReturn {
  comparison: OverallComparison | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const CACHE_KEY = 'assessment_stats_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  data: AssessmentStats;
  timestamp: number;
}

function getCachedData(): AssessmentStats | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

function setCachedData(data: AssessmentStats) {
  if (typeof window === 'undefined') return;
  
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore cache write errors
  }
}

export function useAssessmentStats({
  userScores,
  maxScores = {
    total: 100,
    personas: 100,
    procesos: 100,
    sistemas: 100
  },
  enabled = true,
  usePreproduction = false
}: UseAssessmentStatsOptions): UseAssessmentStatsReturn {
  const [comparison, setComparison] = useState<OverallComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCalculate = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      let stats = getCachedData();
      
      if (!stats) {
        // Fetch from API
        const response: AssessmentStatsResponse = await fetchAssessmentStats({
          usePreproduction
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (!response.data) {
          throw new Error('No data received from API');
        }
        
        stats = response.data;
        setCachedData(stats);
      }
      
      // Calculate comparison
      const userScopesData = [
        {
          key: 'personas',
          name: 'Personas',
          score: userScores.personas,
          maxScore: maxScores.personas
        },
        {
          key: 'procesos',
          name: 'Procesos',
          score: userScores.procesos,
          maxScore: maxScores.procesos
        },
        {
          key: 'tecnologias',
          name: 'Tecnologías',
          score: userScores.sistemas,
          maxScore: maxScores.sistemas
        }
      ];
      
      const comp = calculateOverallComparison(
        userScores.total,
        maxScores.total,
        stats,
        userScopesData
      );
      
      setComparison(comp);
    } catch (err) {
      console.error('Failed to fetch assessment stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, usePreproduction, userScores.total, userScores.personas, userScores.procesos, userScores.sistemas, maxScores.total, maxScores.personas, maxScores.procesos, maxScores.sistemas]);

  useEffect(() => {
    fetchAndCalculate();
  }, [fetchAndCalculate]);

  return {
    comparison,
    isLoading,
    error,
    refetch: fetchAndCalculate
  };
}