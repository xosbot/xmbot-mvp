"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, MessageSquare, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.")
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please email us directly.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // Contact
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive">
            Get in Touch
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            Have a question, feedback, or need support? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <a href="mailto:support@xmbot.online" className="text-white hover:text-gold-400 transition-colors">
                      support@xmbot.online
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Telegram</div>
                    <a href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gold-400 transition-colors">
                      @xmbot
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-md border border-white/10 bg-white/[0.03]">
              <h3 className="text-sm font-semibold text-white mb-3">Response Time</h3>
              <p className="text-sm text-slate-400">
                We typically respond within 24 hours. For urgent issues related to your
                trading bot, reach out on Telegram for faster support.
              </p>
            </div>

            <div className="p-6 rounded-md border border-white/10 bg-white/[0.03]">
              <h3 className="text-sm font-semibold text-white mb-3">Beta Support</h3>
              <p className="text-sm text-slate-400">
                During the beta period, we offer priority support to all users.
                Setup assistance is included with every subscription.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="p-8 rounded-md border border-white/10 bg-white/[0.03]">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                <p className="text-sm text-slate-400">
                  We&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="How can we help?"
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more..."
                    rows={5}
                    required
                    className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold transition-colors duration-200"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
