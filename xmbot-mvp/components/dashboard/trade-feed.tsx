"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEngineStream } from "@/hooks/use-engine-stream"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function TradeFeed() {
  const { positions, connected } = useEngineStream()

  if (!connected) {
    return (
      <Card className="bg-white/[0.03] border-white/10 rounded-md">
        <CardHeader>
          <CardTitle className="text-white text-sm">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 text-sm">
            Waiting for engine connection...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (positions.length === 0) {
    return (
      <Card className="bg-white/[0.03] border-white/10 rounded-md">
        <CardHeader>
          <CardTitle className="text-white text-sm">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-3">
              <Minus className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">No open positions</p>
            <p className="text-xs text-slate-600 mt-1">Positions will appear here when trades are active</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/[0.03] border-white/10 rounded-md">
      <CardHeader>
        <CardTitle className="text-white text-sm">Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="flex items-center justify-between p-3 rounded-md bg-white/[0.05] border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  pos.direction === "BUY" ? "bg-emerald-500/20" : "bg-red-500/20"
                }`}>
                  {pos.direction === "BUY" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{pos.symbol}</p>
                  <p className="text-xs text-slate-400">
                    {pos.direction} · {pos.volume} lots
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${
                  pos.unrealized_pnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  Entry: ${pos.entry_price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
