import { Terminal } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <a href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="corner-frame w-10 h-10 rounded-md border border-white/15 bg-white/[0.03] flex items-center justify-center group-hover:border-gold-500/50 transition-colors duration-200">
          <Terminal className="h-5 w-5 text-gold-400" />
        </div>
        <span className="text-2xl font-bold tracking-aggressive">
          <span className="text-white">XM</span>
          <span className="text-gold-400">Bot</span>
        </span>
      </a>
      {children}
    </div>
  )
}
