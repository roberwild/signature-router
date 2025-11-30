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
    
    const lead = await CIS18Api.createCIS18Lead({
      organizationId: body.organizationId,
      name: body.contactName,
      email: body.contactEmail,
      phone: body.contactPhone || null,
      role: body.role || null,
      companySize: body.companySize || null,
      securityMaturity: body.securityMaturity || null,
      message: body.message || null,
      status: 'pending',
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error('Error creating CIS-18 lead:', error);
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

    const leads = await CIS18Api.getCIS18Leads(organizationId);
    
    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error('Error fetching CIS-18 leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}