"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, Wifi, Activity } from "lucide-react"

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

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, accountRes] = await Promise.allSettled([
          fetch("/api/engine/status"),
          fetch("/api/engine/account"),
        ])

        if (statusRes.status === "fulfilled" && statusRes.value.ok) {
          setStatus(await statusRes.value.json())
        }

        if (accountRes.status === "fulfilled" && accountRes.value.ok) {
          setAccount(await accountRes.value.json())
        }

        setLastUpdate(new Date())
      } catch (error) {
        console.error("Engine status fetch error:", error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Engine Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">Connecting to engine...</p>
        </CardContent>
      </Card>
    )
  }

  const isRunning = status.engine === "running"
  const statusVariant = isRunning ? "default" : status.engine === "error" ? "destructive" : "secondary"

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">Engine Status</CardTitle>
        <Activity className={`h-4 w-4 ${isRunning ? "text-emerald-500" : "text-slate-500"}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Engine</span>
          <Badge variant={statusVariant} className="text-xs">
            {status.engine}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Broker</span>
          <div className="flex items-center gap-1.5">
            <Wifi className={`h-3 w-3 ${status.brokerConnected ? "text-emerald-500" : "text-red-400"}`} />
            <span className="text-xs text-white">{status.broker}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Agents</span>
          <div className="flex gap-1">
            {status.agents.map((a) => (
              <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Pending Signals</span>
          <span className="text-xs text-white font-medium">{status.pendingSignals}</span>
        </div>

        {account && (
          <>
            <div className="border-t border-slate-800 pt-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Balance</span>
              <span className="text-xs text-white font-medium">${account.balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Equity</span>
              <span className="text-xs text-white font-medium">${account.equity.toFixed(2)}</span>
            </div>
          </>
        )}

        {lastUpdate && (
          <p className="text-[10px] text-slate-600 pt-1">
            Updated {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
