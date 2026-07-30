import { TrendingUp, Target, ShieldCheck, BarChart3 } from "lucide-react"

const stats = [
  {
    label: "Win Rate",
    value: "64%",
    description: "Profitable trades over 6 months of backtesting",
    icon: Target,
    trend: "up",
  },
  {
    label: "Total Return",
    value: "+84.3%",
    description: "Backtested return on XAUUSD M5 data",
    icon: TrendingUp,
    trend: "up",
  },
  {
    label: "Max Drawdown",
    value: "4.3%",
    description: "Controlled risk — worst peak-to-trough",
    icon: ShieldCheck,
    trend: "neutral",
  },
  {
    label: "Total Trades",
    value: "1,083",
    description: "Executed across 6 months of validation",
    icon: BarChart3,
    trend: "neutral",
  },
]

export function ProofSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-slate-800/50 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-0 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Numbers Don&apos;t Lie
          </h2>
          <p className="mt-4 text-slate-400">
            Our strategy performance over 6 months of XAUUSD M5 data.
            Walk-forward validated +19% on unseen data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 text-center group hover:border-slate-700/60 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                  stat.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-slate-500/10 text-slate-400"
                }`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-300 mb-1">{stat.label}</div>
              <div className="text-xs text-slate-500">{stat.description}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8 max-w-lg mx-auto">
          * Past performance does not guarantee future results. Trading involves significant
          risk of loss. Results based on backtested data.
        </p>
      </div>
    </section>
  )
}
