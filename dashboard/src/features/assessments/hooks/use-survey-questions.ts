import { useState, useEffect, useCallback } from 'react';

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
  }>;
}

interface TransformedQuestion {
  id: string;
  text: string;
  category: string;
  originalId: number;
  type: 'selector' | 'text' | 'textarea';
  respuestas?: Array<{
    valor: string;
    texto: string;
    textoMobile?: string;
    puntuacion: number;
  }>;
}

interface UseSurveyQuestionsResult {
  questions: {
    personas: TransformedQuestion[];
    procesos: TransformedQuestion[];
    tecnologias: TransformedQuestion[];
    metadata: TransformedQuestion[];
  } | null;
  loading: boolean;
  error: string | null;
  totalQuestions: number;
  categoryCounts: {
    personas: number;
    procesos: number;
    tecnologias: number;
  };
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage survey questions from the backend
 */
export function useSurveyQuestions(): UseSurveyQuestionsResult {
  const [questions, setQuestions] = useState<UseSurveyQuestionsResult['questions']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ personas: 0, procesos: 0, tecnologias: 0 });

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/survey');
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // If backend is unavailable, fall back to hardcoded questions
        if (errorData.useFallback) {
          console.warn('⚠️ Using fallback questions due to backend error');
          // Import the hardcoded questions as fallback
          const { preguntas } = await import('~/src/config/questions');
          
          // Group hardcoded questions by category
          const grouped = groupQuestionsByCategory(preguntas as SurveyQuestion[]);
          setQuestions(grouped);
          setTotalQuestions(preguntas.length);
          setCategoryCounts({
            personas: grouped.personas.length,
            procesos: grouped.procesos.length,
            tecnologias: grouped.tecnologias.length,
          });
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch questions');
      }
      
      const data = await response.json();
      
      if (!data.survey?.preguntas) {
        throw new Error('Invalid survey data received');
      }
      
      // Group questions by category
      const grouped = groupQuestionsByCategory(data.survey.preguntas);
      setQuestions(grouped);
      setTotalQuestions(data.questionCount || data.survey.preguntas.length);
      
      // Set category counts from API response or calculate from grouped data
      if (data.categories) {
        setCategoryCounts(data.categories);
      } else {
        setCategoryCounts({
          personas: grouped.personas.length,
          procesos: grouped.procesos.length,
          tecnologias: grouped.tecnologias.length,
        });
      }
      
      console.log(`✅ Loaded ${data.survey.preguntas.length} questions from backend`);
      
    } catch (err) {
      console.error('❌ Error fetching survey questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      
      // Try to use fallback questions
      try {
        const { preguntas } = await import('~/src/config/questions');
        const grouped = groupQuestionsByCategory(preguntas as SurveyQuestion[]);
        setQuestions(grouped);
        setTotalQuestions(preguntas.length);
        setCategoryCounts({
          personas: grouped.personas.length,
          procesos: grouped.procesos.length,
          tecnologias: grouped.tecnologias.length,
        });
        console.log('📦 Using fallback questions');
      } catch (fallbackError) {
        console.error('❌ Failed to load fallback questions:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- groupQuestionsByCategory is stable and doesn't need to be a dependency
  }, []);

  // Transform backend questions to frontend format
  const transformQuestionForFrontend = (question: SurveyQuestion, sectionKey: string) => {
    // Calculate the relative question number within the section
    let relativeId = 'q1';
    if (sectionKey === 'personas') {
      relativeId = `q${question.id}`;
    } else if (sectionKey === 'procesos') {
      relativeId = `q${question.id - 7}`;
    } else if (sectionKey === 'tecnologias') {
      relativeId = `q${question.id - 15}`;
    }
    
    return {
      id: relativeId,
      text: question.pregunta?.replace(/<[^>]*>/g, '') || '',
      category: question.subtitulo?.replace(/<[^>]*>/g, '') || 'General',
      originalId: question.id,
      type: question.type,
      respuestas: question.respuestas?.map(r => ({
        ...r,
        texto: r.texto.replace(/<[^>]*>/g, ''),
        textoMobile: r.textoMobile?.replace(/<[^>]*>/g, '') || r.textoMobile,
      })),
    };
  };

  // Group questions by category
  const groupQuestionsByCategory = (questionList: SurveyQuestion[]) => {
    const personas: TransformedQuestion[] = [];
    const procesos: TransformedQuestion[] = [];
    const tecnologias: TransformedQuestion[] = [];
    const metadata: TransformedQuestion[] = [];
    
    questionList.forEach(question => {
      // Transform and categorize questions
      if (question.ambitoKey === 'personas') {
        personas.push(transformQuestionForFrontend(question, 'personas'));
      } else if (question.ambitoKey === 'procesos') {
        procesos.push(transformQuestionForFrontend(question, 'procesos'));
      } else if (question.ambitoKey === 'tecnologias') {
        tecnologias.push(transformQuestionForFrontend(question, 'tecnologias'));
      } else {
        // Questions without ambitoKey are metadata (like company size, sector)
        metadata.push(transformQuestionForFrontend(question, 'metadata'));
      }
    });
    
    // Sort by original ID to ensure correct order
    personas.sort((a, b) => a.originalId - b.originalId);
    procesos.sort((a, b) => a.originalId - b.originalId);
    tecnologias.sort((a, b) => a.originalId - b.originalId);
    metadata.sort((a, b) => a.originalId - b.originalId);

    return { personas, procesos, tecnologias, metadata };
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    totalQuestions,
    categoryCounts,
    refetch: fetchQuestions,
  };
}