import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", process.env.NEXT_PUBLIC_APP_URL))
    }

    const record = await db.passwordResetToken.findUnique({ where: { token } })

    if (!record || record.usedAt || new Date() > record.expiresAt) {
      return NextResponse.redirect(new URL("/login?error=expired-token", process.env.NEXT_PUBLIC_APP_URL))
    }

    // Mark email as verified
    await db.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    })

    return NextResponse.redirect(new URL("/login?verified=true", process.env.NEXT_PUBLIC_APP_URL))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/login?error=verification-failed", process.env.NEXT_PUBLIC_APP_URL))
  }
}
