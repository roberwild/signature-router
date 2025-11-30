import { db } from '@workspace/database';
import { ab_experiments, ab_variants, ab_assignments, questionnaireSessions } from '@workspace/database';
import { eq, count, avg, sql, desc } from 'drizzle-orm';
import { cache } from 'react';

export interface ABExperiment {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trafficSplit: number;
  successMetric: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  variants: Array<{
    id: string;
    name: string;
    isControl: boolean;
    trafficPercentage: number;
    sampleSize: number;
    conversionRate: number;
    avgResponseTime: number;
  }>;
  totalParticipants: number;
  isSignificant: boolean;
  winner: string | null;
}

export interface ABExperimentsData {
  experiments: ABExperiment[];
  summary: {
    totalExperiments: number;
    activeExperiments: number;
    completedExperiments: number;
    totalParticipants: number;
  };
}

export const getABExperiments = cache(
  async (): Promise<ABExperimentsData> => {
    // Get all experiments with their variants
    const experimentsWithVariants = await db
      .select({
        experiment: ab_experiments,
        variant: ab_variants,
        assignmentCount: count(ab_assignments.id),
        completedSessions: count(
          sql`CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END`
        ),
        avgResponseTime: avg(
          sql`EXTRACT(EPOCH FROM (${questionnaireSessions.completedAt} - ${questionnaireSessions.startedAt}))`
        ),
      })
      .from(ab_experiments)
      .leftJoin(ab_variants, eq(ab_variants.experiment_id, ab_experiments.id))
      .leftJoin(ab_assignments, eq(ab_assignments.variant_id, ab_variants.id))
      .leftJoin(questionnaireSessions, eq(questionnaireSessions.id, ab_assignments.session_id))
      .groupBy(ab_experiments.id, ab_variants.id)
      .orderBy(desc(ab_experiments.created_at));

    // Group by experiment
    const experimentMap = new Map<string, ABExperiment>();

    experimentsWithVariants.forEach(row => {
      const exp = row.experiment;
      const variant = row.variant;

      if (!experimentMap.has(exp.id)) {
        experimentMap.set(exp.id, {
          id: exp.id,
          name: exp.name,
          description: exp.description,
          status: exp.status,
          trafficSplit: exp.traffic_split,
          successMetric: exp.success_metric,
          startDate: exp.start_date,
          endDate: exp.end_date,
          createdAt: exp.created_at,
          variants: [],
          totalParticipants: 0,
          isSignificant: false,
          winner: null,
        });
      }

      const experiment = experimentMap.get(exp.id)!;

      if (variant) {
        const sampleSize = row.assignmentCount;
        const conversions = row.completedSessions;
        const conversionRate = sampleSize > 0 ? (conversions / sampleSize) : 0;

        experiment.variants.push({
          id: variant.id,
          name: variant.name,
          isControl: variant.is_control || false,
          trafficPercentage: variant.traffic_percentage,
          sampleSize,
          conversionRate,
          avgResponseTime: Number(row.avgResponseTime) || 0,
        });

        experiment.totalParticipants += sampleSize;
      }
    });

    // Determine winners and significance for each experiment
    const experiments = Array.from(experimentMap.values()).map(exp => {
      if (exp.variants.length >= 2) {
        // Find the best performing variant
        const bestVariant = exp.variants.reduce((best, current) => 
          current.conversionRate > best.conversionRate ? current : best
        );
        
        exp.winner = bestVariant.name;
        
        // Simple significance check - in reality would use proper statistical tests
        const controlVariant = exp.variants.find(v => v.isControl);
        if (controlVariant && bestVariant.id !== controlVariant.id) {
          const improvement = ((bestVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
          exp.isSignificant = improvement > 10 && bestVariant.sampleSize > 50; // Simplified
        }
      }

      return exp;
    });

    // Calculate summary statistics
    const summary = {
      totalExperiments: experiments.length,
      activeExperiments: experiments.filter(e => e.status === 'active').length,
      completedExperiments: experiments.filter(e => e.status === 'completed').length,
      totalParticipants: experiments.reduce((sum, e) => sum + e.totalParticipants, 0),
    };

    return {
      experiments,
      summary,
    };
  }
);