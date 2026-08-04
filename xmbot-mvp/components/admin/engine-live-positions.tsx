"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Position {
  id: string
  symbol: string
  direction: string
  volume: number
  entry_price: number
  current_price: number
  stop_loss: number
  take_profit: number | null
  unrealized_pnl: number
  open_time: string
}

interface Account {
  balance: number
  equity: number
  margin: number
  margin_free: number
  currency: string
}

export function EngineLivePositions() {
  const [positions, setPositions] = useState<Position[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [posRes, accRes] = await Promise.all([
        fetch("/api/admin/engine/api/trading/positions"),
        fetch("/api/admin/engine/api/trading/account"),
      ])
      if (posRes.ok) setPositions(await posRes.json())
      if (accRes.ok) setAccount(await accRes.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <div className="space-y-6">
      <Card className="bg-white/[0.03] border-white/10 rounded-md">
        <CardHeader>
          <CardTitle className="text-white">Live Account</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : !account ? (
            <p className="text-sm text-slate-500">Account data unavailable — is the engine running?</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Balance</p>
                <p className="text-sm text-white font-medium">
                  {account.balance.toFixed(2)} {account.currency}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Equity</p>
                <p className="text-sm text-white font-medium">
                  {account.equity.toFixed(2)} {account.currency}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Margin</p>
                <p className="text-sm text-white font-medium">
                  {account.margin.toFixed(2)} {account.currency}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Free Margin</p>
                <p className="text-sm text-white font-medium">
                  {account.margin_free.toFixed(2)} {account.currency}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10 rounded-md">
        <CardHeader>
          <CardTitle className="text-white">Open Positions ({positions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No open positions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="py-2 pr-4">Symbol</th>
                    <th className="py-2 pr-4">Side</th>
                    <th className="py-2 pr-4">Volume</th>
                    <th className="py-2 pr-4">Entry</th>
                    <th className="py-2 pr-4">Current</th>
                    <th className="py-2 pr-4">SL</th>
                    <th className="py-2 pr-4">TP</th>
                    <th className="py-2 pr-4">Unrealized P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4 text-white">{p.symbol}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.direction}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.volume}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.entry_price.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.current_price.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.stop_loss.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-slate-300">{p.take_profit?.toFixed(2) ?? "—"}</td>
                      <td className={`py-2 pr-4 font-medium ${p.unrealized_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {p.unrealized_pnl >= 0 ? "+" : ""}
                        {p.unrealized_pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
