import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

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
      return session
    },
    async authorized({ auth, request }) {
      // Este callback es llamado por el middleware
      const isLoggedIn = !!auth?.user
      const isOnAdmin = request.nextUrl.pathname.startsWith('/admin')
      const isOnAuth = request.nextUrl.pathname.startsWith('/auth')
      const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')
      
      // Permitir rutas de auth siempre
      if (isOnAuth || isApiAuth) {
        return true
      }
      
      // Proteger /admin
      if (isOnAdmin) {
        if (isLoggedIn) return true
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
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
})

