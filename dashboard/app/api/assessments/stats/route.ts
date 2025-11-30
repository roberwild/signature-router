import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { assessmentService } from '~/src/lib/minery/assessment-service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const sector = searchParams.get('sector');

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    // Get assessment statistics from Minery API
    const stats = await assessmentService.getAssessmentStats({
      dateFrom,
      dateTo,
      sector: sector || undefined,
    });

    // Get global averages for comparison
    const globalAverages = await assessmentService.getGlobalAverageScores();

    return NextResponse.json({
      success: true,
      stats,
      globalAverages,
    });

  } catch (error) {
    console.error('Get assessment stats API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get assessment statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}