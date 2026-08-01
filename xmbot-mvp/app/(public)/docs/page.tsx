"use client"

import Link from "next/link"
import { Book, Code, Zap, ArrowRight } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "@/components/landing/scroll-reveal"

const sections = [
  {
    icon: Zap,
    title: "Quick Start",
    description: "Get up and running with XMBot in 15 minutes. Connect Telegram, configure risk, and receive your first signal.",
    href: "/docs/quickstart",
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Integrate with XMBot via our REST API. Access trading signals, account data, and bot management endpoints.",
    href: "/docs/api",
  },
  {
    icon: Book,
    title: "Trading Strategy",
    description: "Understand the RSI Sniper + ADX Filter strategy, backtest methodology, and risk management framework.",
    href: "/docs/strategy",
  },
]

export default function DocsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // Documentation
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive">
            Documentation
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            Everything you need to use XMBot effectively.
          </p>
        </div>

        <StaggerChildren className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {sections.map((section) => (
            <StaggerItem key={section.title}>
              <Link href={section.href} className="block group">
                <div className="p-8 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors duration-200 h-full">
                  <div className="w-14 h-14 rounded-md flex items-center justify-center mb-6 bg-gold-500/10">
                    <section.icon className="h-7 w-7 text-gold-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-gold-400 transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{section.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gold-400 font-medium">
                    Read docs
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </div>
  )
}
