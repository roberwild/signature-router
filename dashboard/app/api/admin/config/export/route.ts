import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db, ConfigurationService } from '@workspace/database';
import { isPlatformAdmin } from '~/middleware/admin';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { headers } from 'next/headers';

// Error response helper
function errorResponse(message: string, code: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

// GET /api/admin/config/export - Export all non-sensitive configurations
export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Check admin permission
    const isAdmin = await isPlatformAdmin();
    if (!isAdmin) {
      return errorResponse('Forbidden - Admin access required', 'FORBIDDEN', 403);
    }

    // Initialize service
    const configService = new ConfigurationService(db);

    // Fetch all configurations (excluding sensitive values)
    const configs = await configService.getAllConfigs(false);

    // Filter out sensitive configurations and prepare export data
    const exportConfigs = configs
      .filter(config => !config.is_sensitive)
      .map(config => ({
        key: config.key,
        value: config.value,
        category: config.category,
        is_sensitive: false
      }));

    // Create export metadata
    const exportData = {
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        exportedBy: session.user.email,
        configCount: exportConfigs.length,
        totalConfigs: configs.length,
        sensitiveExcluded: configs.filter(c => c.is_sensitive).length
      },
      configurations: exportConfigs
    };

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.export',
      resource: 'platform_config',
      metadata: { 
        configCount: exportConfigs.length,
        sensitiveExcluded: configs.filter(c => c.is_sensitive).length
      },
      ipAddress: ipAddress || undefined
    });

    // Return JSON response with proper headers for download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="config-export-${Date.now()}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting configurations:', error);
    return errorResponse(
      'Failed to export configurations',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}