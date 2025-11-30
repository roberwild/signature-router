/**
 * Assessment Service using REST API
 * USING MIGUEL'S EXACT DATA FLOW AND STRUCTURE
 */

import { mineryRestClient, type EncuestaData } from './rest-client';
import { surveyService } from './survey-service';

// Constants - matching Miguel's
const ASSESSMENT_SURVEY_SLUG = 'preproduccion-test-ciberseguridad-empresas';

export class AssessmentServiceRest {
  /**
   * Transform our frontend data to Miguel's exact format
   * Now using dynamic questions from backend
   */
  private async transformToMiguelFormat(params: {
    organizationId: string;
    userId: string;
    userEmail: string;
    userName: string;
    assessmentData: Record<string, unknown>;
    sector?: string;
  }): Promise<EncuestaData> {
    const { assessmentData, userEmail, userName } = params;
    
    // Generate the encuestaId (this is the session ID)
    const encuestaId = this.generateUUID();
    
    // Use the survey service to map answers based on actual backend questions
    const respuestas = await surveyService.mapAnswersToBackendFormat(assessmentData);
    
    // Build the complete EncuestaData object exactly as Miguel expects
    const encuestaData: EncuestaData = {
      encuestaId,
      selectores: [], // Empty as in Miguel's implementation
      respuestas,
      utmParams: {}, // Empty as in Miguel's implementation
      gdprConsent: {
        dataTreatment: assessmentData.dataTreatment !== undefined ? Boolean(assessmentData.dataTreatment) : true,
        marketing: Boolean(assessmentData.marketing) || false
      },
      tiempoEncuesta: {
        inicio: Date.now(),
        fin: Date.now(),
        duracion: 0
      },
      test: "a", // Default test variant
      formData: {
        nombre: String(assessmentData.nombre || userName),
        email: String(assessmentData.email || userEmail),
        telefono: String(assessmentData.telefono || '')
      },
      // Add organizationId as tenant ID for multi-tenancy
      organizationId: String(assessmentData.organizationId || params.organizationId)
    };
    
    return encuestaData;
  }
  
  /**
   * Map numeric score (1-5) to answer letters (a-d)
   * Based on Miguel's scoring system
   */
  private mapScoreToAnswer(score: number): string {
    if (score <= 2) return 'a';
    if (score === 3) return 'b';
    if (score === 4) return 'c';
    return 'd';
  }
  
  /**
   * Generate UUID v4 - same as Miguel's implementation
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Submit assessment using Miguel's exact flow
   */
  async submitAssessment(params: {
    organizationId: string;
    userId: string;
    userEmail: string;
    userName: string;
    assessmentData: Record<string, unknown>;
    sector?: string;
  }) {
    console.log('🚀 Starting assessment submission with Miguel\'s flow');
    
    try {
      // Step 1: Initialize the encuesta (survey)
      console.log('📝 Step 1: Iniciando encuesta...');
      const initResult = await mineryRestClient.iniciarEncuesta({
        slug: ASSESSMENT_SURVEY_SLUG
      });
      console.log('✅ Encuesta iniciada:', initResult);
      
      // Step 2: Transform data to Miguel's format (now async with dynamic questions)
      const encuestaData = await this.transformToMiguelFormat(params);
      
      // Override the encuestaId with the one returned from init
      encuestaData.encuestaId = initResult.encuestaId;
      
      // Step 3: Optionally save partial data (we can skip this for now)
      // await mineryRestClient.guardarDatosParciales(encuestaData);
      
      // Step 4: Finalize the encuesta with all data
      console.log('📤 Step 2: Finalizando encuesta con datos completos...');
      const finalResult = await mineryRestClient.finalizarEncuesta(encuestaData);
      console.log('✅ Encuesta finalizada:', finalResult);
      
      // Calculate scores for local reporting
      const scores = this.calculateScores(params.assessmentData);
      
      // Save to our local database for tracking
      console.log('💾 Step 3: Guardando en base de datos local...');
      const localAssessment = await this.saveToLocalDatabase({
        organizationId: params.organizationId,
        userId: params.userId,
        testData: {
          ...params.assessmentData,
          scores,
          timestamp: new Date().toISOString(),
          mineryEncuestaId: initResult.encuestaId
        },
        scorePersonas: scores.personas,
        scoreProcesos: scores.procesos,
        scoreSistemas: scores.sistemas,
        scoreTotal: scores.total,
        sector: params.sector,
      });
      
      console.log('✅ Assessment submission complete');
      
      return {
        success: true,
        mineryResponse: finalResult,
        localAssessment,
        scores,
        encuestaId: initResult.encuestaId
      };
    } catch (error) {
      console.error('❌ Failed to submit assessment:', error);
      throw error;
    }
  }

  /**
   * Calculate scores from assessment data
   */
  private calculateScores(assessmentData: Record<string, unknown>) {
    const calculateSectionScore = (sectionAnswers: Record<string, number>) => {
      const answers = Object.values(sectionAnswers).filter(Boolean);
      if (answers.length === 0) return 0;
      const sum = answers.reduce((acc, val) => acc + val, 0);
      return Math.round((sum / (answers.length * 4)) * 100); // Scale of 1-4
    };

    const personasScore = calculateSectionScore((assessmentData.personas as Record<string, number>) || {});
    const procesosScore = calculateSectionScore((assessmentData.procesos as Record<string, number>) || {});
    const tecnologiasScore = calculateSectionScore((assessmentData.tecnologias as Record<string, number>) || (assessmentData.sistemas as Record<string, number>) || {});
    const totalScore = Math.round((personasScore + procesosScore + tecnologiasScore) / 3);

    return {
      personas: personasScore,
      procesos: procesosScore,
      tecnologias: tecnologiasScore,
      sistemas: tecnologiasScore, // Keep for backwards compatibility
      total: totalScore,
    };
  }

  /**
   * Save assessment to local database
   */
  private async saveToLocalDatabase(data: {
    organizationId: string;
    userId: string;
    testData: Record<string, unknown>;
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
export const assessmentServiceRest = new AssessmentServiceRest();