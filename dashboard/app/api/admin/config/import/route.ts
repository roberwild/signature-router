import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@workspace/auth';
import { db, ConfigurationService, ConfigCategory } from '@workspace/database';
import { isPlatformAdmin } from '~/middleware/admin';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { headers } from 'next/headers';

// Import request validation schema
const importRequestSchema = z.object({
  configurations: z.array(z.object({
    key: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    value: z.string(),
    category: z.enum(['analytics', 'email', 'monitoring', 'billing', 'api', 'other']),
    is_sensitive: z.boolean().default(false)
  })),
  selectedKeys: z.array(z.string())
});

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

// POST /api/admin/config/import - Process configuration import
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = importRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return errorResponse(
        'Invalid import request',
        'VALIDATION_ERROR',
        400,
        validation.error.flatten()
      );
    }

    const { configurations, selectedKeys } = validation.data;

    // Initialize service
    const configService = new ConfigurationService(db);

    // Get existing configurations
    const existingConfigs = await configService.getAllConfigs(true);
    const existingConfigMap = new Map(
      existingConfigs.map(c => [c.key, c])
    );

    // Process import results
    const results = {
      success: [] as string[],
      failed: [] as Array<{ key: string; error: string }>,
      skipped: [] as string[],
      created: 0,
      updated: 0
    };

    // Process each selected configuration
    for (const config of configurations) {
      // Skip if not selected
      if (!selectedKeys.includes(config.key)) {
        results.skipped.push(config.key);
        continue;
      }

      try {
        const existing = existingConfigMap.get(config.key);

        if (existing) {
          // Skip sensitive configurations
          if (existing.is_sensitive) {
            results.skipped.push(config.key);
            continue;
          }

          // Update existing configuration
          await configService.updateConfig(config.key, {
            value: config.value,
            category: config.category as ConfigCategory,
            userId: session.user.id
          });
          results.updated++;
          results.success.push(config.key);
        } else {
          // Create new configuration
          await configService.createConfig({
            key: config.key,
            value: config.value,
            category: config.category as ConfigCategory,
            is_sensitive: false,
            userId: session.user.id
          });
          results.created++;
          results.success.push(config.key);
        }
      } catch (error) {
        results.failed.push({
          key: config.key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.import',
      resource: 'platform_config',
      metadata: {
        total: selectedKeys.length,
        created: results.created,
        updated: results.updated,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      ipAddress: ipAddress || undefined
    });

    // Return import results
    return NextResponse.json({
      message: 'Import completed',
      results: {
        total: selectedKeys.length,
        successful: results.success.length,
        created: results.created,
        updated: results.updated,
        failed: results.failed.length,
        skipped: results.skipped.length,
        details: {
          success: results.success,
          failed: results.failed,
          skipped: results.skipped
        }
      }
    });

  } catch (error) {
    console.error('Error processing import:', error);
    return errorResponse(
      'Failed to process import',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}