import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@workspace/auth';
import { db, ConfigurationService, ConfigCategory } from '@workspace/database';
import { isPlatformAdmin } from '~/middleware/admin';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { headers } from 'next/headers';

// Request validation schemas
const createConfigSchema = z.object({
  key: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'Key must be in UPPER_SNAKE_CASE format'),
  value: z.string().min(1, 'Value is required'),
  category: z.enum(['analytics', 'email', 'monitoring', 'billing', 'api', 'other']),
  is_sensitive: z.boolean().default(false)
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

// GET /api/admin/config - Get all configurations
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const includeSensitive = searchParams.get('includeSensitive') === 'true';

    // Initialize service
    const configService = new ConfigurationService(db);

    // Fetch configurations
    let configs = await configService.getAllConfigs(includeSensitive);

    // Filter by category if specified
    if (category) {
      configs = configs.filter(config => config.category === category);
    }

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.list',
      resource: 'platform_config',
      metadata: { 
        category,
        includeSensitive,
        count: configs.length 
      },
      ipAddress: ipAddress || undefined
    });

    // Return configurations
    return NextResponse.json({
      configs,
      total: configs.length
    });

  } catch (error) {
    console.error('Error fetching configurations:', error);
    return errorResponse(
      'Failed to fetch configurations',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// POST /api/admin/config - Create new configuration
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
    const validation = createConfigSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validation.error.flatten()
      );
    }

    const { key, value, category, is_sensitive } = validation.data;

    // Initialize service
    const configService = new ConfigurationService(db);

    // Create configuration
    const config = await configService.createConfig({
      key,
      value,
      category: category as ConfigCategory,
      is_sensitive,
      userId: session.user.id
    });

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.create',
      resource: 'platform_config',
      resourceId: config.id,
      metadata: { 
        key,
        category,
        is_sensitive 
      },
      ipAddress: ipAddress || undefined
    });

    // Return created configuration
    return NextResponse.json(
      {
        message: 'Configuration created successfully',
        config: {
          ...config,
          value: is_sensitive ? '***' : config.value
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating configuration:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return errorResponse(
          error.message,
          'DUPLICATE_KEY',
          409
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
      'Failed to create configuration',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}