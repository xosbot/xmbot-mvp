import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder")

type SendEmailParams = {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL] Would send email to ${to}: ${subject}`)
    return { id: "dry-run" }
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "XMBot <noreply@xmbot.online>",
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  })

  if (error) {
    console.error("[EMAIL] Send failed:", error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { id: data?.id }
}
