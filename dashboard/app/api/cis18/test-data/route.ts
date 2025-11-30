import { NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { insertTestCIS18Data } from '~/src/features/cis18/data/cis18-test-data';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, userId } = await request.json();

    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assessment = await insertTestCIS18Data(organizationId, userId);

    return NextResponse.json({ success: true, assessment }, { status: 200 });
  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}