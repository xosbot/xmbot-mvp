"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEngineStream } from "@/hooks/use-engine-stream"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function TradeFeed() {
  const { positions, connected } = useEngineStream()

  if (!connected) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
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
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 text-sm">
            No open positions
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white text-sm">Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
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
