import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"
import { verificationEmail } from "@/lib/email-templates"

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verifyLink = `${appUrl}/api/auth/verify-email/confirm?token=${token}`

    const template = verificationEmail({ verifyLink })
    await sendEmail({ to: email, ...template })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email verification request error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
