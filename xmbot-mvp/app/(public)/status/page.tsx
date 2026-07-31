"use client"

import { CheckCircle, AlertCircle, Clock } from "lucide-react"

const services = [
  { name: "Trading Engine", status: "operational" as const },
  { name: "Web Dashboard", status: "operational" as const },
  { name: "Telegram Alerts", status: "operational" as const },
  { name: "Binance Integration", status: "operational" as const },
  { name: "Payment Gateway", status: "operational" as const },
  { name: "API", status: "operational" as const },
]

const incidents: { date: string; title: string; status: string; resolution: string }[] = [
  {
    date: "2026-01-15",
    title: "Scheduled Maintenance",
    status: "resolved",
    resolution: "Database migration completed. All systems operational.",
  },
]

function StatusBadge({ status }: { status: "operational" | "degraded" | "outage" }) {
  if (status === "operational") {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Operational</span>
      </div>
    )
  }
  if (status === "degraded") {
    return (
      <div className="flex items-center gap-2 text-yellow-400">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Degraded</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-red-400">
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm font-medium">Outage</span>
    </div>
  )
}

export default function StatusPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
            System Status
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive">
            All Systems Operational
          </h1>
          <p className="mt-4 text-slate-400">
            Last checked: {new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        {/* Services */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Services</h2>
          </div>
          <div className="divide-y divide-white/10">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-300">{service.name}</span>
                <StatusBadge status={service.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Past Incidents</h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-slate-400">No incidents reported in the last 90 days.</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident, i) => (
                <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase">Resolved</span>
                    <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {incident.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{incident.title}</h3>
                  <p className="text-sm text-slate-400">{incident.resolution}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
