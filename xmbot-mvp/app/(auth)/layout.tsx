import { Terminal } from "lucide-react"
import { Shield, Eye, Zap, CheckCircle2 } from "lucide-react"

const benefits = [
  { icon: Zap, text: "AI scans gold market 24/5" },
  { icon: Eye, text: "You approve every trade" },
  { icon: Shield, text: "2% max risk per trade" },
  { icon: CheckCircle2, text: "Setup in 15 minutes" },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <a href="/" className="flex items-center gap-2.5 mb-8 group">
          <div className="corner-frame w-10 h-10 rounded-md border border-border bg-accent/50 flex items-center justify-center group-hover:border-gold-500/50 transition-colors duration-200">
            <Terminal className="h-5 w-5 text-gold-500" />
          </div>
          <span className="text-2xl font-bold tracking-aggressive">
            <span className="text-foreground">XM</span>
            <span className="text-gold-500">One</span>
          </span>
        </a>
        {children}
      </div>

      {/* Right: Benefits panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-gold-500/5 via-transparent to-transparent border-l border-border">
        <div className="max-w-sm px-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Start trading gold in 15 minutes</h2>
          <p className="text-sm text-muted-foreground mb-8">Join the beta and let AI find high-probability trades while you stay in control.</p>
          <div className="space-y-5">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-5 w-5 text-gold-500" />
                </div>
                <span className="text-sm text-muted-foreground">{b.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">Backtested: 64% win rate, +84% return, 4.3% max drawdown.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
