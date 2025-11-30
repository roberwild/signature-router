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

    // Get assessment graph data from Minery API
    const chartData = await assessmentService.getAssessmentGraphData({
      dateFrom,
      dateTo,
      sector: sector || undefined,
    });

    return NextResponse.json({
      success: true,
      chartData,
    });

  } catch (error) {
    console.error('Get assessment chart API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get assessment chart data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}