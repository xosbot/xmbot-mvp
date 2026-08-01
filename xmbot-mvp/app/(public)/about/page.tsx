import { Shield, Eye, TrendingUp, Users, Zap, Bot } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description: "Learn about XMBot — AI-powered gold trading with human-in-the-loop approval.",
}

export default function AboutPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // About XMBot
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
            Trading Meets
            <br />
            <span className="text-gradient-gold">Artificial Intelligence</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            XMBot was built with a simple thesis: AI can analyze markets better than humans,
            but humans should always make the final call. We combine multi-agent AI systems
            with human judgment to create a trading platform that&apos;s both powerful and safe.
          </p>
        </div>

        {/* Mission */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-aggressive mb-6">
              Our Mission
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Most trading bots are black boxes. They trade your money without your input,
              and when they fail, you lose everything. We took a different approach.
            </p>
            <p className="text-slate-400 leading-relaxed mb-4">
              XMBot uses a multi-agent architecture where specialized AI agents analyze
              different aspects of the market — technical indicators, pattern recognition,
              risk assessment — and only present trades for your approval.
            </p>
            <p className="text-slate-400 leading-relaxed">
              You stay in control. Every single trade requires your explicit approval.
              No surprises. No hidden auto-execution. Just AI-powered analysis and your
              informed decision.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, title: "Risk First", desc: "2% max risk per trade. Always.", data: false },
              { icon: Eye, title: "Transparent", desc: "See every signal, every decision.", data: false },
              { icon: TrendingUp, title: "Backtested", desc: "64% win rate over 6 months.", data: true },
              { icon: Users, title: "Human-Centered", desc: "You approve every trade.", data: false },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-md border border-white/10 bg-white/[0.03]">
                <item.icon className={`h-6 w-6 mb-3 ${item.data ? "text-emerald-400" : "text-gold-400"}`} />
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-white tracking-aggressive text-center mb-12">
            What We Believe
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: "AI Should Assist, Not Replace",
                description: "The best trading decisions come from combining AI analysis with human judgment. Neither alone is sufficient.",
              },
              {
                icon: Shield,
                title: "Risk Management Is Everything",
                description: "A 64% win rate means nothing without proper risk management. We enforce 2% max risk on every single trade.",
              },
              {
                icon: Eye,
                title: "Transparency Builds Trust",
                description: "We show you every signal, every analysis, every decision. No black boxes. No hidden logic. Full visibility.",
              },
            ].map((value) => (
              <div key={value.title} className="p-8 rounded-md border border-white/10 bg-white/[0.03] text-center">
                <div className="w-14 h-14 rounded-md mx-auto mb-6 flex items-center justify-center bg-gold-500/10">
                  <value.icon className="h-7 w-7 text-gold-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-aggressive mb-4">
            Ready to Try XMBot?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join the beta and experience AI-powered trading with full control.
          </p>
          <a href="/register">
            <button className="bg-gold-500 hover:bg-gold-400 text-neutral-950 px-8 py-3 rounded-md font-semibold transition-colors duration-200">
              Set Up in 15 Minutes
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}
