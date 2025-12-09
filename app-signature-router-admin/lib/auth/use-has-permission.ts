'use client';

/**
 * React Hook for checking user permissions
 */

import { useUserRoles } from './use-user-roles';
import { hasPermission, hasRole, type Role, PERMISSIONS } from './roles';

export interface PermissionCheck {
  /** Check if user has specific permission */
  can: (permission: keyof typeof PERMISSIONS) => boolean;
  /** Check if user has specific role(s) */
  hasRole: (roles: Role | Role[]) => boolean;
  /** User's roles array */
  roles: string[];
  /** Primary role */
  primaryRole: Role | null;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook to check user permissions
 * 
 * Provides convenient methods to check if the current user
 * has specific permissions or roles.
 * 
 * @returns PermissionCheck object with utility methods
 * 
 * @example
 * ```tsx
 * function RuleActions() {
 *   const { can, hasRole } = useHasPermission();
 *   
 *   return (
 *     <>
 *       {can('createRules') && <Button>Create Rule</Button>}
 *       {can('deleteRules') && <Button variant="destructive">Delete</Button>}
 *       {hasRole(Role.ADMIN) && <Button>Admin Only</Button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useHasPermission(): PermissionCheck {
  const { roles, primaryRole, isLoading } = useUserRoles();

  return {
    can: (permission: keyof typeof PERMISSIONS) => hasPermission(roles, permission),
    hasRole: (requiredRoles: Role | Role[]) => hasRole(roles, requiredRoles),
    roles,
    primaryRole,
    isLoading,
  };
}

