import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { incidentDb } from '~/src/features/incidents/data/incident-db';

/**
 * GET /api/incidents - Get organization incidents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID from query params or session
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // TODO: Verify user has access to this organization
    // This would check membership in the organization

    const incidents = await incidentDb.getOrganizationIncidents(organizationId);

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/incidents - Create new incident
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId, ...incidentData } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // TODO: Verify user has access to this organization
    // TODO: Check if organization has active subscription

    const result = await incidentDb.createIncident({
      organizationId,
      userId: session.user.id,
      ...incidentData,
    });

    return NextResponse.json({
      success: true,
      incident: result.incident,
      version: result.version,
      token: result.token,
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}