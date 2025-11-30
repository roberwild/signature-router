import { NextRequest, NextResponse } from 'next/server';
import { incidentDb } from '~/src/features/incidents/data/incident-db';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

/**
 * GET /api/verify/[token] - Public endpoint to verify incident by token
 * No authentication required - this is public access
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token || token.length !== 64) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    const result = await incidentDb.getIncidentByToken(token);

    if (!result) {
      return NextResponse.json(
        { error: 'No se encontró ningún incidente con este token' },
        { status: 404 }
      );
    }

    // Filter out internal notes from public view
    const publicVersion = {
      ...result.currentVersion,
      notasInternas: undefined, // Remove internal notes
    };

    const publicHistory = result.history.map(version => ({
      ...version,
      notasInternas: undefined, // Remove internal notes from all versions
    }));

    return NextResponse.json({
      success: true,
      incident: {
        internalId: result.incident.internalId,
        createdAt: result.incident.createdAt,
        updatedAt: result.incident.updatedAt,
      },
      currentVersion: publicVersion,
      history: publicHistory,
      totalVersions: result.history.length,
    });
  } catch (error) {
    console.error('Error verifying incident:', error);
    return NextResponse.json(
      { error: 'Error al verificar el incidente' },
      { status: 500 }
    );
  }
}