import { NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { CIS18Api } from '~/src/features/cis18/data/cis18-api';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });
    }

    const success = await CIS18Api.deleteCIS18Assessment(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting CIS-18 assessment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}