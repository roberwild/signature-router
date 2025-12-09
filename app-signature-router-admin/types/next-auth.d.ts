/**
 * NextAuth Type Extensions
 * 
 * Extends default NextAuth types to include custom session properties
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended Session type with custom properties
   */
  interface Session {
    /** JWT access token from Keycloak */
    accessToken: string;
    /** Error state (e.g., "TokenExpired") */
    error?: string;
    /** User roles extracted from JWT */
    roles?: string[];
    /** JWT token claims (for role extraction) */
    token?: {
      realm_access?: {
        roles?: string[];
      };
      resource_access?: Record<string, {
        roles?: string[];
      }>;
      preferred_username?: string;
    };
  }

  /**
   * Extended User type
   */
  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT type with custom properties
   */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    id?: string;
    roles?: string[];
    realm_access?: {
      roles?: string[];
    };
    resource_access?: Record<string, {
      roles?: string[];
    }>;
    preferred_username?: string;
  }
}
