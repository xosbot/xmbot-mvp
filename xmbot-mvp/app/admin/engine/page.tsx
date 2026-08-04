"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Play, Square, RotateCcw, Pause, PlayCircle, Cpu, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TradingStatus {
  engine: "running" | "stopped"
  paused: boolean
  broker: string
  broker_connected: boolean
  agents: string[]
  pending_signals: number
  open_positions: number
  account_balance: number
  account_equity: number
}

const BROKERS = ["paper", "binance", "mt5"]
const USER_ID = "default"

export default function SuperAdminEnginePage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<TradingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [controlling, setControlling] = useState(false)
  const [switchingBroker, setSwitchingBroker] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/engine/api/trading/status")
      if (res.ok) setStatus(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleControl = async (action: "start" | "stop" | "restart" | "pause" | "resume") => {
    setControlling(true)
    try {
      const res = await fetch("/api/admin/engine/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.error || `Failed to ${action}`)
      }
      toast({ title: `Engine ${action}`, description: "Action succeeded." })
      setTimeout(fetchStatus, 1000)
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Control failed", variant: "destructive" })
    } finally {
      setControlling(false)
    }
  }

  const handleBrokerSwitch = async (broker: string) => {
    if (!status || broker === status.broker) return
    setSwitchingBroker(true)
    try {
      const res = await fetch(`/api/admin/engine/api/config/${USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broker: { broker } }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.error || "Failed to switch broker")
      }
      toast({ title: "Broker switched", description: `Now using ${broker}.` })
      fetchStatus()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Broker switch failed", variant: "destructive" })
    } finally {
      setSwitchingBroker(false)
    }
  }

  const running = status?.engine === "running"

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Engine — Status &amp; Control</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <Card className="bg-white/[0.03] border-white/10 rounded-md">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Engine
            </CardTitle>
            <CardDescription>The single trading engine shared by every user on this deployment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading engine status...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div
                    className={`px-3 py-1 rounded-sm border text-sm font-medium ${
                      running
                        ? status?.paused
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                    }`}
                  >
                    {running && !status?.paused && <CheckCircle className="h-4 w-4 mr-1 inline" />}
                    {running ? (status?.paused ? "Paused" : "Running") : "Stopped"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!running ? (
                      <Button onClick={() => handleControl("start")} disabled={controlling} className="bg-emerald-600 hover:bg-emerald-700">
                        {controlling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        Start
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => handleControl("stop")} disabled={controlling} variant="destructive">
                          {controlling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                          Stop
                        </Button>
                        <Button onClick={() => handleControl("restart")} disabled={controlling} variant="outline">
                          {controlling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                          Restart
                        </Button>
                        {status?.paused ? (
                          <Button onClick={() => handleControl("resume")} disabled={controlling} variant="outline">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Resume
                          </Button>
                        ) : (
                          <Button onClick={() => handleControl("pause")} disabled={controlling} variant="outline">
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500 mb-1">Broker</p>
                    <p className="text-sm text-white font-medium capitalize">{status?.broker || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500 mb-1">Connection</p>
                    <p className={`text-sm font-medium ${status?.broker_connected ? "text-emerald-500" : "text-slate-400"}`}>
                      {status?.broker_connected ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500 mb-1">Open Positions</p>
                    <p className="text-sm text-white font-medium">{status?.open_positions ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500 mb-1">Pending Signals</p>
                    <p className="text-sm text-white font-medium">{status?.pending_signals ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500 mb-1">Balance</p>
                    <p className="text-sm text-white font-medium">${status?.account_balance?.toFixed(2) ?? "0.00"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-500 mb-1">Equity</p>
                    <p className="text-sm text-white font-medium">${status?.account_equity?.toFixed(2) ?? "0.00"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50 col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Agents</p>
                    <p className="text-sm text-white font-medium">{status?.agents?.join(", ") || "—"}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/10 rounded-md">
          <CardHeader>
            <CardTitle className="text-white">Broker</CardTitle>
            <CardDescription>
              Switch which broker the engine trades through. Only possible while the engine is stopped.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {BROKERS.map((b) => (
                <Button
                  key={b}
                  variant={status?.broker === b ? "default" : "outline"}
                  disabled={running || switchingBroker || status?.broker === b}
                  onClick={() => handleBrokerSwitch(b)}
                  className="capitalize"
                >
                  {switchingBroker ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {b}
                </Button>
              ))}
            </div>
            {running && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Stop the engine before switching brokers.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
