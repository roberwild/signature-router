import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { extractRolesFromJWT } from "./lib/auth/roles"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        console.log("[auth] JWT callback - account received, storing tokens")
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.id = user?.id
        
        // Extract roles from JWT for RBAC
        // Decode the access_token to get claims
        if (account.access_token) {
          try {
            const base64Url = account.access_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decodedToken = JSON.parse(jsonPayload);
            
            // 🔍 DIAGNÓSTICO: Loguear estructura completa en DEV (útil para Keycloak corporativo)
            if (process.env.NODE_ENV === 'development') {
              console.log("[auth] ===== JWT PAYLOAD ANALYSIS =====")
              console.log("[auth] realm_access:", decodedToken.realm_access)
              console.log("[auth] resource_access:", decodedToken.resource_access)
              console.log("[auth] groups:", decodedToken.groups)
              console.log("[auth] ad_groups:", decodedToken.ad_groups)
              console.log("[auth] ==================================")
            }
            
            token.realm_access = decodedToken.realm_access
            token.resource_access = decodedToken.resource_access
            token.preferred_username = decodedToken.preferred_username
            const roles = extractRolesFromJWT(decodedToken)
            token.roles = roles
            console.log("[auth] ✅ Extracted roles from JWT:", roles)
          } catch (error) {
            console.error("[auth] ❌ Error decoding JWT:", error)
            token.roles = []
          }
        }
      }
      
      // Check if token has expired
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
        console.log("[auth] JWT callback - Token expired, marking session as expired")
        token.error = "TokenExpired"
      }
      
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      console.log("[auth] Session callback - token exists:", !!token.accessToken)
      session.accessToken = token.accessToken as string
      session.error = token.error as string | undefined
      if (token.id) {
        session.user.id = token.id as string
      }
      
      // Include roles and JWT claims in session for frontend RBAC
      session.token = {
        realm_access: token.realm_access,
        resource_access: token.resource_access,
        preferred_username: token.preferred_username,
      } as any
      session.roles = token.roles as string[]
      
      return session
    },
    async authorized({ auth, request }) {
      // Este callback es llamado por el middleware
      const isLoggedIn = !!auth?.user
      const hasValidToken = !!auth?.accessToken && auth?.error !== "TokenExpired"
      const isOnAdmin = request.nextUrl.pathname.startsWith('/admin')
      const isOnAuth = request.nextUrl.pathname.startsWith('/auth')
      const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')
      
      // Permitir rutas de auth siempre
      if (isOnAuth || isApiAuth) {
        return true
      }
      
      // Proteger /admin - requiere usuario logueado Y token válido
      if (isOnAdmin) {
        if (isLoggedIn && hasValidToken) return true
        console.log("[auth] Redirecting to login - isLoggedIn:", isLoggedIn, "hasValidToken:", hasValidToken)
        return false // Redirect to login
      }
      
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes (mismo que Keycloak)
  },
  events: {
    async signOut({ token }) {
      // Logout from Keycloak when user signs out
      if (token?.accessToken) {
        try {
          const issuerUrl = process.env.KEYCLOAK_ISSUER;
          const logoutUrl = `${issuerUrl}/protocol/openid-connect/logout`;
          
          await fetch(logoutUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
              refresh_token: token.refreshToken as string,
            }),
          });
          
          console.log("[auth] Successfully logged out from Keycloak");
        } catch (error) {
          console.error("[auth] Error logging out from Keycloak:", error);
        }
      }
    },
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
})

