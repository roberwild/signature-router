import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { assessmentService } from '~/src/lib/minery/assessment-service';

export async function GET(_request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization context
    const ctx = await getAuthOrganizationContext();
    const _organization = ctx.organization;

    // Get assessment history from Minery API
    // Use user email as identifier
    const organizationEmail = session.user.email!;
    
    const assessmentHistory = await assessmentService.getAssessmentHistory(organizationEmail);

    return NextResponse.json({
      success: true,
      assessments: assessmentHistory,
      totalCount: assessmentHistory.length,
    });

  } catch (error) {
    console.error('Get assessment history API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get assessment history from Minery API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}