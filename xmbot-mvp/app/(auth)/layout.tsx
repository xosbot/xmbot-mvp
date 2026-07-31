import { Zap } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <a href="/" className="flex items-center gap-2 mb-8 group">
        <div className="relative w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
          <Zap className="h-6 w-6 text-emerald-400" />
        </div>
        <span className="text-2xl font-bold tracking-aggressive">
          <span className="text-white">XM</span>
          <span className="text-emerald-400">Bot</span>
        </span>
      </a>
      {children}
    </div>
  )
}
