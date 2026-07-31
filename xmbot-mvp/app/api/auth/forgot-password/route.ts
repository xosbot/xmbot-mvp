import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { randomBytes, createHash } from "crypto"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"
import { passwordResetEmail } from "@/lib/email-templates"

export const dynamic = "force-dynamic"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const allowed = rateLimit({ identifier: `forgot:${ip}`, maxRequests: 3, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: "If this email exists, a reset link has been sent." })
    }

    const token = randomBytes(32).toString("hex")
    const hashedToken = hashToken(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.$transaction([
      db.passwordResetToken.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      }),
      db.passwordResetToken.create({
        data: { email, token: hashedToken, expiresAt },
      }),
    ])

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${appUrl}/reset-password?token=${token}`

    const template = passwordResetEmail({ resetLink })
    await sendEmail({ to: email, ...template })

    return NextResponse.json({
      message: "If this email exists, a reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
