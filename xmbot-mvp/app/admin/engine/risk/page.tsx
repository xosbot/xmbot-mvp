"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, ShieldAlert } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RiskStats {
  daily_pnl: number
  daily_trades: number
  peak_balance: number
}

export default function RiskLimitsPage() {
  const { toast } = useToast()
  const [maxDailyLoss, setMaxDailyLoss] = useState("10000")
  const [maxPositions, setMaxPositions] = useState("20")
  const [stats, setStats] = useState<RiskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/engine/api/trading/risk")
      if (res.ok) setStats(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/engine/api/trading/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_daily_loss: parseFloat(maxDailyLoss),
          max_positions: parseInt(maxPositions, 10),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.error || "Failed to save")
      }
      toast({ title: "Risk limits updated" })
      load()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Save failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Risk Limits</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <Card className="bg-white/[0.03] border-white/10 rounded-md max-w-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Global Risk Limits
            </CardTitle>
            <CardDescription>Applies across every position the engine holds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Max Daily Loss ($)</Label>
              <Input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Concurrent Positions</Label>
              <Input
                type="number"
                value={maxPositions}
                onChange={(e) => setMaxPositions(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Limits
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/10 rounded-md max-w-xl">
          <CardHeader>
            <CardTitle className="text-white">Today&apos;s Risk Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Daily P&amp;L</p>
                  <p className={`text-sm font-medium ${(stats?.daily_pnl ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ${stats?.daily_pnl?.toFixed(2) ?? "0.00"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Daily Trades</p>
                  <p className="text-sm text-white font-medium">{stats?.daily_trades ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-500 mb-1">Peak Balance</p>
                  <p className="text-sm text-white font-medium">${stats?.peak_balance?.toFixed(2) ?? "0.00"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
