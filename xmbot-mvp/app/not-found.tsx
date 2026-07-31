import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8">
        <Zap className="h-10 w-10 text-emerald-400" />
      </div>
      <h1 className="text-6xl font-bold text-white tracking-aggressive mb-4">404</h1>
      <p className="text-lg text-slate-400 mb-8 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
            Go Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800/50">
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
