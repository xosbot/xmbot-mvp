"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEngineStream } from "@/hooks/use-engine-stream"
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity, DollarSign, BarChart3 } from "lucide-react"

export function LivePnL() {
  const { health, account, metrics, connected } = useEngineStream()

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Trading
          </span>
          <Badge
            className={`text-xs ${
              connected
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }`}
          >
            {connected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Balance</p>
            <p className="text-lg font-bold text-white">
              ${(account?.balance ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Equity</p>
            <p className="text-lg font-bold text-white">
              ${(account?.equity ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Total P&L</p>
            <p className={`text-lg font-bold flex items-center gap-1 ${(metrics?.total_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {(metrics?.total_pnl ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              ${(metrics?.total_pnl ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Win Rate</p>
            <p className="text-lg font-bold text-white">
              {(metrics?.win_rate ?? 0).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <span>Broker: {health?.broker ?? "—"}</span>
          <span>Trades: {metrics?.total_trades ?? 0}</span>
          <span>Open: {metrics?.open_trades ?? 0}</span>
        </div>
      </CardContent>
    </Card>
  )
}
