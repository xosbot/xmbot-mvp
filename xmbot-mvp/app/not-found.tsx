import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <Bot className="h-16 w-16 text-slate-700 mb-6" />
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-slate-400 mb-8">Page not found</p>
      <Link href="/">
        <Button className="bg-emerald-600 hover:bg-emerald-700">Go Home</Button>
      </Link>
    </div>
  )
}
