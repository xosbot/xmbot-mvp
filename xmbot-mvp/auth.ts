import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"
import { rateLimit } from "@/lib/rate-limit"

// A role/status change made via the admin panel writes straight to Postgres — it
// doesn't touch any existing session's JWT. Without this, a promoted/demoted user's
// access stays whatever it was at their last sign-in until they log out and back in.
// This callback only runs in the Node runtime (auth.ts), never in Edge middleware, so
// the DB round trip here is safe — auth.config.ts's shared `jwt` callback (used by
// middleware too) stays DB-free.
const ROLE_REVALIDATE_MS = 60_000

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.roleCheckedAt = Date.now()
        return token
      }

      const checkedAt = token.roleCheckedAt ?? 0
      if (token.id && Date.now() - checkedAt > ROLE_REVALIDATE_MS) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        })
        // No `null` here — a deleted/unrecognized user just clears role to `undefined`,
        // which checkRole() (lib/auth-helpers.ts) already treats as unauthorized.
        token.role = dbUser?.role ?? undefined
        token.roleCheckedAt = Date.now()
      }

      return token
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const allowed = rateLimit({ identifier: `login:${email}`, maxRequests: 10, windowMs: 60_000 })
        if (!allowed) {
          throw new Error("Too many login attempts. Try again later.")
        }

        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
