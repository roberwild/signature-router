/**
 * Utility functions for authentication and logout
 */

/**
 * Performs a complete logout:
 * 1. Ends NextAuth session
 * 2. Redirects to Keycloak logout endpoint
 * 3. Keycloak redirects back to the app
 */
export async function performKeycloakLogout() {
  const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || process.env.KEYCLOAK_ISSUER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  
  if (!keycloakIssuer) {
    console.error('[auth-utils] KEYCLOAK_ISSUER not configured');
    // Fallback to simple NextAuth signOut
    const { signOut } = await import('next-auth/react');
    return signOut({ callbackUrl: '/auth/signin' });
  }

  // Build Keycloak logout URL
  const keycloakLogoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
  keycloakLogoutUrl.searchParams.set('post_logout_redirect_uri', `${appUrl}/auth/signin`);
  keycloakLogoutUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'signature-router-admin');

  // First, end NextAuth session
  const { signOut } = await import('next-auth/react');
  await signOut({ redirect: false });

  // Then redirect to Keycloak logout (which will clear Keycloak session)
  window.location.href = keycloakLogoutUrl.toString();
}

