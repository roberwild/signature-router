import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
// Using REST API service instead of GraphQL
import { assessmentServiceRest } from '~/src/lib/minery/assessment-service-rest';

export async function POST(request: NextRequest) {
  console.log('📨 Assessment API endpoint called');
  
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      console.error('❌ Authentication failed: No session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    // Parse request body
    const body = await request.json();
    const {
      assessmentData,
      sector = 'general',
      organizationId,
    } = body;
    
    console.log('📄 Request data received:', {
      organizationId,
      sector,
      hasAssessmentData: !!assessmentData,
      assessmentDataKeys: assessmentData ? Object.keys(assessmentData) : [],
    });

    if (!assessmentData) {
      return NextResponse.json(
        { error: 'Assessment data is required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Submit assessment to Minery API and save to local database
    console.log('🚀 Submitting assessment to Minery API...');
    const result = await assessmentServiceRest.submitAssessment({
      organizationId,
      userId: session.user.id || 'unknown-user',
      userEmail: session.user.email || 'unknown@example.com',
      userName: session.user.name || 'Unknown User',
      assessmentData: {
        ...assessmentData,
        organizationId, // Add organizationId as tenant ID to the assessment data
      },
      sector,
    });
    
    console.log('✅ Assessment submission result:', {
      success: result.success,
      hasLocalAssessment: !!result.localAssessment,
      mineryApiSuccess: result.mineryResponse?.success,
      scores: result.scores,
    });

    return NextResponse.json({
      success: true,
      assessment: result.localAssessment,
      scores: result.scores,
      mineryApiStatus: result.mineryResponse?.success ? 'sent' : 'failed',
      message: result.mineryResponse?.success 
        ? 'Assessment submitted successfully to Minery' 
        : 'Assessment saved locally (Minery API issue)',
    });

  } catch (error) {
    console.error('Assessment API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get assessments from local database
    const { assessmentDb } = await import('~/src/features/assessments/data/assessment-db');
    const assessments = await assessmentDb.getOrganizationEvaluations(organizationId);

    return NextResponse.json({
      success: true,
      assessments,
    });

  } catch (error) {
    console.error('Get assessments API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get assessments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}