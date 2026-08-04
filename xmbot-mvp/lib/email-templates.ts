function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function contactFormEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)

  return {
    subject: `[Contact] ${safeSubject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #D4AF37;">New Contact Form Message</h1>
        <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p style="margin-top: 16px; white-space: pre-wrap; border-left: 3px solid #D4AF37; padding-left: 12px; color: #333;">${safeMessage}</p>
      </div>
    `,
  }
}

export function verificationEmail({ verifyLink }: { verifyLink: string }) {
  return {
    subject: "Verify your XMBot email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #D4AF37;">XMBot</h1>
        <p>Confirm your email address to finish setting up your account:</p>
        <a href="${verifyLink}" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Verify Email
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an XMBot account, ignore this email.
        </p>
      </div>
    `,
  }
}

export function passwordResetEmail({ resetLink }: { resetLink: string }) {
  return {
    subject: "Reset your XMBot password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #D4AF37;">XMBot</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  }
}
