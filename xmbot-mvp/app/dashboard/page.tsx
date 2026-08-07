import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { enforceBotExpiry } from "@/lib/bot-expiry"
import { Topbar } from "@/components/dashboard/topbar"
import { StatCard } from "@/components/dashboard/stats-cards"
import { RecentTrades } from "@/components/dashboard/recent-trades"
import { EngineStatus } from "@/components/dashboard/engine-status"
import { PositionsPanel } from "@/components/dashboard/positions-panel"
import { LivePnL } from "@/components/dashboard/live-pnl"
import { TradeFeed } from "@/components/dashboard/trade-feed"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"

export const dynamic = "force-dynamic"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  await enforceBotExpiry(userId)

  const engineHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
  }
  if (API_KEY) engineHeaders["x-api-key"] = API_KEY

  const [user, trades, tradeStats, openTradesCount, engineMetricsRes, engineTradesRes] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        botInstances: { where: { status: "ACTIVE" } },
      },
    }),
    db.trade.findMany({
      where: {
        botInstance: { userId },
      },
      orderBy: { openTime: "desc" },
      take: 10,
    }),
    db.trade.aggregate({
      where: {
        botInstance: { userId },
        status: "CLOSED",
      },
      _count: { id: true },
      _sum: { profit: true },
    }),
    db.trade.count({
      where: {
        botInstance: { userId },
        status: "OPEN",
      },
    }),
    fetch(`${ENGINE_URL}/api/sync/metrics`, {
      headers: engineHeaders,
      signal: AbortSignal.timeout(5000),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch(`${ENGINE_URL}/api/sync/trades?limit=10`, {
      headers: engineHeaders,
      signal: AbortSignal.timeout(5000),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ])

  const hasEngineData = engineMetricsRes && (engineMetricsRes.total_trades > 0 || engineMetricsRes.open_trades > 0)

  const totalTrades = hasEngineData ? engineMetricsRes.total_trades : tradeStats._count.id
  const totalPnL = hasEngineData ? engineMetricsRes.total_pnl : (tradeStats._sum.profit ?? 0)
  const openTrades = hasEngineData ? engineMetricsRes.open_trades : openTradesCount

  const winRate = hasEngineData
    ? engineMetricsRes.win_rate.toFixed(1)
    : tradeStats._count.id > 0
      ? ((await db.trade.count({
          where: { botInstance: { userId }, status: "CLOSED", profit: { gt: 0 } },
        }) / tradeStats._count.id) * 100).toFixed(1)
      : "0"

  const activeBots = user?.botInstances.length ?? 0

  const displayTrades = hasEngineData && engineTradesRes
    ? engineTradesRes.map((t: any) => ({
        id: t.id,
        symbol: t.symbol,
        type: t.action,
        openPrice: t.entry_price,
        closePrice: t.exit_price,
        lotSize: t.volume,
        profit: t.pnl,
        status: t.status,
        openTime: t.open_time,
      }))
    : trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        type: t.type,
        openPrice: t.openPrice,
        closePrice: t.closePrice,
        lotSize: t.lotSize,
        profit: t.profit,
        status: t.status,
        openTime: t.openTime.toISOString(),
      }))

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {!user?.isActive && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
            Your account is not active yet. Please{" "}
            <a href="/checkout" className="underline font-medium">subscribe</a>{" "}
            to activate your trading bot.
          </div>
        )}

        <OnboardingChecklist />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LivePnL />
          <div>
            <EngineStatus />
          </div>
        </div>

        <TradeFeed />

        <PositionsPanel />

        <RecentTrades trades={displayTrades} />
      </main>
    </>
  )
}
