"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Topbar } from "@/components/dashboard/topbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Bot, Shield, Brain, MessageSquare, LinkIcon, Unlink, User, Wallet, CreditCard, Monitor } from "lucide-react"
import { BinanceForm } from "@/components/dashboard/binance-form"
import { SubscriptionCard } from "@/components/dashboard/subscription-card"
import { SessionsCard } from "@/components/dashboard/sessions-card"
import { useToast } from "@/hooks/use-toast"
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const [name, setName] = useState(session?.user?.name ?? "")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [broker, setBroker] = useState("paper")
  const [symbol, setSymbol] = useState("XAUUSD")
  const [maxDailyLoss, setMaxDailyLoss] = useState("500")
  const [maxDrawdown, setMaxDrawdown] = useState("20")
  const [maxPositionSize, setMaxPositionSize] = useState("0.5")
  const [defaultStopLoss, setDefaultStopLoss] = useState("30")
  const [enableAI, setEnableAI] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)

  const [telegramChatId, setTelegramChatId] = useState("")
  const [linkedTelegram, setLinkedTelegram] = useState<string | null>(null)
  const [savingTelegram, setSavingTelegram] = useState(false)

  const initialConfigRef = useRef<{
    broker: string
    symbol: string
    maxDailyLoss: string
    maxDrawdown: string
    maxPositionSize: string
    defaultStopLoss: string
    enableAI: boolean
  } | null>(null)

  const initialProfileRef = useRef<{
    name: string
    phone: string
  } | null>(null)

  useEffect(() => {
    if (session?.user?.name && !initialProfileRef.current) {
      initialProfileRef.current = { name: session.user.name, phone: "" }
    }
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/engine?path=/api/config/" + session.user.id)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        const newBroker = data.broker?.broker || "paper"
        const newSymbol = data.broker?.symbol || "XAUUSD"
        const newMaxDailyLoss = String(data.risk?.max_daily_loss ?? 500)
        const newMaxDrawdown = String(data.risk?.max_drawdown_percent ?? 20)
        const newMaxPositionSize = String(data.risk?.max_position_size ?? 0.5)
        const newDefaultStopLoss = String(data.risk?.default_stop_loss ?? 30)
        const newEnableAI = data.enable_ai_analysis ?? true

        setBroker(newBroker)
        setSymbol(newSymbol)
        setMaxDailyLoss(newMaxDailyLoss)
        setMaxDrawdown(newMaxDrawdown)
        setMaxPositionSize(newMaxPositionSize)
        setDefaultStopLoss(newDefaultStopLoss)
        setEnableAI(newEnableAI)
        setLinkedTelegram(data.telegram_chat_id || null)

        initialConfigRef.current = {
          broker: newBroker,
          symbol: newSymbol,
          maxDailyLoss: newMaxDailyLoss,
          maxDrawdown: newMaxDrawdown,
          maxPositionSize: newMaxPositionSize,
          defaultStopLoss: newDefaultStopLoss,
          enableAI: newEnableAI,
        }
      })
      .finally(() => setLoadingConfig(false))
  }, [session])

  const isProfileDirty = initialProfileRef.current
    ? name !== initialProfileRef.current.name || phone !== initialProfileRef.current.phone
    : false

  const isConfigDirty = initialConfigRef.current
    ? broker !== initialConfigRef.current.broker ||
      symbol !== initialConfigRef.current.symbol ||
      maxDailyLoss !== initialConfigRef.current.maxDailyLoss ||
      maxDrawdown !== initialConfigRef.current.maxDrawdown ||
      maxPositionSize !== initialConfigRef.current.maxPositionSize ||
      defaultStopLoss !== initialConfigRef.current.defaultStopLoss ||
      enableAI !== initialConfigRef.current.enableAI
    : false

  const isPasswordDirty = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0

  const isDirty = isProfileDirty || isConfigDirty || isPasswordDirty

  useUnsavedChangesWarning({ isDirty })

  const handleSaveTelegram = async () => {
    if (!telegramChatId.trim()) {
      toast({ title: "Error", description: "Please enter a Chat ID", variant: "destructive" })
      return
    }
    setSavingTelegram(true)
    try {
      const res = await fetch("/api/settings/telegram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: telegramChatId.trim() }),
      })
      if (!res.ok) throw new Error("Failed to save")
      setLinkedTelegram(telegramChatId.trim())
      setTelegramChatId("")
      toast({ title: "Telegram linked", description: "Your Telegram account is now connected." })
    } catch {
      toast({ title: "Error", description: "Failed to link Telegram", variant: "destructive" })
    } finally {
      setSavingTelegram(false)
    }
  }

  const handleUnlinkTelegram = async () => {
    try {
      const res = await fetch("/api/settings/telegram", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to unlink")
      setLinkedTelegram(null)
      toast({ title: "Telegram unlinked", description: "Your Telegram account has been disconnected." })
    } catch {
      toast({ title: "Error", description: "Failed to unlink Telegram", variant: "destructive" })
    }
  }

  const handleSaveConfig = async () => {
    if (!session?.user?.id) return
    setSavingConfig(true)
    try {
      const res = await fetch("/api/engine?path=/api/config/" + session.user.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: { broker, symbol },
          risk: {
            max_daily_loss: parseFloat(maxDailyLoss),
            max_drawdown_percent: parseFloat(maxDrawdown),
            max_position_size: parseFloat(maxPositionSize),
            default_stop_loss: parseFloat(defaultStopLoss),
          },
          enable_ai_analysis: enableAI,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      initialConfigRef.current = {
        broker,
        symbol,
        maxDailyLoss,
        maxDrawdown,
        maxPositionSize,
        defaultStopLoss,
        enableAI,
      }
      toast({ title: "Bot config saved", description: "Engine will use new settings on next cycle." })
    } catch {
      toast({ title: "Error", description: "Failed to save bot configuration", variant: "destructive" })
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to update profile", variant: "destructive" })
        return
      }

      initialProfileRef.current = { name, phone }
      await update()
      toast({ title: "Profile updated", description: "Your profile has been saved." })
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match.", variant: "destructive" })
      return
    }

    setSavingPassword(true)

    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to change password", variant: "destructive" })
        return
      }

      toast({ title: "Password updated", description: "Your password has been changed." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <Topbar title="Settings" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="bot" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Bot className="h-4 w-4 mr-2" />
              Bot Config
            </TabsTrigger>
            <TabsTrigger value="telegram" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4 mr-2" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="binance" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Wallet className="h-4 w-4 mr-2" />
              Binance
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Monitor className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader>
                <CardTitle className="text-white">Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={session?.user?.email ?? ""} disabled className="bg-slate-800/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bot">
            <Card className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Bot Configuration
                </CardTitle>
                <CardDescription>Configure broker, risk limits, and AI settings</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingConfig ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading config...
                  </div>
                ) : (
                  <div className="space-y-6 max-w-lg">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Bot className="h-4 w-4" /> Broker
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="broker">Broker</Label>
                          <Select id="broker" value={broker} onValueChange={setBroker}>
                            <SelectItem value="paper">Paper Trading</SelectItem>
                            <SelectItem value="mt5">MetaTrader 5</SelectItem>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="symbol">Symbol</Label>
                          <Input id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Risk Management
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxDailyLoss">Max Daily Loss ($)</Label>
                          <Input id="maxDailyLoss" type="number" value={maxDailyLoss} onChange={(e) => setMaxDailyLoss(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                          <Input id="maxDrawdown" type="number" value={maxDrawdown} onChange={(e) => setMaxDrawdown(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxPositionSize">Max Position Size</Label>
                          <Input id="maxPositionSize" type="number" step="0.01" value={maxPositionSize} onChange={(e) => setMaxPositionSize(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="defaultStopLoss">Default Stop Loss (pts)</Label>
                          <Input id="defaultStopLoss" type="number" value={defaultStopLoss} onChange={(e) => setDefaultStopLoss(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Brain className="h-4 w-4" /> AI Analysis
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableAI">AI-Powered Trade Analysis</Label>
                          <p className="text-xs text-slate-500">Use AI to validate trade signals before execution</p>
                        </div>
                        <Switch checked={enableAI} onCheckedChange={setEnableAI} />
                      </div>
                    </div>

                    <Button onClick={handleSaveConfig} disabled={savingConfig}>
                      {savingConfig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Bot Configuration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram">
            <Card className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Telegram Integration
                </CardTitle>
                <CardDescription>Link your Telegram account for trade alerts and manual approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-lg">
                  {linkedTelegram ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-emerald-300">Linked to Chat ID: {linkedTelegram}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleUnlinkTelegram}>
                          <Unlink className="h-4 w-4 mr-1" />
                          Unlink
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        You will receive trade signals and alerts in your linked Telegram chat.
                        Use the bot commands to approve or reject trades.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-slate-700 p-4 space-y-3">
                        <p className="text-sm text-slate-300">To link your Telegram:</p>
                        <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                          <li>Open Telegram and search for <span className="text-white font-medium">@XMBotTradingBot</span></li>
                          <li>Start a chat and send <span className="text-white font-medium">/start</span></li>
                          <li>The bot will reply with your Chat ID</li>
                          <li>Copy and paste the Chat ID below</li>
                        </ol>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter your Telegram Chat ID"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                        />
                        <Button onClick={handleSaveTelegram} disabled={savingTelegram}>
                          {savingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Your Chat ID is used to send trade alerts and receive manual approval requests.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="binance">
            <Card className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Binance Connection
                </CardTitle>
                <CardDescription>Connect your Binance account to start automated trading</CardDescription>
              </CardHeader>
              <CardContent>
                <BinanceForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionCard />
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <SessionsCard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
