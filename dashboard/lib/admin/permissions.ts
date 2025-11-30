import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import * as React from 'react';
import { logAdminAction } from './audit-logger';

export type AdminRole = 'platform_admin' | 'read_only' | 'none';

export type Permission = 
  | 'questionnaire.read'
  | 'questionnaire.write'
  | 'questionnaire.delete'
  | 'settings.read'
  | 'settings.write'
  | 'export.data'
  | 'session.intervene'
  | 'SYSTEM_ADMIN';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  platform_admin: [
    'questionnaire.read',
    'questionnaire.write',
    'questionnaire.delete',
    'settings.read',
    'settings.write',
    'export.data',
    'session.intervene',
    'SYSTEM_ADMIN'
  ],
  read_only: [
    'questionnaire.read',
    'settings.read'
  ],
  none: []
};

/**
 * Get the current user's admin role
 */
export const getUserAdminRole = cache(async (): Promise<AdminRole> => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return 'none';
  }

  const [user] = await db
    .select({ 
      isPlatformAdmin: userTable.isPlatformAdmin,
      isReadOnlyAdmin: userTable.isReadOnlyAdmin 
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (user?.isPlatformAdmin) {
    return 'platform_admin';
  }
  
  if (user?.isReadOnlyAdmin) {
    return 'read_only';
  }

  return 'none';
});

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await getUserAdminRole();
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Require a specific permission or redirect
 */
export async function requirePermission(
  permission: Permission,
  redirectTo: string = '/organizations'
) {
  const hasAccess = await hasPermission(permission);
  
  if (!hasAccess) {
    const _session = await auth();
    await logAdminAction({
      action: 'admin.access_denied',
      resource: 'permission',
      resourceId: permission,
      metadata: { attempted_permission: permission }
    });
    
    redirect(redirectTo);
  }
  
  return true;
}

/**
 * Check permissions for a component (to be used with PermissionGuard component)
 */
export async function checkComponentPermission(permission: Permission): Promise<boolean> {
  return await hasPermission(permission);
}

/**
 * Hook to check permissions in client components
 */
export function usePermission(permission: Permission) {
  const [hasAccess, setHasAccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch(`/api/admin/check-permission?permission=${permission}`);
        const data = await response.json();
        setHasAccess(data.hasAccess);
      } catch (error) {
        console.error('Failed to check permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission]);

  return { hasAccess, loading };
}