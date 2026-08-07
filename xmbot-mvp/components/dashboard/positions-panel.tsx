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

export function PositionsPanel() {
  const { positions } = useEngineStream()

  if (!positions || positions.length === 0) {
    return (
      <Card className="bg-card border-border rounded-md">
        <CardHeader>
          <CardTitle className="text-foreground">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-accent border border-border flex items-center justify-center mx-auto mb-3">
              <Minus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No open positions</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Positions will appear here when trades are active</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border rounded-md">
      <CardHeader>
        <CardTitle className="text-foreground">Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">Symbol</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">Dir</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">Vol</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">Entry</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">Current</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">SL</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">TP</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p: any, i: number) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 text-foreground font-medium text-sm flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-gold-600" />
                    {p.symbol}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{p.type}</td>
                  <td className="py-3 text-right text-muted-foreground text-sm">{p.volume}</td>
                  <td className="py-3 text-right text-muted-foreground text-sm">{p.openPrice.toFixed(2)}</td>
                  <td className="py-3 text-right text-foreground text-sm">{p.currentPrice.toFixed(2)}</td>
                  <td className="py-3 text-right text-muted-foreground text-sm">—</td>
                  <td className="py-3 text-right text-muted-foreground text-sm">—</td>
                  <td className={`py-3 text-right font-medium text-sm ${p.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
