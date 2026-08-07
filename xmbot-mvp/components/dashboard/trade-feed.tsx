"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, TrendingUp } from "lucide-react"
import { useEngineStream } from "@/hooks/use-engine-stream"

interface Position {
  symbol: string
  type: string
  volume: number
  openPrice: number
  currentPrice: number
  pnl: number
}

export function TradeFeed() {
  const { positions } = useEngineStream()

  if (!positions || positions.length === 0) {
    return (
      <Card className="bg-card border-border rounded-md">
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No open positions. Signals will appear here when the engine is running.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border rounded-md">
      <CardHeader>
        <CardTitle className="text-foreground text-sm">Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((pos: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-accent border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gold-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{pos.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {pos.type} · {pos.volume} lots
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${pos.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {pos.pnl >= 0 ? "+" : ""}{pos.pnl.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Entry: {pos.openPrice.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
