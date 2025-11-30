import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { platformConfigAuditTable, platformConfigTable, userTable } from '@workspace/database';
import { eq, desc, and, gte, lte, like, sql } from 'drizzle-orm';
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

// GET /api/admin/config/audit - Get configuration audit logs
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const configKey = searchParams.get('configKey');

    // Build filter conditions
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(platformConfigAuditTable.changed_at, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(platformConfigAuditTable.changed_at, new Date(endDate)));
    }
    
    if (userId) {
      conditions.push(eq(platformConfigAuditTable.changed_by, userId));
    }
    
    if (configKey) {
      conditions.push(like(platformConfigTable.key, `%${configKey}%`));
    }

    // Get total count
    const countQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformConfigAuditTable)
      .leftJoin(platformConfigTable, eq(platformConfigAuditTable.config_id, platformConfigTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countQuery[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch audit logs with user info
    const auditLogs = await db
      .select({
        id: platformConfigAuditTable.id,
        action: platformConfigAuditTable.action,
        config_key: platformConfigTable.key,
        previous_value: platformConfigAuditTable.previous_value,
        new_value: platformConfigAuditTable.new_value,
        is_sensitive: platformConfigTable.is_sensitive,
        changed_at: platformConfigAuditTable.changed_at,
        changed_by: platformConfigAuditTable.changed_by,
        user: {
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image
        }
      })
      .from(platformConfigAuditTable)
      .leftJoin(platformConfigTable, eq(platformConfigAuditTable.config_id, platformConfigTable.id))
      .leftJoin(userTable, eq(platformConfigAuditTable.changed_by, userTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(platformConfigAuditTable.changed_at))
      .limit(limit)
      .offset(offset);

    // Log admin action
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    
    await logAdminAction({
      action: 'config.list',
      resource: 'platform_config_audit',
      metadata: { 
        page,
        limit,
        filters: { startDate, endDate, userId, configKey }
      },
      ipAddress: ipAddress || undefined
    });

    // Format the response
    const formattedLogs = auditLogs.map(log => ({
      ...log,
      previous_value: log.is_sensitive ? '***' : log.previous_value,
      new_value: log.is_sensitive ? '***' : log.new_value
    }));

    // Return audit logs with pagination info
    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return errorResponse(
      'Failed to fetch audit logs',
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}