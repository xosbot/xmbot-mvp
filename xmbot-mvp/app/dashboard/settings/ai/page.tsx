"use client"

import { useState, useEffect } from "react"
import { Topbar } from "@/components/dashboard/topbar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Brain, TrendingUp, BarChart, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIConfig {
  provider: string
  model: string
  enabled: boolean
  regime_detection: boolean
  trade_validation: boolean
  daily_reports: boolean
}

export default function AISettingsPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<AIConfig>({
    provider: "gemini",
    model: "gemini-2.5-flash",
    enabled: true,
    regime_detection: true,
    trade_validation: false,
    daily_reports: false,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/engine?path=/api/ai/config")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setConfig(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/engine?path=/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "AI settings saved" })
    } catch {
      toast({ title: "Error", description: "Failed to save AI settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="AI Settings" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <p className="text-slate-500">Loading...</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="AI Settings" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>Configure AI provider and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable AI</Label>
                <p className="text-xs text-slate-500">Master switch for all AI features</p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
              />
            </div>

            <Separator className="bg-slate-800" />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Provider</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <select
                    value={config.provider}
                    onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    {config.provider === "gemini" ? (
                      <>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Cheap)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Better, Costly)</option>
                      </>
                    ) : (
                      <>
                        <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">AI Features</h4>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div>
                    <Label>Market Regime Detection</Label>
                    <p className="text-xs text-slate-500">AI classifies market as trending/ranging (hourly)</p>
                  </div>
                </div>
                <Switch
                  checked={config.regime_detection}
                  onCheckedChange={(regime_detection) => setConfig({ ...config, regime_detection })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label>Trade Validation</Label>
                    <p className="text-xs text-slate-500">AI validates signals before execution</p>
                  </div>
                </div>
                <Switch
                  checked={config.trade_validation}
                  onCheckedChange={(trade_validation) => setConfig({ ...config, trade_validation })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-purple-500" />
                  <div>
                    <Label>Daily Reports</Label>
                    <p className="text-xs text-slate-500">AI generates daily market analysis</p>
                  </div>
                </div>
                <Switch
                  checked={config.daily_reports}
                  onCheckedChange={(daily_reports) => setConfig({ ...config, daily_reports })}
                />
              </div>
            </div>

            <Separator className="bg-slate-800" />

            <div className="rounded-lg border border-slate-700 p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Cost Estimate</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• Regime Detection: ~1K tokens/hour = ~$0.01/day</p>
                <p>• Trade Validation: ~500 tokens/trade (disabled)</p>
                <p>• Daily Reports: ~2K tokens/day (disabled)</p>
                <p className="text-emerald-500 font-medium">Estimated monthly cost: ~$0.30</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save AI Settings
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
