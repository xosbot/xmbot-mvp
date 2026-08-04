import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnSuperAdminEngine = nextUrl.pathname.startsWith("/admin/engine")
      const isOnAdmin = nextUrl.pathname.startsWith("/admin")

      if (isOnSuperAdminEngine) {
        if (!isLoggedIn) return false
        const role = (auth?.user as { role?: string })?.role
        if (role !== "SUPERADMIN") {
          return Response.redirect(new URL("/admin", nextUrl))
        }
        return true
      }

      if (isOnAdmin) {
        if (!isLoggedIn) return false
        const role = (auth?.user as { role?: string })?.role
        if (role !== "ADMIN" && role !== "SUPERADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      if (isOnDashboard) {
        if (!isLoggedIn) return false
        return true
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
