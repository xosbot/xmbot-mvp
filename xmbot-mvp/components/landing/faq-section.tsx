"use client"

import { ScrollReveal } from "./scroll-reveal"
import { ExpandableCard } from "@/components/ui/aceternity/expandable-card"

const faqs = [
  { question: "Is my money safe?", answer: "XMBot never has direct access to your funds. We connect via API keys with trading permissions only (no withdrawal). You can revoke access anytime. The 2% risk rule ensures no single trade can cause significant damage." },
  { question: "What if I'm not satisfied?", answer: "We offer a full refund within 7 days of purchase if you're not satisfied. No questions asked. We want you to be confident in your decision." },
  { question: "What is XMBot?", answer: "XMBot is an AI-powered trading platform for gold (XAUUSD). It uses a multi-agent system to analyze the market 24/5 and sends trading signals to your Telegram. You approve or reject each trade — no auto-execution without your say." },
  { question: "How does the human-in-the-loop work?", answer: "When the AI identifies a trading opportunity, it sends a signal card to your Telegram with entry price, stop loss, take profit, and confidence score. You tap Approve or Reject. Only after your approval does the system execute the trade." },
  { question: "Do I need to keep my computer running?", answer: "No. The engine runs on our servers 24/5 during market hours. You just need Telegram on your phone to receive signals and approve trades. No computer required." },
  { question: "What's the minimum capital needed?", answer: "We recommend starting with at least $500 for paper trading. For live trading, $1,000+ is ideal to properly implement the 2% risk management rule. The bot trades 0.05 lot sizes by default." },
  { question: "What broker do you support?", answer: "Currently: Paper Trading (for testing) and Binance (for PAXGUSDT). MetaTrader 5 and Interactive Brokers are coming soon. You can switch brokers without changing your strategy." },
  { question: "How is this different from other trading bots?", answer: "Most bots trade automatically without your input. XMBot requires human approval for every trade. We also use a multi-agent architecture (not just simple indicators) and AI validation for higher-quality signals." },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 sm:py-32 relative" aria-labelledby="faq-heading">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
              FAQ
            </div>
            <h2 id="faq-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
              Frequently Asked
              <br />
              <span className="text-gradient-emerald">Questions</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8" role="list">
            {faqs.map((faq) => (
              <ExpandableCard key={faq.question} title={faq.question}>
                {faq.answer}
              </ExpandableCard>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
