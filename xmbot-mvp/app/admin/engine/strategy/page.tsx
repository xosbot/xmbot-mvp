"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, SlidersHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AgentConfigModel {
  agent_type: string
  enabled: boolean
  market: string
  timeframe: string
  confidence_threshold: number
  params: Record<string, number>
}

const FIELDS: { key: string; label: string; step: string }[] = [
  { key: "rsi_period", label: "RSI Period", step: "1" },
  { key: "adx_period", label: "ADX Period", step: "1" },
  { key: "adx_threshold", label: "ADX Threshold", step: "0.1" },
  { key: "atr_period", label: "ATR Period", step: "1" },
  { key: "atr_multiplier", label: "ATR Multiplier (Supertrend)", step: "0.1" },
  { key: "atr_sl_multiplier", label: "ATR Stop-Loss Multiplier", step: "0.1" },
  { key: "tp_ratio", label: "Take-Profit Ratio", step: "0.1" },
  { key: "min_sl_distance", label: "Min Stop-Loss Distance ($)", step: "0.1" },
  { key: "risk_per_trade_pct", label: "Risk Per Trade (%)", step: "0.1" },
]

const USER_ID = "default"

export default function StrategyTuningPage() {
  const { toast } = useToast()
  const [agent, setAgent] = useState<AgentConfigModel | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/engine/api/config/${USER_ID}`)
      if (res.ok) {
        const data = await res.json()
        const technical = (data.agents || []).find((a: AgentConfigModel) => a.agent_type === "technical")
        if (technical) {
          setAgent(technical)
          const initial: Record<string, string> = {}
          FIELDS.forEach((f) => {
            initial[f.key] = String(technical.params?.[f.key] ?? "")
          })
          setValues(initial)
        }
      }
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
    if (!agent) return
    setSaving(true)
    try {
      const params: Record<string, number> = {}
      for (const f of FIELDS) {
        const n = parseFloat(values[f.key])
        if (Number.isNaN(n)) throw new Error(`Invalid value for ${f.label}`)
        params[f.key] = n
      }

      const res = await fetch(`/api/admin/engine/api/config/${USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agents: [
            {
              agent_type: agent.agent_type,
              enabled: agent.enabled,
              market: agent.market,
              timeframe: agent.timeframe,
              confidence_threshold: agent.confidence_threshold,
              params,
            },
          ],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.error || "Failed to save strategy params")
      }

      toast({ title: "Strategy params updated", description: "Applied live to the running agent." })
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
        <h1 className="text-lg font-semibold text-white">Strategy Tuning</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="bg-white/[0.03] border-white/10 rounded-md max-w-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Technical Analysis Agent
            </CardTitle>
            <CardDescription>
              Live parameters for the RSI + Supertrend + ADX strategy on XAUUSD M5. Changes apply immediately to the running agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading strategy config...
              </div>
            ) : !agent ? (
              <p className="text-sm text-slate-500">No technical agent is currently registered on the engine.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label>{f.label}</Label>
                      <Input
                        type="number"
                        step={f.step}
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save &amp; Apply
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
