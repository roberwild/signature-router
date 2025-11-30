import { db } from '@workspace/database';
import { adminAuditLogTable } from '@workspace/database/schema';
import { auth } from '@workspace/auth';
import { eq } from 'drizzle-orm';

export type AuditAction =
  | 'questionnaire.view'
  | 'questionnaire.create'
  | 'questionnaire.update'
  | 'questionnaire.delete'
  | 'timing.update'
  | 'question.update'
  | 'question.reorder'
  | 'trigger.create'
  | 'trigger.update'
  | 'trigger.delete'
  | 'settings.update'
  | 'manual_send.execute'
  | 'session.view'
  | 'session.intervene'
  | 'export.data'
  | 'admin.access'
  | 'admin.access_denied'
  | 'config.list'
  | 'config.read'
  | 'config.create'
  | 'config.update'
  | 'config.delete'
  | 'config.export'
  | 'config.import';

export type AuditLogEntry = {
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(entry: Omit<AuditLogEntry, 'userId' | 'userEmail'>) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.email) {
      console.error('[AUDIT] Failed to log action - no session');
      return;
    }

    await db.insert(adminAuditLogTable).values({
      userId: session.user.id,
      userEmail: session.user.email,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      metadata: entry.metadata || {},
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log action:', error);
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getAuditLogs(
  resource?: string,
  resourceId?: string,
  limit: number = 50
) {
  const query = db
    .select()
    .from(adminAuditLogTable)
    .orderBy(adminAuditLogTable.createdAt)
    .limit(limit);

  if (resource) {
    query.where(eq(adminAuditLogTable.resource, resource));
  }

  if (resourceId) {
    query.where(eq(adminAuditLogTable.resourceId, resourceId));
  }

  return await query;
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  return await db
    .select()
    .from(adminAuditLogTable)
    .where(eq(adminAuditLogTable.userId, userId))
    .orderBy(adminAuditLogTable.createdAt)
    .limit(limit);
}