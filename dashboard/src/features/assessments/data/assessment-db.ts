/**
 * Database operations for assessments/evaluations
 */

import { db, eq, desc, and, gte, lte } from '@workspace/database/client';
import { evaluationTable } from '@workspace/database/schema';

export interface CreateEvaluationInput {
  organizationId: string;
  userId: string;
  testData: unknown;
  scorePersonas: number | null;
  scoreProcesos: number | null;
  scoreSistemas: number | null;
  scoreTotal: number | null;
  sector?: string | null;
}

export interface EvaluationFilters {
  organizationId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Database evaluation record (matches the database schema)
export interface EvaluationRecord {
  id: string;
  organizationId: string;
  userId: string;
  testData: unknown;
  scorePersonas: number | null;
  scoreProcesos: number | null;
  scoreSistemas: number | null;
  scoreTotal: number | null;
  sector: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AssessmentDatabase {
  /**
   * Create a new evaluation record
   */
  async createEvaluation(input: CreateEvaluationInput): Promise<EvaluationRecord> {
    const [evaluation] = await db
      .insert(evaluationTable)
      .values({
        organizationId: input.organizationId,
        userId: input.userId,
        testData: input.testData,
        scorePersonas: input.scorePersonas,
        scoreProcesos: input.scoreProcesos,
        scoreSistemas: input.scoreSistemas,
        scoreTotal: input.scoreTotal,
        sector: input.sector,
      })
      .returning();

    return evaluation;
  }

  /**
   * Get evaluations for an organization
   */
  async getOrganizationEvaluations(
    organizationId: string,
    limit: number = 100
  ): Promise<EvaluationRecord[]> {
    const evaluations = await db
      .select()
      .from(evaluationTable)
      .where(eq(evaluationTable.organizationId, organizationId))
      .orderBy(desc(evaluationTable.createdAt))
      .limit(limit);

    return evaluations;
  }

  /**
   * Get latest evaluation for an organization
   */
  async getLatestEvaluation(organizationId: string): Promise<EvaluationRecord | undefined> {
    const [evaluation] = await db
      .select()
      .from(evaluationTable)
      .where(eq(evaluationTable.organizationId, organizationId))
      .orderBy(desc(evaluationTable.createdAt))
      .limit(1);

    return evaluation;
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(id: string): Promise<EvaluationRecord | undefined> {
    const [evaluation] = await db
      .select()
      .from(evaluationTable)
      .where(eq(evaluationTable.id, id));

    return evaluation;
  }

  /**
   * Get evaluations with filters
   */
  async getEvaluations(filters: EvaluationFilters): Promise<EvaluationRecord[]> {
    const conditions = [];

    if (filters.organizationId) {
      conditions.push(eq(evaluationTable.organizationId, filters.organizationId));
    }

    if (filters.userId) {
      conditions.push(eq(evaluationTable.userId, filters.userId));
    }

    if (filters.dateFrom) {
      conditions.push(gte(evaluationTable.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(evaluationTable.createdAt, filters.dateTo));
    }

    const evaluations = await db
      .select()
      .from(evaluationTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(evaluationTable.createdAt));

    return evaluations;
  }

  /**
   * Calculate average scores for all evaluations
   */
  async getGlobalAverageScores() {
    const evaluations = await db
      .select({
        avgPersonas: evaluationTable.scorePersonas,
        avgProcesos: evaluationTable.scoreProcesos,
        avgSistemas: evaluationTable.scoreSistemas,
        avgTotal: evaluationTable.scoreTotal,
      })
      .from(evaluationTable);

    if (evaluations.length === 0) {
      return {
        avgPersonas: 0,
        avgProcesos: 0,
        avgSistemas: 0,
        avgTotal: 0,
        totalEvaluations: 0,
      };
    }

    const totals = evaluations.reduce(
      (acc, evaluation) => ({
        personas: acc.personas + (evaluation.avgPersonas ?? 0),
        procesos: acc.procesos + (evaluation.avgProcesos ?? 0),
        sistemas: acc.sistemas + (evaluation.avgSistemas ?? 0),
        total: acc.total + (evaluation.avgTotal ?? 0),
      }),
      { personas: 0, procesos: 0, sistemas: 0, total: 0 }
    );

    const count = evaluations.length;

    return {
      avgPersonas: Math.round(totals.personas / count),
      avgProcesos: Math.round(totals.procesos / count),
      avgSistemas: Math.round(totals.sistemas / count),
      avgTotal: Math.round(totals.total / count),
      totalEvaluations: count,
    };
  }

  /**
   * Get evaluations grouped by sector
   */
  async getEvaluationsBySector(sector: string) {
    const evaluations = await db
      .select()
      .from(evaluationTable)
      .where(eq(evaluationTable.sector, sector))
      .orderBy(desc(evaluationTable.createdAt));

    return evaluations;
  }

  /**
   * Calculate average scores for a specific sector
   */
  async getSectorAverageScores(sector: string) {
    const evaluations = await this.getEvaluationsBySector(sector);

    if (evaluations.length === 0) {
      return null;
    }

    const totals = evaluations.reduce(
      (acc, evaluation) => ({
        personas: acc.personas + (evaluation.scorePersonas ?? 0),
        procesos: acc.procesos + (evaluation.scoreProcesos ?? 0),
        sistemas: acc.sistemas + (evaluation.scoreSistemas ?? 0),
        total: acc.total + (evaluation.scoreTotal ?? 0),
      }),
      { personas: 0, procesos: 0, sistemas: 0, total: 0 }
    );

    const count = evaluations.length;

    return {
      sector,
      avgPersonas: Math.round(totals.personas / count),
      avgProcesos: Math.round(totals.procesos / count),
      avgSistemas: Math.round(totals.sistemas / count),
      avgTotal: Math.round(totals.total / count),
      totalEvaluations: count,
    };
  }
}

// Export singleton instance
export const assessmentDb = new AssessmentDatabase();