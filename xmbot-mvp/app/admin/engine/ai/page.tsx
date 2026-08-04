"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIConfig {
  provider: string
  model: string
  enabled: boolean
  regime_detection: boolean
  trade_validation: boolean
  daily_reports: boolean
}

interface AIStatus {
  available_providers: string[]
  preferred_provider: string | null
}

export default function SuperAdminAIConfigPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<AIConfig>({
    provider: "gemini",
    model: "gemini-2.5-flash",
    enabled: true,
    regime_detection: true,
    trade_validation: false,
    daily_reports: false,
  })
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [configRes, statusRes] = await Promise.all([
        fetch("/api/admin/engine/api/ai/config"),
        fetch("/api/admin/engine/api/ai/status"),
      ])
      if (configRes.ok) setConfig(await configRes.json())
      if (statusRes.ok) setStatus(await statusRes.json())
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
      const res = await fetch("/api/admin/engine/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.error || "Failed to save")
      }
      toast({ title: "AI settings saved", description: "Provider preference applied to the live registry." })
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
        <h1 className="text-lg font-semibold text-white">AI Config</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="bg-white/[0.03] border-white/10 rounded-md max-w-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              {status?.available_providers?.length
                ? `Registered providers: ${status.available_providers.join(", ")}`
                : "No AI providers registered on the engine (missing API keys)."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading AI config...
              </div>
            ) : (
              <>
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
                        <option value="gemini">Google Gemini</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                      <p className="text-xs text-slate-500">Now enforced on the live registry, not just cosmetic.</p>
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
                  <h4 className="text-sm font-medium text-slate-300">Features</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                    <Label>Market Regime Detection</Label>
                    <Switch
                      checked={config.regime_detection}
                      onCheckedChange={(regime_detection) => setConfig({ ...config, regime_detection })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                    <Label>Trade Validation</Label>
                    <Switch
                      checked={config.trade_validation}
                      onCheckedChange={(trade_validation) => setConfig({ ...config, trade_validation })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700">
                    <Label>Daily Reports</Label>
                    <Switch
                      checked={config.daily_reports}
                      onCheckedChange={(daily_reports) => setConfig({ ...config, daily_reports })}
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save AI Settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
