import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export interface AccessControlContext {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
  };
  permissions: Set<string>;
}

export enum Permission {
  // Email Settings
  EMAIL_SETTINGS_READ = 'email_settings:read',
  EMAIL_SETTINGS_WRITE = 'email_settings:write',
  EMAIL_SETTINGS_DELETE = 'email_settings:delete',
  EMAIL_SETTINGS_TEST = 'email_settings:test',
  
  // Admin Configuration
  ADMIN_CONFIG_READ = 'admin_config:read',
  ADMIN_CONFIG_WRITE = 'admin_config:write',
  ADMIN_CONFIG_DELETE = 'admin_config:delete',
  
  // Questionnaires
  QUESTIONNAIRE_READ = 'questionnaire:read',
  QUESTIONNAIRE_WRITE = 'questionnaire:write',
  QUESTIONNAIRE_DELETE = 'questionnaire:delete',
  
  // Audit Logs
  AUDIT_LOG_READ = 'audit_log:read',
  AUDIT_LOG_EXPORT = 'audit_log:export',
  
  // User Management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // System
  SYSTEM_ADMIN = 'system:admin',
  ENCRYPTION_KEY_MANAGE = 'encryption:key_manage',
}

const ROLE_PERMISSIONS = {
  platform_admin: new Set([
    Permission.EMAIL_SETTINGS_READ,
    Permission.EMAIL_SETTINGS_WRITE,
    Permission.EMAIL_SETTINGS_DELETE,
    Permission.EMAIL_SETTINGS_TEST,
    Permission.ADMIN_CONFIG_READ,
    Permission.ADMIN_CONFIG_WRITE,
    Permission.ADMIN_CONFIG_DELETE,
    Permission.QUESTIONNAIRE_READ,
    Permission.QUESTIONNAIRE_WRITE,
    Permission.QUESTIONNAIRE_DELETE,
    Permission.AUDIT_LOG_READ,
    Permission.AUDIT_LOG_EXPORT,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.SYSTEM_ADMIN,
    Permission.ENCRYPTION_KEY_MANAGE,
  ]),
  organization_admin: new Set([
    Permission.EMAIL_SETTINGS_READ,
    Permission.EMAIL_SETTINGS_WRITE,
    Permission.EMAIL_SETTINGS_TEST,
    Permission.QUESTIONNAIRE_READ,
    Permission.QUESTIONNAIRE_WRITE,
    Permission.AUDIT_LOG_READ,
    Permission.USER_READ,
  ]),
  user: new Set([
    Permission.EMAIL_SETTINGS_READ,
    Permission.QUESTIONNAIRE_READ,
  ]),
};

export class AccessControl {
  static async getContext(_request: NextRequest): Promise<AccessControlContext | null> {
    try {
      const session = await auth();
      
      if (!session?.user?.email) {
        return null;
      }

      // Get user from database with platform admin information
      const [user] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, session.user.email))
        .limit(1);

      if (!user) {
        return null;
      }

      // Determine role based on platform admin status
      const role = user.isPlatformAdmin ? 'platform_admin' : 'user';
      const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || new Set();

      return {
        user: {
          id: user.id,
          email: user.email || '', // Handle potential null email
          role: role,
          organizationId: undefined, // Platform admin doesn't have specific organization
        },
        permissions,
      };
    } catch (error) {
      console.error('Access control context error:', error);
      return null;
    }
  }

  static hasPermission(context: AccessControlContext, permission: Permission): boolean {
    return context.permissions.has(permission);
  }

  static hasAnyPermission(context: AccessControlContext, permissions: Permission[]): boolean {
    return permissions.some(permission => context.permissions.has(permission));
  }

  static hasAllPermissions(context: AccessControlContext, permissions: Permission[]): boolean {
    return permissions.every(permission => context.permissions.has(permission));
  }

  static requirePermission(context: AccessControlContext, permission: Permission): void {
    if (!this.hasPermission(context, permission)) {
      throw new AccessDeniedError(`Missing required permission: ${permission}`);
    }
  }

  static requireRole(context: AccessControlContext, role: string): void {
    if (context.user.role !== role) {
      throw new AccessDeniedError(`Required role: ${role}, got: ${context.user.role}`);
    }
  }

  static requirePlatformAdmin(context: AccessControlContext): void {
    this.requireRole(context, 'platform_admin');
  }

  static canAccessOrganization(context: AccessControlContext, organizationId: string): boolean {
    // Platform admin can access any organization
    if (context.user.role === 'platform_admin') {
      return true;
    }

    // Users can only access their own organization
    return context.user.organizationId === organizationId;
  }

  static requireOrganizationAccess(context: AccessControlContext, organizationId: string): void {
    if (!this.canAccessOrganization(context, organizationId)) {
      throw new AccessDeniedError(`Access denied to organization: ${organizationId}`);
    }
  }
}

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export function withAccessControl(
  handler: (request: NextRequest, context: AccessControlContext) => Promise<NextResponse>,
  requiredPermissions?: Permission[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const context = await AccessControl.getContext(request);
      
      if (!context) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check required permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermission = AccessControl.hasAnyPermission(context, requiredPermissions);
        if (!hasPermission) {
          return NextResponse.json(
            { 
              error: 'Forbidden', 
              message: 'Insufficient permissions',
              required: requiredPermissions 
            },
            { status: 403 }
          );
        }
      }

      return await handler(request, context);
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        return NextResponse.json(
          { error: 'Forbidden', message: error.message },
          { status: 403 }
        );
      }

      console.error('Access control middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Access control failed' },
        { status: 500 }
      );
    }
  };
}

export function withPlatformAdmin(
  handler: (request: NextRequest, context: AccessControlContext) => Promise<NextResponse>
) {
  return withAccessControl(async (request, context) => {
    AccessControl.requirePlatformAdmin(context);
    return handler(request, context);
  });
}

export function withPermissions(
  permissions: Permission[],
  handler: (request: NextRequest, context: AccessControlContext) => Promise<NextResponse>
) {
  return withAccessControl(handler, permissions);
}