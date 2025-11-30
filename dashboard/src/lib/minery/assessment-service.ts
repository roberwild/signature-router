/**
 * Assessment Service
 * Integrates Minery API with our local database
 */

import { mineryClient } from './client';
import {
  GET_ENCUESTA_BY_SLUG,
  LIST_ALL_RESPUESTAS_ENCUESTA,
  GET_ESTADISTICAS_RESPUESTAS_ENCUESTA,
  GET_GRAFICO_RESPUESTAS_ENCUESTA,
  CREATE_UPDATE_RESPUESTA_ENCUESTA,
  extractScoresFromResponse,
  formatDateForGraphQL,
  buildAssessmentFilter,
  type RespuestaEncuesta,
  type EstadisticasRespuestaEncuesta,
  type GraficoRespuestasEncuesta,
} from './queries';

// Constants
const ASSESSMENT_SURVEY_SLUG = 'preproduccion-test-ciberseguridad-empresas';
let cachedSurveyId: string | null = null;

export class AssessmentService {
  /**
   * Get survey ID by slug (with caching)
   */
  private async getSurveyId(): Promise<string> {
    if (cachedSurveyId) {
      return cachedSurveyId;
    }

    try {
      const response = await mineryClient.query<{
        listAllEncuestas: {
          edges: Array<{ node: { id: string; slug: string } }>;
        };
      }>(GET_ENCUESTA_BY_SLUG, { slug: ASSESSMENT_SURVEY_SLUG });

      if (response.listAllEncuestas.edges.length > 0) {
        cachedSurveyId = response.listAllEncuestas.edges[0].node.id;
        return cachedSurveyId;
      }
      
      // Fallback to default ID if survey not found
      console.warn(`Survey with slug '${ASSESSMENT_SURVEY_SLUG}' not found, using default ID`);
      cachedSurveyId = '1';
      return cachedSurveyId;
    } catch (error) {
      console.error('Failed to fetch survey ID:', error);
      // Fallback to default ID on error
      cachedSurveyId = '1';
      return cachedSurveyId;
    }
  }

  /**
   * Submit a new assessment or update existing one
   */
  async submitAssessment(params: {
    organizationId: string;
    userId: string;
    userEmail: string;
    userName: string;
    assessmentData: unknown;
    sector?: string;
  }) {
    const { userEmail, userName, assessmentData } = params;
    
    // Generate a unique ID for this assessment session
    const uid = `${params.organizationId}_${Date.now()}`;
    
    try {
      // Get the survey ID
      const surveyId = await this.getSurveyId();
      
      // Submit to Minery API
      const response = await mineryClient.mutation<{
        createUpdateRespuestaEncuesta: {
          respuestaEncuesta: RespuestaEncuesta;
          errors?: string[];
        };
      }>(CREATE_UPDATE_RESPUESTA_ENCUESTA, {
        encuestaId: surveyId,
        uid,
        nombre: userName,
        email: userEmail,
        telefono: '',
        dataTreatment: true,
        marketing: false,
        datosCompletos: JSON.stringify(assessmentData),
        finalizada: true,
        extra: JSON.stringify({ 
          organizationId: params.organizationId,
          sector: params.sector 
        }),
      });

      if (response.createUpdateRespuestaEncuesta.errors?.length) {
        throw new Error(
          `Minery API errors: ${response.createUpdateRespuestaEncuesta.errors.join(', ')}`
        );
      }

      const mineryResponse = response.createUpdateRespuestaEncuesta.respuestaEncuesta;
      
      // Extract scores from the response
      const scores = extractScoresFromResponse(mineryResponse.datosCompletosJson);
      
      // Save to our local database
      const localAssessment = await this.saveToLocalDatabase({
        organizationId: params.organizationId,
        userId: params.userId,
        testData: mineryResponse.datosCompletosJson,
        scorePersonas: scores.personas,
        scoreProcesos: scores.procesos,
        scoreSistemas: scores.sistemas,
        scoreTotal: scores.total,
        sector: params.sector,
      });

      // Send admin notification for survey completion
      try {
        const { adminNotificationService } = await import('~/lib/email/admin-notification-service');
        await adminNotificationService.sendSurveyCompletionNotification({
          userEmail: userEmail,
          userName: userName,
          surveyType: 'Cybersecurity Assessment',
          completionDate: new Date(),
          score: scores.total,
        });
      } catch (e) {
        console.error('Failed to send survey completion notification:', e);
      }
      
      return {
        success: true,
        mineryResponse,
        localAssessment,
        scores,
      };
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw error;
    }
  }

  /**
   * Get assessment history for an organization
   */
  async getAssessmentHistory(organizationEmail: string) {
    try {
      const surveyId = await this.getSurveyId();
      const response = await mineryClient.query<{
        listAllRespuestasEncuesta: {
          edges: Array<{ node: RespuestaEncuesta }>;
          totalCount: number;
        };
      }>(LIST_ALL_RESPUESTAS_ENCUESTA, {
        filter: buildAssessmentFilter(organizationEmail, surveyId),
        first: 100,
      });

      const assessments = response.listAllRespuestasEncuesta.edges.map(
        (edge) => {
          const scores = extractScoresFromResponse(edge.node.datosCompletosJson);
          return {
            ...edge.node,
            scores,
          };
        }
      );

      return assessments;
    } catch (error) {
      console.error('Failed to get assessment history:', error);
      throw error;
    }
  }

  /**
   * Get assessment statistics
   */
  async getAssessmentStats(params: {
    dateFrom?: Date;
    dateTo?: Date;
    sector?: string;
  }) {
    try {
      const surveyId = await this.getSurveyId();
      const response = await mineryClient.query<{
        estadisticasRespuestasEncuesta: EstadisticasRespuestaEncuesta;
      }>(GET_ESTADISTICAS_RESPUESTAS_ENCUESTA, {
        encuestaId: surveyId,
        fechaDesde: params.dateFrom ? formatDateForGraphQL(params.dateFrom) : null,
        fechaHasta: params.dateTo ? formatDateForGraphQL(params.dateTo) : null,
        testFilter: params.sector || null,
      });

      return response.estadisticasRespuestasEncuesta;
    } catch (error) {
      console.error('Failed to get assessment statistics:', error);
      throw error;
    }
  }

  /**
   * Get assessment graph data for visualization
   */
  async getAssessmentGraphData(params: {
    dateFrom?: Date;
    dateTo?: Date;
    sector?: string;
  }) {
    try {
      const surveyId = await this.getSurveyId();
      const response = await mineryClient.query<{
        graficoRespuestasEncuesta: GraficoRespuestasEncuesta;
      }>(GET_GRAFICO_RESPUESTAS_ENCUESTA, {
        encuestaId: surveyId,
        fechaDesde: params.dateFrom ? formatDateForGraphQL(params.dateFrom) : null,
        fechaHasta: params.dateTo ? formatDateForGraphQL(params.dateTo) : null,
        testFilter: params.sector || null,
      });

      return response.graficoRespuestasEncuesta;
    } catch (error) {
      console.error('Failed to get assessment graph data:', error);
      throw error;
    }
  }

  /**
   * Get global average scores for comparison
   */
  async getGlobalAverageScores() {
    try {
      // Get all completed assessments stats
      const stats = await this.getAssessmentStats({});
      
      // For now, return mock data - this would need proper implementation
      // based on how Minery returns aggregate data
      return {
        avgPersonas: 65,
        avgProcesos: 58,
        avgSistemas: 72,
        avgTotal: 65,
        totalAssessments: stats.totalRespuestas,
      };
    } catch (error) {
      console.error('Failed to get global average scores:', error);
      return {
        avgPersonas: 50,
        avgProcesos: 50,
        avgSistemas: 50,
        avgTotal: 50,
        totalAssessments: 0,
      };
    }
  }

  /**
   * Save assessment to local database
   */
  private async saveToLocalDatabase(data: {
    organizationId: string;
    userId: string;
    testData: unknown;
    scorePersonas: number;
    scoreProcesos: number;
    scoreSistemas: number;
    scoreTotal: number;
    sector?: string;
  }) {
    // Import the assessment database
    const { assessmentDb } = await import('~/src/features/assessments/data/assessment-db');
    
    return await assessmentDb.createEvaluation({
      organizationId: data.organizationId,
      userId: data.userId,
      testData: data.testData,
      scorePersonas: data.scorePersonas,
      scoreProcesos: data.scoreProcesos,
      scoreSistemas: data.scoreSistemas,
      scoreTotal: data.scoreTotal,
      sector: data.sector,
    });
  }
}

// Export singleton instance
export const assessmentService = new AssessmentService();