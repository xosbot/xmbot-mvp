import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"
import { contactFormEmail } from "@/lib/email-templates"
import { contactSchema } from "@/lib/validations"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const allowed = rateLimit({ identifier: `contact:${ip}`, maxRequests: 5, windowMs: 10 * 60_000 })
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data
    const template = contactFormEmail({ name, email, subject, message })
    await sendEmail({
      to: process.env.CONTACT_EMAIL || "support@xmbot.online",
      replyTo: email,
      ...template,
    })

    return NextResponse.json({ message: "Message sent." })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Something went wrong. Please email us directly." }, { status: 500 })
  }
}
