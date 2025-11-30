import { NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { CIS18Api } from '~/src/features/cis18/data/cis18-api';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assessments } = body;

    if (!assessments || !Array.isArray(assessments)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const assessmentData of assessments) {
      try {
        // Calculate total score
        let totalScore = 0;
        let controlCount = 0;
        
        for (let i = 1; i <= 18; i++) {
          const score = assessmentData[`control${i}`];
          if (score !== null && score !== undefined) {
            totalScore += parseInt(score);
            controlCount++;
          }
        }
        
        if (controlCount > 0) {
          totalScore = Math.round(totalScore / controlCount);
        }

        const assessment = await CIS18Api.createCIS18Assessment({
          ...assessmentData,
          totalScore,
          createdBy: session.user.id,
        });
        
        results.push(assessment);
      } catch (error) {
        console.error('Error creating assessment:', error);
        errors.push({
          data: assessmentData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json(
        { error: 'Failed to import all assessments', errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        imported: results.length, 
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error importing CIS-18 data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}