import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@workspace/auth';
import { db, ConfigurationService, ConfigCategory } from '@workspace/database';
import { isPlatformAdmin } from '~/middleware/admin';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { headers } from 'next/headers';

// Request validation schemas
const updateConfigSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  category: z.enum(['analytics', 'email', 'monitoring', 'billing', 'api', 'other']).optional(),
  is_sensitive: z.boolean().optional()
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

// GET /api/admin/config/[key] - Get single configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
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

    const { key } = params;

    // Initialize service
    const configService = new ConfigurationService(db);

    // Fetch configuration
    const config = await configService.getConfig(key);

    if (!config) {
      return errorResponse(
        `Configuration not found: ${key}`,
        'NOT_FOUND',
        404
      );
    }

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.read',
      resource: 'platform_config',
      resourceId: config.id,
      metadata: { key },
      ipAddress: ipAddress || undefined
    });

    // Mask sensitive value for external display
    if (config.is_sensitive) {
      config.value = '***';
    }

    // Return configuration
    return NextResponse.json({ config });

  } catch (error) {
    console.error('Error fetching configuration:', error);
    return errorResponse(
      'Failed to fetch configuration',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// PUT /api/admin/config/[key] - Update configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
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

    const { key } = params;

    // Parse and validate request body
    const body = await request.json();
    const validation = updateConfigSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validation.error.flatten()
      );
    }

    const { value, category, is_sensitive } = validation.data;

    // Initialize service
    const configService = new ConfigurationService(db);

    // Check if config exists
    const existing = await configService.getConfig(key);
    if (!existing) {
      return errorResponse(
        `Configuration not found: ${key}`,
        'NOT_FOUND',
        404
      );
    }

    // Update configuration
    const updated = await configService.updateConfig(key, {
      value,
      category: category as ConfigCategory | undefined,
      is_sensitive,
      userId: session.user.id
    });

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.update',
      resource: 'platform_config',
      resourceId: updated.id,
      metadata: { 
        key,
        category,
        is_sensitive,
        previousSensitive: existing.is_sensitive
      },
      ipAddress: ipAddress || undefined
    });

    // Return updated configuration
    return NextResponse.json({
      message: 'Configuration updated successfully',
      config: {
        ...updated,
        value: updated.is_sensitive ? '***' : updated.value
      }
    });

  } catch (error) {
    console.error('Error updating configuration:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(
          error.message,
          'NOT_FOUND',
          404
        );
      }
      if (error.message.includes('Validation')) {
        return errorResponse(
          error.message,
          'VALIDATION_ERROR',
          400
        );
      }
    }

    return errorResponse(
      'Failed to update configuration',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// DELETE /api/admin/config/[key] - Delete configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
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

    const { key } = params;

    // Initialize service
    const configService = new ConfigurationService(db);

    // Check if config exists
    const existing = await configService.getConfig(key);
    if (!existing) {
      return errorResponse(
        `Configuration not found: ${key}`,
        'NOT_FOUND',
        404
      );
    }

    // Delete configuration
    await configService.deleteConfig(key, session.user.id);

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.delete',
      resource: 'platform_config',
      resourceId: existing.id,
      metadata: { 
        key,
        category: existing.category,
        was_sensitive: existing.is_sensitive
      },
      ipAddress: ipAddress || undefined
    });

    // Return success
    return NextResponse.json({
      message: 'Configuration deleted successfully',
      key
    });

  } catch (error) {
    console.error('Error deleting configuration:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return errorResponse(
          error.message,
          'NOT_FOUND',
          404
        );
      }
    }

    return errorResponse(
      'Failed to delete configuration',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}