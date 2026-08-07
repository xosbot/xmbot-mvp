"use client"

import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"

/**
 * The hero's visual centerpiece: real product surfaces, not abstract
 * decoration. A faithful mockup of the actual Telegram approval card
 * (mirrors the live bot's message format and inline Approve/Reject
 * keyboard) layered in front of a dashboard position card. This is the
 * one place on the page that gets real elevation — a deliberate deep
 * shadow, used once, so it reads as the centerpiece.
 */

function TelegramApprovalCard() {
  return (
    <div className="corner-frame relative w-full max-w-sm rounded-xl border border-border bg-[#17212b] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/15 text-gold-400 font-mono text-sm font-semibold">
          &gt;_
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1 text-sm font-medium text-white/90">
            XMOne
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#4ba3e3]" aria-hidden="true">
              <path d="M12 2 14.5 4.5 18 3.5 18.5 7 22 8.5 20 12 22 15.5 18.5 17 18 20.5 14.5 19.5 12 22 9.5 19.5 6 20.5 5.5 17 2 15.5 4 12 2 8.5 5.5 7 6 3.5 9.5 4.5Z" />
              <path d="M9.5 12.2 11.3 14 15 9.8" stroke="#17212b" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-[11px] text-white/40">bot</div>
        </div>
      </div>

      <div className="px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-white/85">
        <div className="text-gold-400">📊 technical Signal</div>
        <div className="mt-1.5 space-y-0.5">
          <div>Action: <span className="text-white">BUY XAUUSD</span></div>
          <div>Entry: <span className="text-white">$3,350.25</span></div>
          <div>SL: <span className="text-white">$3,340.00</span> (risk: $10.25)</div>
          <div>TP: <span className="text-white">$3,375.00</span></div>
          <div>Confidence: <span className="text-white">82%</span></div>
          <div className="text-white/60">Reason: RSI oversold bounce + ADX trend</div>
        </div>
        <div className="mt-2 text-emerald-400">🤖 AI: SAFE — Setup aligns with trend</div>
        <div className="mt-2 text-[10px] text-white/30">10:42 AM</div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5 border-t border-white/5">
        <button className="bg-[#1c2733] py-2.5 text-sm font-medium text-emerald-400 hover:bg-[#212e3b] transition-colors">
          ✅ Approve
        </button>
        <button className="bg-[#1c2733] py-2.5 text-sm font-medium text-white/50 hover:bg-[#212e3b] transition-colors">
          ❌ Reject
        </button>
      </div>
    </div>
  )
}

function DashboardPositionCard() {
  return (
    <div className="w-full max-w-xs rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="mono-label text-[10px] text-muted-foreground">Positions</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-600 font-mono">LIVE</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-gold-600" />
            <span className="text-sm font-medium text-foreground">XAUUSD</span>
          </div>
          <span className="font-mono text-sm text-emerald-600">+$47.20</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div>
            <div className="text-muted-foreground">Entry</div>
            <div className="text-foreground">3,350.25</div>
          </div>
          <div>
            <div className="text-muted-foreground">Current</div>
            <div className="text-foreground">3,354.10</div>
          </div>
          <div>
            <div className="text-muted-foreground">P&amp;L</div>
            <div className="text-emerald-600">+1.45%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductMockupStack() {
  return (
    <div className="relative w-full flex items-center justify-center py-8 lg:py-0">
      <motion.div
        initial={{ opacity: 0, y: 16, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute right-0 top-6 hidden sm:block"
      >
        <DashboardPositionCard />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative z-10"
      >
        <TelegramApprovalCard />
      </motion.div>
    </div>
  )
}
