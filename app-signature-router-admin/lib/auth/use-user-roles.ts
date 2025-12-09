'use client';

/**
 * React Hook for accessing user roles from JWT session
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { extractRolesFromJWT, getPrimaryRole, type Role } from './roles';

export interface UserRolesInfo {
  /** Array of all user roles */
  roles: string[];
  /** Primary/highest priority role */
  primaryRole: Role | null;
  /** Loading state */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Username from JWT */
  username: string | null;
}

/**
 * Hook to get user roles from NextAuth session
 * 
 * Extracts roles from Keycloak JWT token:
 * - realm_access.roles (realm-level roles)
 * - resource_access.{client_id}.roles (client-specific roles)
 * 
 * @returns UserRolesInfo with roles array and utility info
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { roles, primaryRole, isLoading } = useUserRoles();
 *   
 *   if (isLoading) return <Spinner />;
 *   
 *   return <div>Welcome, {primaryRole}!</div>;
 * }
 * ```
 */
export function useUserRoles(): UserRolesInfo {
  const { data: session, status } = useSession();

  const rolesInfo = useMemo(() => {
    // Extract roles from JWT token claims
    // NextAuth stores the decoded JWT in the session
    const token = (session as any)?.token || session?.user;
    const roles = extractRolesFromJWT(token);
    const primaryRole = getPrimaryRole(roles);
    
    // Extract username from preferred_username claim
    const username = token?.preferred_username || session?.user?.name || null;

    return {
      roles,
      primaryRole,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      username,
    };
  }, [session, status]);

  return rolesInfo;
}

