"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, Mail, ArrowLeft, XCircle, Loader2 } from "lucide-react"

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const verified = searchParams.get("verified") === "true"
  const error = searchParams.get("error")

  useEffect(() => {
    const stored = localStorage.getItem("pendingVerificationEmail")
    if (stored) {
      setEmail(stored)
    }
  }, [])

  const handleResend = async () => {
    if (!email) return
    setSending(true)
    try {
      await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-md bg-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-gold-500" />
            </div>
            <CardTitle className="text-foreground">Email Verified!</CardTitle>
            <CardDescription>Your email has been verified. You can now sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full bg-gold-500 hover:bg-gold-600 text-neutral-950 font-semibold">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-gold-500" />
          </div>
          <CardTitle className="text-foreground">Verify Your Email</CardTitle>
          <CardDescription>
            {error === "invalid-token"
              ? "Invalid verification link."
              : error === "expired-token"
              ? "Verification link has expired."
              : "Check your email for the verification link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {error === "invalid-token" && "This verification link is invalid."}
              {error === "expired-token" && "This verification link has expired. Please request a new one."}
              {error === "verification-failed" && "Verification failed. Please try again."}
            </div>
          )}

          {email && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Didn&apos;t receive the email? Check spam or request a new one.
              </p>
              <Button
                onClick={handleResend}
                disabled={sending || sent}
                variant="outline"
                className="w-full border-border text-muted-foreground"
              >
                {sent ? "Email sent!" : sending ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          )}

          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  )
}
