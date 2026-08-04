import { CheckCircle, AlertCircle, HelpCircle, Clock } from "lucide-react"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"

type ServiceState = "operational" | "outage" | "not_monitored"

async function checkEngine(): Promise<ServiceState> {
  try {
    const res = await fetch(`${ENGINE_URL}/health`, { signal: AbortSignal.timeout(5000), cache: "no-store" })
    if (!res.ok) return "outage"
    const data = await res.json()
    return data.status === "running" ? "operational" : "outage"
  } catch {
    return "outage"
  }
}

async function checkDatabase(): Promise<ServiceState> {
  try {
    await db.$queryRaw`SELECT 1`
    return "operational"
  } catch {
    return "outage"
  }
}

const incidents: { date: string; title: string; status: string; resolution: string }[] = []

function StatusBadge({ status }: { status: ServiceState }) {
  if (status === "operational") {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Operational</span>
      </div>
    )
  }
  if (status === "not_monitored") {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <HelpCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Not Monitored</span>
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

export default async function StatusPage() {
  const [engineStatus, dbStatus] = await Promise.all([checkEngine(), checkDatabase()])
  const checkedAt = new Date()

  // Only services with a real check behind them are reported as operational/
  // outage — everything else is honestly labeled "Not Monitored" rather than
  // shown as a false-positive green check.
  const services: { name: string; status: ServiceState }[] = [
    { name: "Trading Engine", status: engineStatus },
    { name: "Web Dashboard & Database", status: dbStatus },
    { name: "Telegram Alerts", status: "not_monitored" },
    { name: "Binance Integration", status: "not_monitored" },
    { name: "Payment Gateway", status: "not_monitored" },
  ]

  const allOperational = services.every((s) => s.status !== "outage")

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // System Status
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive">
            {allOperational ? "All Monitored Systems Operational" : "Experiencing Issues"}
          </h1>
          <p className="mt-4 text-slate-400">
            Last checked: {checkedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        {/* Services */}
        <div className="rounded-md border border-white/10 bg-white/[0.03] overflow-hidden mb-12">
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
                <div key={i} className="p-6 rounded-md border border-white/10 bg-white/[0.03]">
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
