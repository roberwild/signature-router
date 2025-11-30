import { NextRequest, NextResponse } from 'next/server';

// Interface for survey question
interface SurveyQuestion {
  ambitoKey: string;
  [key: string]: unknown;
}

// Interface for survey data
interface SurveyData {
  preguntas?: SurveyQuestion[];
  [key: string]: unknown;
}

/**
 * API endpoint to fetch survey questions from Minery backend
 * GET /api/survey - Returns the complete survey structure with questions
 * Note: Minery API requires POST method even for fetching data
 */
export async function GET(_request: NextRequest) {
  console.log('📋 Survey API: Fetching questions from Minery backend');
  
  try {
    const headersList = {
      "Accept": "*/*",
      "User-Agent": "Assessment Platform",
      "X-API-KEY": process.env.API_SECRET_KEY || "fdea6e19-c868-4b15-ab60-735af3c8482d"
    };

    const response = await fetch("https://intranet.mineryreport.com/api/encuesta/", {
      method: "POST",
      headers: headersList,
      // Cache for 5 minutes on the server side
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch survey from Minery:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch survey questions' },
        { status: response.status }
      );
    }

    const data = await response.json() as SurveyData;

    console.log(`✅ Survey fetched: ${data.preguntas?.length || 0} questions`);

    // Return the survey data to the frontend
    return NextResponse.json({
      success: true,
      survey: data,
      questionCount: data.preguntas?.length || 0,
      categories: {
        personas: data.preguntas?.filter((q: SurveyQuestion) => q.ambitoKey === 'personas').length || 0,
        procesos: data.preguntas?.filter((q: SurveyQuestion) => q.ambitoKey === 'procesos').length || 0,
        tecnologias: data.preguntas?.filter((q: SurveyQuestion) => q.ambitoKey === 'tecnologias').length || 0,
      }
    });

  } catch (error) {
    console.error('Survey API error:', error);
    
    // Return a fallback structure if the backend is unavailable
    return NextResponse.json(
      { 
        error: 'Failed to fetch survey',
        details: error instanceof Error ? error.message : 'Unknown error',
        // Optionally include a fallback to use hardcoded questions
        useFallback: true
      },
      { status: 500 }
    );
  }
}