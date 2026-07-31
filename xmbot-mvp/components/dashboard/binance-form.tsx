"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Unlink, CheckCircle, AlertCircle, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BinanceStatus {
  connected: boolean
  maskedKey?: string
  balance?: number
  connectedAt?: string
  error?: string
}

export function BinanceForm() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [status, setStatus] = useState<BinanceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/settings/binance")
      if (res.ok) {
        setStatus(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast({ title: "Error", description: "Please enter both API Key and Secret", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/binance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Validation Failed", description: data.error || "Invalid API keys", variant: "destructive" })
        return
      }

      setStatus({
        connected: true,
        maskedKey: data.maskedKey,
        balance: data.balance,
        connectedAt: new Date().toISOString(),
      })
      setApiKey("")
      setApiSecret("")
      toast({ title: "Binance Connected", description: `Account balance: ${data.balance?.toFixed(2) ?? 0} USDT` })
    } catch {
      toast({ title: "Error", description: "Failed to save API keys", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch("/api/settings/binance", { method: "DELETE" })
      if (res.ok) {
        setStatus({ connected: false })
        toast({ title: "Binance Disconnected", description: "Your API keys have been removed." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    )
  }

  if (status?.connected) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-300">Connected to Binance</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">API Key</p>
              <p className="text-white font-mono">{status.maskedKey}</p>
            </div>
            <div>
              <p className="text-slate-500">Balance</p>
              <p className="text-white">{status.balance?.toFixed(2) ?? "—"} USDT</p>
            </div>
            <div>
              <p className="text-slate-500">Connected</p>
              <p className="text-white">
                {status.connectedAt
                  ? new Date(status.connectedAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
          {disconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg">
      {status?.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {status.error}
        </div>
      )}

      <div className="rounded-lg border border-slate-700 p-4 space-y-3">
        <p className="text-sm text-slate-300">How to get your Binance API keys:</p>
        <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
          <li>Log in to <span className="text-white font-medium">binance.com</span></li>
          <li>Go to <span className="text-white font-medium">API Management</span></li>
          <li>Click <span className="text-white font-medium">Create API</span></li>
          <li>Enable <span className="text-white font-medium">Spot & Margin Trading</span> permission</li>
          <li>Copy your <span className="text-white font-medium">API Key</span> and <span className="text-white font-medium">Secret Key</span></li>
          <li>Paste them below</li>
        </ol>
        <p className="text-xs text-amber-400">
          Note: The bot will only execute trades. Withdrawal permissions are NOT required.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="binance-api-key">API Key</Label>
          <Input
            id="binance-api-key"
            placeholder="Enter your Binance API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="binance-api-secret">API Secret</Label>
          <Input
            id="binance-api-secret"
            type="password"
            placeholder="Enter your Binance API Secret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4 mr-2" />
        )}
        {saving ? "Validating & Saving..." : "Validate & Connect"}
      </Button>
    </div>
  )
}
