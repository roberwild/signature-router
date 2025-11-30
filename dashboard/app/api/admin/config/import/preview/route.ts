import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@workspace/auth';
import { db, ConfigurationService } from '@workspace/database';
import { isPlatformAdmin } from '~/middleware/admin';

// Import file validation schema
const importSchema = z.object({
  metadata: z.object({
    version: z.string(),
    exportDate: z.string(),
    environment: z.string().optional(),
    exportedBy: z.string().optional(),
    configCount: z.number()
  }),
  configurations: z.array(z.object({
    key: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'Invalid key format'),
    value: z.string(),
    category: z.enum(['analytics', 'email', 'monitoring', 'billing', 'api', 'other']),
    is_sensitive: z.boolean()
  }))
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

// POST /api/admin/config/import/preview - Preview import changes
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

    // Parse request body
    const body = await request.json();
    
    // Validate import data structure
    const validation = importSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        'Invalid import file format',
        'VALIDATION_ERROR',
        400,
        validation.error.flatten()
      );
    }

    const importData = validation.data;

    // Initialize service
    const configService = new ConfigurationService(db);

    // Get all existing configurations
    const existingConfigs = await configService.getAllConfigs(true);
    const existingConfigMap = new Map(
      existingConfigs.map(c => [c.key, c])
    );

    // Analyze import data
    const preview = {
      metadata: importData.metadata,
      summary: {
        total: importData.configurations.length,
        new: 0,
        updated: 0,
        unchanged: 0,
        skipped: 0
      },
      configurations: [] as Array<{
        key: string;
        value: string;
        category: string;
        status: 'new' | 'updated' | 'unchanged' | 'skipped';
        currentValue?: string;
        newValue?: string;
        reason?: string;
      }>
    };

    // Process each configuration
    for (const config of importData.configurations) {
      const existing = existingConfigMap.get(config.key);

      if (!existing) {
        // New configuration
        preview.configurations.push({
          key: config.key,
          value: config.value,
          category: config.category,
          status: 'new',
          newValue: config.value
        });
        preview.summary.new++;
      } else if (existing.is_sensitive) {
        // Skip sensitive configurations
        preview.configurations.push({
          key: config.key,
          value: '***',
          category: config.category,
          status: 'skipped',
          currentValue: '***',
          reason: 'Sensitive configuration cannot be imported'
        });
        preview.summary.skipped++;
      } else if (existing.value !== config.value) {
        // Updated configuration
        preview.configurations.push({
          key: config.key,
          value: config.value,
          category: config.category,
          status: 'updated',
          currentValue: existing.value,
          newValue: config.value
        });
        preview.summary.updated++;
      } else {
        // Unchanged configuration
        preview.configurations.push({
          key: config.key,
          value: config.value,
          category: config.category,
          status: 'unchanged',
          currentValue: existing.value,
          newValue: config.value
        });
        preview.summary.unchanged++;
      }
    }

    // Sort configurations by status and key
    preview.configurations.sort((a, b) => {
      const statusOrder = { new: 0, updated: 1, unchanged: 2, skipped: 3 };
      const statusCompare = statusOrder[a.status] - statusOrder[b.status];
      if (statusCompare !== 0) return statusCompare;
      return a.key.localeCompare(b.key);
    });

    return NextResponse.json(preview);

  } catch (error) {
    console.error('Error previewing import:', error);
    return errorResponse(
      'Failed to preview import',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}