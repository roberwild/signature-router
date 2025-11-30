/**
 * Assessment API client functions
 * Server-side API calls for assessment data
 */

import { assessmentDb } from './assessment-db';

export interface Assessment {
  id: string;
  scorePersonas?: number;
  scoreProcesos?: number;
  scoreSistemas?: number;
  scoreTotal?: number;
  createdAt: Date;
  [key: string]: unknown;
}

export interface AssessmentApiResponse {
  success: boolean;
  assessments?: Assessment[];
  assessment?: Assessment;
  error?: string;
}

export class AssessmentApi {
  /**
   * Get assessments for an organization (server-side)
   * This function runs on the server and directly accesses the database
   */
  static async getOrganizationAssessments(organizationId: string) {
    try {
      const assessments = await assessmentDb.getOrganizationEvaluations(organizationId);
      return {
        success: true,
        assessments,
      };
    } catch (error) {
      console.error('Error fetching organization assessments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        assessments: [],
      };
    }
  }

  /**
   * Get global average scores (server-side)
   */
  static async getGlobalAverageScores() {
    try {
      const averages = await assessmentDb.getGlobalAverageScores();
      return {
        success: true,
        averages,
      };
    } catch (error) {
      console.error('Error fetching global averages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        averages: {
          avgPersonas: 50,
          avgProcesos: 50,
          avgSistemas: 50,
          avgTotal: 50,
          totalEvaluations: 0,
        },
      };
    }
  }

  /**
   * Get latest assessment for an organization (server-side)
   */
  static async getLatestAssessment(organizationId: string) {
    try {
      const assessment = await assessmentDb.getLatestEvaluation(organizationId);
      return {
        success: true,
        assessment,
      };
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        assessment: null,
      };
    }
  }

  /**
   * Calculate assessment metrics
   */
  static calculateMetrics(assessments: Assessment[]) {
    if (assessments.length === 0) {
      return {
        latestScores: {
          personas: 0,
          procesos: 0,
          sistemas: 0,
          total: 0,
        },
        trend: {
          change: 0,
          isImprovement: false,
        },
        totalAssessments: 0,
      };
    }

    const latest = assessments[0];
    const previous = assessments[1];

    const latestScores = {
      personas: latest.scorePersonas || 0,
      procesos: latest.scoreProcesos || 0,
      sistemas: latest.scoreSistemas || 0,
      total: latest.scoreTotal || 0,
    };

    const trend = previous ? {
      change: latestScores.total - (previous.scoreTotal || 0),
      isImprovement: latestScores.total > (previous.scoreTotal || 0),
    } : {
      change: 0,
      isImprovement: false,
    };

    return {
      latestScores,
      trend,
      totalAssessments: assessments.length,
    };
  }
}

export default AssessmentApi;