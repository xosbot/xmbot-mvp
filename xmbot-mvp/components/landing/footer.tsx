import Link from "next/link"
import { Brain } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <Brain className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                XM<span className="text-emerald-400">Bot</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              AI-powered multi-agent trading platform for gold (XAUUSD).
              Technical analysis meets human oversight.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="#how-it-works" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">How It Works</Link></li>
              <li><Link href="#features" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Get Started</Link></li>
              <li><span className="text-sm text-slate-500">navigator.xm@gmail.com</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-slate-500">Privacy Policy</span></li>
              <li><span className="text-sm text-slate-500">Terms of Service</span></li>
              <li><span className="text-sm text-slate-500">Risk Disclaimer</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} XMBot. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 max-w-md text-center sm:text-right">
            XMBot is not a financial advisor. Trading involves significant risk of loss.
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  )
}
