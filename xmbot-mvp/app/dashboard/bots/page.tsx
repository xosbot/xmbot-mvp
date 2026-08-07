"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/dashboard/topbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Square, RotateCcw, Bot, Activity, Wallet, Settings, AlertCircle, CheckCircle } from "lucide-react"
import { BinanceForm } from "@/components/dashboard/binance-form"
import { useToast } from "@/hooks/use-toast"

interface EngineStatus {
  engine: "running" | "stopped" | "error" | "unknown"
  broker: string
  brokerConnected: boolean
  agents: string[]
  openPositions: number
  pendingSignals: number
  uptime: number
}

export default function BotsPage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [controlling, setControlling] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/engine/status")
      if (res.ok) {
        setStatus(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleControl = async (action: "start" | "stop" | "restart") => {
    setControlling(true)
    try {
      const res = await fetch("/api/engine/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${action}`)
      }

      toast({ title: `Engine ${action}ed`, description: `Bot engine ${action} successfully.` })
      setTimeout(fetchStatus, 1000)
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Control failed", variant: "destructive" })
    } finally {
      setControlling(false)
    }
  }

  const getStatusColor = (engine: string) => {
    switch (engine) {
      case "running": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
      case "stopped": return "bg-muted/50 text-muted-foreground border-border"
      case "error": return "bg-red-500/10 text-red-500 border-red-500/30"
      default: return "bg-muted/50 text-muted-foreground border-border"
    }
  }

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "—"
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  if (loading) {
    return (
      <>
        <Topbar title="Bots" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading bot status...
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Bots" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Trading Bot
                </CardTitle>
                <CardDescription>Control your automated gold trading bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-sm border text-sm font-medium ${getStatusColor(status?.engine || "unknown")}`}>
                      {status?.engine === "running" && <CheckCircle className="h-4 w-4 mr-1 inline" />}
                      {status?.engine === "error" && <AlertCircle className="h-4 w-4 mr-1 inline" />}
                      {status?.engine === "running" ? "Running" : status?.engine === "stopped" ? "Stopped" : status?.engine === "error" ? "Error" : "Unknown"}
                    </div>
                    {status?.engine === "running" && (
                      <span className="text-sm text-muted-foreground">Uptime: {formatUptime(status.uptime)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {status?.engine !== "running" ? (
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
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-accent">
                    <p className="text-xs text-muted-foreground mb-1">Broker</p>
                    <p className="text-sm text-foreground font-medium">{status?.broker || "—"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent">
                    <p className="text-xs text-muted-foreground mb-1">Connection</p>
                    <p className={`text-sm font-medium ${status?.brokerConnected ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {status?.brokerConnected ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent">
                    <p className="text-xs text-muted-foreground mb-1">Open Positions</p>
                    <p className="text-sm text-foreground font-medium">{status?.openPositions || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent">
                    <p className="text-xs text-muted-foreground mb-1">Pending Signals</p>
                    <p className="text-sm text-foreground font-medium">{status?.pendingSignals || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Configuration
                </CardTitle>
                <CardDescription>Current bot settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-accent text-center">
                  <p className="text-sm text-muted-foreground">
                    Configure broker, risk limits, and AI settings in{" "}
                    <a href="/dashboard/settings" className="text-gold-400 hover:underline">
                      Settings
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Binance Connection
                </CardTitle>
                <CardDescription>Connect your Binance account</CardDescription>
              </CardHeader>
              <CardContent>
                <BinanceForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
