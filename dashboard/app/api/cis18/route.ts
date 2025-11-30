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
    
    const assessment = await CIS18Api.createCIS18Assessment({
      ...body,
      createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error) {
    console.error('Error creating CIS-18 assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const assessments = await CIS18Api.getAllCIS18Assessments(organizationId);
    
    return NextResponse.json({ assessments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching CIS-18 assessments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}