'use client';

/**
 * RoleGuard Component
 * 
 * Conditionally renders children based on user roles/permissions
 */

import { ReactNode } from 'react';
import { useHasPermission } from '@/lib/auth/use-has-permission';
import { Role, PERMISSIONS } from '@/lib/auth/roles';

interface RoleGuardProps {
  /** Required roles (user must have at least one) */
  roles?: Role | Role[];
  /** Required permission key */
  permission?: keyof typeof PERMISSIONS;
  /** Children to render if authorized */
  children: ReactNode;
  /** Fallback to render if not authorized (optional) */
  fallback?: ReactNode;
  /** Whether to show loading state while checking permissions */
  showLoading?: boolean;
}

/**
 * RoleGuard - Conditionally render components based on user permissions
 * 
 * Use either `roles` OR `permission` prop (not both).
 * 
 * @example
 * ```tsx
 * // Using roles
 * <RoleGuard roles={Role.ADMIN}>
 *   <Button>Admin Only</Button>
 * </RoleGuard>
 * 
 * // Using permission
 * <RoleGuard permission="deleteRules">
 *   <Button variant="destructive">Delete</Button>
 * </RoleGuard>
 * 
 * // Multiple roles (any of them)
 * <RoleGuard roles={[Role.ADMIN, Role.CONSULTIVO]}>
 *   <CreateRuleButton />
 * </RoleGuard>
 * 
 * // With fallback
 * <RoleGuard roles={Role.ADMIN} fallback={<div>Access Denied</div>}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  roles,
  permission,
  children,
  fallback = null,
  showLoading = false,
}: RoleGuardProps) {
  const { can, hasRole: checkRole, isLoading } = useHasPermission();

  // Show loading state if requested
  if (showLoading && isLoading) {
    return <>{fallback}</>;
  }

  // Check permission
  if (permission) {
    return can(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Check roles
  if (roles) {
    return checkRole(roles) ? <>{children}</> : <>{fallback}</>;
  }

  // No roles or permission specified - render children
  return <>{children}</>;
}

/**
 * Inverse of RoleGuard - renders children if user does NOT have permission
 */
export function RoleGuardInverse({
  roles,
  permission,
  children,
}: Omit<RoleGuardProps, 'fallback' | 'showLoading'>) {
  const { can, hasRole: checkRole } = useHasPermission();

  // Check permission
  if (permission) {
    return !can(permission) ? <>{children}</> : null;
  }

  // Check roles
  if (roles) {
    return !checkRole(roles) ? <>{children}</> : null;
  }

  return null;
}

