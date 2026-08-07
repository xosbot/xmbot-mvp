"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cpu, Wifi, Activity, RefreshCw, Play, Square, RotateCw } from "lucide-react"

interface EngineStatus {
  engine: "running" | "stopped" | "error" | "unknown"
  broker: string
  brokerConnected: boolean
  agents: string[]
  openPositions: number
  pendingSignals: number
  uptime: number
}

interface AccountInfo {
  balance: number
  equity: number
  margin: number
  freeMargin: number
}

export function EngineStatus() {
  const [status, setStatus] = useState<EngineStatus | null>(null)
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [controlLoading, setControlLoading] = useState<"start" | "stop" | "restart" | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [statusRes, accountRes] = await Promise.allSettled([
        fetch("/api/engine/status"),
        fetch("/api/engine/account"),
      ])

      if (statusRes.status === "fulfilled" && statusRes.value.ok) {
        setStatus(await statusRes.value.json())
      } else {
        setError("Could not connect to engine")
      }

      if (accountRes.status === "fulfilled" && accountRes.value.ok) {
        setAccount(await accountRes.value.json())
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Engine status fetch error:", error)
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleControl = async (action: "start" | "stop" | "restart") => {
    setControlLoading(action)
    try {
      const res = await fetch("/api/engine/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        await fetchData()
      } else {
        const data = await res.json()
        setError(data.error || `Failed to ${action} engine`)
      }
    } catch (err) {
      setError(`Network error during ${action}`)
    } finally {
      setControlLoading(null)
    }
  }

  if (loading && !status) {
    return (
      <Card className="bg-card border-border rounded-md">
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Engine Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Connecting to engine...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !status) {
    return (
      <Card className="bg-card border-border rounded-md">
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Engine Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-red-500">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isRunning = status?.engine === "running"
  const statusVariant = isRunning ? "default" : status?.engine === "error" ? "destructive" : "secondary"

  return (
    <Card className="bg-card border-border rounded-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Engine Status</CardTitle>
        <Activity className={`h-4 w-4 ${isRunning ? "text-emerald-600" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Engine</span>
          <Badge variant={statusVariant} className="text-xs">
            {status?.engine}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Broker</span>
          <div className="flex items-center gap-1.5">
            <Wifi className={`h-3 w-3 ${status?.brokerConnected ? "text-emerald-600" : "text-red-500"}`} />
            <span className="text-xs text-foreground">{status?.broker}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Agents</span>
          <div className="flex gap-1">
            {status?.agents.map((a) => (
              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Pending Signals</span>
          <span className="text-xs text-foreground font-medium">{status?.pendingSignals}</span>
        </div>

        {account && (
          <>
            <div className="border-t border-border pt-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-xs text-foreground font-medium">${account.balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Equity</span>
              <span className="text-xs text-foreground font-medium">${account.equity.toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="border-t border-border pt-3">
          <div className="flex gap-2">
            {isRunning ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleControl("stop")}
                  disabled={controlLoading !== null}
                  className="flex-1 h-7 text-xs border-red-200 text-red-600 hover:text-red-500"
                >
                  {controlLoading === "stop" ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Square className="h-3 w-3 mr-1" />
                  )}
                  Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleControl("restart")}
                  disabled={controlLoading !== null}
                  className="flex-1 h-7 text-xs border-border text-muted-foreground"
                >
                  {controlLoading === "restart" ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCw className="h-3 w-3 mr-1" />
                  )}
                  Restart
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleControl("start")}
                disabled={controlLoading !== null}
                className="w-full h-7 text-xs border-emerald-200 text-emerald-600 hover:text-emerald-500"
              >
                {controlLoading === "start" ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Start Engine
              </Button>
            )}
          </div>
        </div>

        {lastUpdate && (
          <p className="text-[10px] text-muted-foreground pt-1">
            Updated {lastUpdate.toLocaleTimeString()}
          </p>
        )}

        {error && (
          <p className="text-[10px] text-red-500">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
