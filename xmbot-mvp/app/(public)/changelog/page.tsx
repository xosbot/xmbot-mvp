"use client"

import Link from "next/link"
import { Tag } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "@/components/landing/scroll-reveal"

const changelog = [
  {
    version: "0.3.0",
    date: "2026-01-15",
    title: "Beta Launch",
    changes: [
      "Multi-agent AI system with Technical Analysis, AI Validator, and Risk Manager",
      "Telegram signal cards with Approve/Reject buttons",
      "Binance integration with PAXGUSDT symbol mapping",
      "Live dashboard with real-time P&L tracking",
      "4 subscription plans with Cashfree payment gateway",
      "10x landing page redesign with Aceternity UI components",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-01-10",
    title: "Engine v2",
    changes: [
      "RSI Sniper + ADX Filter strategy",
      "Walk-forward validation (+19% on unseen data)",
      "Risk management engine with 2% max per trade",
      "Paper trading mode for risk-free testing",
      "Engine API with auth enforcement",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-01-05",
    title: "Initial Release",
    changes: [
      "Core trading engine with multi-agent architecture",
      "Web dashboard with Next.js",
      "NextAuth authentication with JWT",
      "PostgreSQL database with Prisma ORM",
      "Docker deployment with Caddy SSL",
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // Changelog
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive">
            Product Updates
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            Track every improvement and new feature.
          </p>
        </div>

        <StaggerChildren className="space-y-8" staggerDelay={0.1}>
          {changelog.map((release) => (
            <StaggerItem key={release.version}>
              <div className="relative pl-8 before:absolute before:left-[11px] before:top-10 before:bottom-0 before:w-px before:bg-white/10 last:before:hidden">
                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <Tag className="h-3 w-3 text-gold-400" />
                </div>
                <div className="p-6 rounded-md border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 text-xs font-mono font-bold">
                      v{release.version}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(release.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-3">{release.title}</h2>
                  <ul className="space-y-2">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-gold-400 mt-1">+</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </div>
  )
}
