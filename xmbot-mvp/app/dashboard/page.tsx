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
import { TrendingUp, Bot, DollarSign, BarChart } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  await enforceBotExpiry(userId)

  const [user, trades, tradeStats, openTradesCount] = await Promise.all([
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
  ])

  const totalTrades = tradeStats._count.id
  const totalPnL = tradeStats._sum.profit ?? 0

  const winStats = totalTrades > 0
    ? await db.trade.count({
        where: {
          botInstance: { userId },
          status: "CLOSED",
          profit: { gt: 0 },
        },
      })
    : 0

  const winRate = totalTrades > 0 ? ((winStats / totalTrades) * 100).toFixed(1) : "0"
  const activeBots = user?.botInstances.length ?? 0

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {!user?.isActive && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            Your account is not active yet. Please{" "}
            <a href="/checkout" className="underline font-medium">subscribe</a>{" "}
            to activate your trading bot.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <LivePnL />
          <div>
            <EngineStatus />
          </div>
        </div>

        <TradeFeed />

        <PositionsPanel />

        <RecentTrades trades={trades.map(t => ({
          ...t,
          openTime: t.openTime.toISOString(),
        }))} />
      </main>
    </>
  )
}
