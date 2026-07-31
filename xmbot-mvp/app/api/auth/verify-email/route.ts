import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true })
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Already verified" })
    }

    // Delete old tokens
    await db.$executeRaw`DELETE FROM "PasswordResetToken" WHERE email = ${email} AND "expiresAt" < NOW()`

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Reuse PasswordResetToken table for email verification
    await db.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    })

    // TODO: Send verification email via Resend
    // For now, log the token for testing
    console.log(`[EMAIL VERIFICATION] Token for ${email}: ${token}`)
    console.log(`[EMAIL VERIFICATION] Verify URL: ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email verification request error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
