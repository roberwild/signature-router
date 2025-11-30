import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const organizationId = ctx.organization.id;

    const { id: assessmentId } = await params;

    // Get specific assessment from local database
    const { assessmentDb } = await import('~/src/features/assessments/data/assessment-db');
    const assessments = await assessmentDb.getOrganizationEvaluations(organizationId, 1);
    
    const assessment = assessments.find(a => a.id === assessmentId);
    
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Verify the assessment belongs to the user's organization
    if (assessment.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment,
    });

  } catch (error) {
    console.error('Get assessment API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}