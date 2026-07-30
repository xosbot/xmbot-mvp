import Link from "next/link"
import { Bot } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Bot className="h-8 w-8 text-emerald-500" />
        <span className="text-2xl font-bold text-white">XMBot</span>
      </Link>
      {children}
    </div>
  )
}
