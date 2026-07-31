"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"

interface Position {
  id: string
  symbol: string
  type: "BUY" | "SELL"
  volume: number
  openPrice: number
  currentPrice: number
  profit: number
  stopLoss: number
  takeProfit: number
  openTime: string
}

function PositionCard({ position }: { position: Position }) {
  const isBuy = position.type === "BUY"
  const pnlPositive = position.profit >= 0

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{position.symbol}</span>
          <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
            {isBuy ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {position.type}
          </Badge>
        </div>
        <span className={`text-sm font-medium ${pnlPositive ? "text-emerald-500" : "text-red-400"}`}>
          {pnlPositive ? "+" : ""}{position.profit.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Entry</span>
          <p className="text-white">{position.openPrice.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-slate-500">Current</span>
          <p className="text-white">{position.currentPrice.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-slate-500">Volume</span>
          <p className="text-white">{position.volume}</p>
        </div>
        {position.stopLoss > 0 && (
          <div>
            <span className="text-slate-500">SL</span>
            <p className="text-red-400">{position.stopLoss.toFixed(2)}</p>
          </div>
        )}
        {position.takeProfit > 0 && (
          <div>
            <span className="text-slate-500">TP</span>
            <p className="text-emerald-500">{position.takeProfit.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function PositionsPanel() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/engine/positions")
      if (res.ok) {
        const data = await res.json()
        setPositions(data.positions || [])
        setError(null)
      } else {
        setError("Failed to load positions")
      }
    } catch (error) {
      console.error("Positions fetch error:", error)
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPositions()
    const interval = setInterval(fetchPositions, 15000)
    return () => clearInterval(interval)
  }, [fetchPositions])

  if (loading && positions.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading positions...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && positions.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Open Positions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPositions}
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Open Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No open positions</p>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="md:hidden space-y-3">
              {positions.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Symbol</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Dir</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-3">Vol</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-3">Entry</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-3">Current</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-3">SL</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-3">TP</th>
                    <th className="text-right text-xs font-medium text-slate-400 pb-3">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/50">
                      <td className="py-3 text-white font-medium text-sm">{p.symbol}</td>
                      <td className="py-3">
                        <Badge variant={p.type === "BUY" ? "default" : "destructive"} className="text-xs">
                          {p.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-slate-300 text-sm">{p.volume}</td>
                      <td className="py-3 text-right text-slate-300 text-sm">{p.openPrice.toFixed(2)}</td>
                      <td className="py-3 text-right text-slate-300 text-sm">{p.currentPrice.toFixed(2)}</td>
                      <td className="py-3 text-right text-red-400 text-sm">
                        {p.stopLoss > 0 ? p.stopLoss.toFixed(2) : "—"}
                      </td>
                      <td className="py-3 text-right text-emerald-500 text-sm">
                        {p.takeProfit > 0 ? p.takeProfit.toFixed(2) : "—"}
                      </td>
                      <td className={`py-3 text-right text-sm font-medium ${p.profit >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {p.profit >= 0 ? "+" : ""}{p.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
