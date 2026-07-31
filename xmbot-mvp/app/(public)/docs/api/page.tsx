import { ArrowLeft, Lock, Zap, Shield, Bot, BarChart3 } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Reference",
  description: "XMBot API documentation — integrate with trading signals, account data, and bot management.",
}

export default function ApiDocsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Docs
        </Link>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive mb-8">
          API Reference
        </h1>

        <div className="prose prose-invert prose-slate max-w-none space-y-12">
          {/* Authentication */}
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Lock className="h-6 w-6 text-emerald-400" />
              Authentication
            </h2>
            <p className="text-slate-400 leading-relaxed">
              All API requests require authentication via an API key. Include your key in the
              <code className="mx-1 px-2 py-0.5 rounded bg-white/10 text-emerald-400 text-sm">Authorization</code>
              header:
            </p>
            <div className="p-4 rounded-lg bg-black/50 border border-white/10 font-mono text-sm text-slate-300 mt-4">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Zap className="h-6 w-6 text-emerald-400" />
              Engine Endpoints
            </h2>
            <div className="space-y-4">
              {[
                { method: "GET", path: "/api/engine/status", description: "Get engine health status and uptime" },
                { method: "GET", path: "/api/engine/account", description: "Get account balance, equity, and margin" },
                { method: "GET", path: "/api/engine/positions", description: "List open positions with live P&L" },
                { method: "POST", path: "/api/engine/control", description: "Start, stop, or pause the engine" },
              ].map((endpoint) => (
                <div key={endpoint.path} className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      endpoint.method === "GET" ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-slate-300 font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-sm text-slate-400">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bot Management */}
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Bot className="h-6 w-6 text-emerald-400" />
              Bot Management
            </h2>
            <div className="space-y-4">
              {[
                { method: "GET", path: "/api/bots", description: "List all your bot instances" },
                { method: "POST", path: "/api/bots", description: "Create a new bot instance" },
                { method: "PATCH", path: "/api/bots/:id", description: "Update bot configuration or status" },
                { method: "DELETE", path: "/api/bots/:id", description: "Delete a bot instance" },
              ].map((endpoint) => (
                <div key={endpoint.path} className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      endpoint.method === "GET" ? "bg-emerald-500/20 text-emerald-400" :
                      endpoint.method === "POST" ? "bg-violet-500/20 text-violet-400" :
                      endpoint.method === "PATCH" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-slate-300 font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-sm text-slate-400">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Trade Data */}
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
              Trade Data
            </h2>
            <div className="space-y-4">
              {[
                { method: "GET", path: "/api/trades", description: "List trade history with filters" },
                { method: "GET", path: "/api/trades/:id", description: "Get detailed trade information" },
              ].map((endpoint) => (
                <div key={endpoint.path} className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-slate-300 font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-sm text-slate-400">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Rate Limits */}
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-400" />
              Rate Limits
            </h2>
            <p className="text-slate-400 leading-relaxed">
              API requests are rate-limited to 100 requests per minute per API key.
              Exceeding this limit will return a <code className="mx-1 px-2 py-0.5 rounded bg-white/10 text-yellow-400 text-sm">429</code> status code.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
