import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { incidentDb } from '~/src/features/incidents/data/incident-db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/incidents/[id] - Get incident with history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const incident = await incidentDb.getIncidentWithHistory(params.id);

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // TODO: Verify user has access to this incident's organization

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/incidents/[id] - Update incident (creates new version)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // TODO: Verify user has access to this incident's organization
    // TODO: Check if organization has active subscription

    const result = await incidentDb.updateIncident({
      incidentId: params.id,
      userId: session.user.id,
      ...body,
    });

    return NextResponse.json({
      success: true,
      incident: result.incident,
      version: result.version,
      token: result.token,
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/incidents/[id] - Delete incident
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // TODO: Verify user has admin access to this organization

    await incidentDb.deleteIncident(params.id, organizationId);

    return NextResponse.json({
      success: true,
      message: 'Incident deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    );
  }
}