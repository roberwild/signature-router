/**
 * Survey Service - Fetches questions dynamically from Minery backend
 * This ensures we always have the latest questions and correct count
 */

export interface SurveyQuestion {
  id: number;
  ambitoKey: string | null;
  selectorKey: string | null;
  pregunta: string;
  preguntaMobile?: string;
  ponderacion: number;
  type: 'selector' | 'text' | 'textarea';
  subtitulo?: string;
  subtituloMobile?: string;
  respuestas?: Array<{
    valor: string;
    texto: string;
    textoMobile?: string;
    puntuacion: number;
  }>;
}

export interface SurveyData {
  slug: string;
  preguntas: SurveyQuestion[];
  ambitos: Array<{
    key: string;
    name: string;
    nameMobile: string;
    pctBajo: number;
    pctMedio: number;
    pctAlto: number;
  }>;
}

class SurveyService {
  private cachedSurvey: SurveyData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Fetch survey questions from Minery backend
   */
  async fetchSurvey(): Promise<SurveyData> {
    // Check cache
    if (this.cachedSurvey && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      console.log('📦 Using cached survey data');
      return this.cachedSurvey;
    }

    console.log('🔄 Fetching fresh survey data from backend...');
    
    const headersList = {
      "Accept": "*/*",
      "User-Agent": "Assessment Platform",
      "X-API-KEY": process.env.API_SECRET_KEY || "fdea6e19-c868-4b15-ab60-735af3c8482d"
    };

    try {
      const response = await fetch("https://intranet.mineryreport.com/api/encuesta/", {
        method: "POST",
        headers: headersList
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch survey: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cachedSurvey = data;
      this.cacheTimestamp = Date.now();
      
      console.log(`✅ Survey fetched: ${data.preguntas.length} questions`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching survey:', error);
      
      // Fallback to cached data if available
      if (this.cachedSurvey) {
        console.log('⚠️ Using stale cache due to fetch error');
        return this.cachedSurvey;
      }
      
      throw error;
    }
  }

  /**
   * Get questions grouped by category
   */
  async getQuestionsByCategory(): Promise<{
    personas: SurveyQuestion[];
    procesos: SurveyQuestion[];
    tecnologias: SurveyQuestion[];
    metadata: SurveyQuestion[];
  }> {
    const survey = await this.fetchSurvey();
    
    const personas: SurveyQuestion[] = [];
    const procesos: SurveyQuestion[] = [];
    const tecnologias: SurveyQuestion[] = [];
    const metadata: SurveyQuestion[] = [];
    
    survey.preguntas.forEach(question => {
      if (question.ambitoKey === 'personas') {
        personas.push(question);
      } else if (question.ambitoKey === 'procesos') {
        procesos.push(question);
      } else if (question.ambitoKey === 'tecnologias') {
        tecnologias.push(question);
      } else {
        // Questions without ambitoKey are metadata (like company size, sector)
        metadata.push(question);
      }
    });
    
    return { personas, procesos, tecnologias, metadata };
  }

  /**
   * Get the correct question count for validation
   */
  async getQuestionCount(): Promise<number> {
    const survey = await this.fetchSurvey();
    return survey.preguntas.length;
  }

  /**
   * Map frontend answers to backend format
   * Based on the actual question IDs from the backend
   */
  async mapAnswersToBackendFormat(frontendData: unknown): Promise<Array<{
    preguntaId: number;
    respuesta: string;
    tiempoRespuesta: null;
  }>> {
    const survey = await this.fetchSurvey();
    const respuestas: Array<{
      preguntaId: number;
      respuesta: string;
      tiempoRespuesta: null;
    }> = [];

    // Helper to map numeric scores to letters
    const mapScoreToAnswer = (score: number): string => {
      if (score <= 1) return 'A';
      if (score === 2) return 'B';
      if (score === 3) return 'C';
      if (score === 4) return 'D';
      return 'D';
    };

    // Cast frontendData to a typed object for property access
    const data = frontendData as {
      empleados?: string | number;
      sector?: string | number;
      personas?: Record<string, number>;
      procesos?: Record<string, number>;
      tecnologias?: Record<string, number>;
    };

    // Process each question based on its actual ID from the backend
    survey.preguntas.forEach(question => {
      let respuesta: string | undefined;

      // Questions 1-7 are personas
      if (question.id >= 1 && question.id <= 7) {
        if (question.id === 7) {
          // Question 7 is company size (empleados)
          respuesta = typeof data.empleados === 'string' ? data.empleados : (data.empleados ? String(data.empleados) : 'B');
        } else {
          const fieldKey = `q${question.id}`;
          const value = data.personas?.[fieldKey];
          if (typeof value === 'number') {
            respuesta = mapScoreToAnswer(value);
          }
        }
      }
      // Questions 8-15 are procesos
      else if (question.id >= 8 && question.id <= 15) {
        if (question.id === 15) {
          // Question 15 is sector
          respuesta = typeof data.sector === 'string' ? data.sector : (data.sector ? String(data.sector) : 'Tecnología');
        } else {
          const fieldKey = `q${question.id - 7}`; // Adjust for frontend key
          const value = data.procesos?.[fieldKey];
          if (typeof value === 'number') {
            respuesta = mapScoreToAnswer(value);
          }
        }
      }
      // Questions 16-22 are tecnologias
      else if (question.id >= 16 && question.id <= 22) {
        const fieldKey = `q${question.id - 15}`; // Adjust for frontend key
        const value = data.tecnologias?.[fieldKey];
        if (typeof value === 'number') {
          respuesta = mapScoreToAnswer(value);
        }
      }
      
      // Add the response if we have an answer
      if (respuesta) {
        respuestas.push({
          preguntaId: question.id,
          respuesta,
          tiempoRespuesta: null
        });
      } else {
        // Default answer if missing
        console.warn(`⚠️ No answer for question ${question.id}, using default`);
        respuestas.push({
          preguntaId: question.id,
          respuesta: question.type === 'text' ? 'No especificado' : 'A',
          tiempoRespuesta: null
        });
      }
    });
    
    return respuestas;
  }
}

// Export singleton instance
export const surveyService = new SurveyService();