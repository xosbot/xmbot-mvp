import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Topbar } from "@/components/dashboard/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPnL } from "@/lib/utils"
import { TradeFilters } from "@/components/dashboard/trade-filters"
import { TradeSort } from "@/components/dashboard/trade-sort"
import { TradesTable } from "@/components/dashboard/trades-table"
import { LoadMoreTrades } from "./load-more"
import { engineAuthHeaders } from "@/lib/engine-client"

export const dynamic = "force-dynamic"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const PAGE_SIZE = 25

interface EngineTrade {
  id: string
  symbol: string
  action: string
  entry_price: number
  exit_price: number | null
  volume: number
  pnl: number | null
  stop_loss: number | null
  take_profit: number | null
  status: string
  open_time: string
  close_time: string | null
  broker_trade_id: string | null
  notes?: string
}

interface EngineStats {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  avg_pnl: number
  best_trade: number
  worst_trade: number
}

function mapEngineTrade(t: EngineTrade) {
  return {
    id: t.id,
    symbol: t.symbol,
    type: t.action,
    openPrice: t.entry_price,
    closePrice: t.exit_price,
    lotSize: t.volume,
    profit: t.pnl,
    stopLoss: t.stop_loss,
    takeProfit: t.take_profit,
    status: t.status,
    openTime: t.open_time,
    closeTime: t.close_time,
    botInstance: { broker: "paper" },
  }
}

interface TradesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TradesPage({ searchParams }: TradesPageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  const symbol = typeof params.symbol === "string" ? params.symbol : undefined
  const type = typeof params.type === "string" ? params.type : undefined
  const status = typeof params.status === "string" ? params.status : undefined
  const sort = typeof params.sort === "string" ? params.sort : "openTime-desc"
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page)) : 1

  const offset = (page - 1) * PAGE_SIZE

  const engineHeaders = engineAuthHeaders(session.user.id)

  const engineParams = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
  if (symbol) engineParams.set("symbol", symbol)
  if (type) engineParams.set("action", type)
  if (status) engineParams.set("status", status)

  const [engineTradesRes, engineStatsRes] = await Promise.allSettled([
    fetch(`${ENGINE_URL}/api/history/trades?${engineParams}`, {
      headers: engineHeaders,
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${ENGINE_URL}/api/history/stats`, {
      headers: engineHeaders,
      signal: AbortSignal.timeout(5000),
    }),
  ])

  let engineTrades: EngineTrade[] = []
  let engineStats: EngineStats | null = null

  if (engineTradesRes.status === "fulfilled" && engineTradesRes.value.ok) {
    engineTrades = await engineTradesRes.value.json()
  }
  if (engineStatsRes.status === "fulfilled" && engineStatsRes.value.ok) {
    engineStats = await engineStatsRes.value.json()
  }

  const useEngine = engineTrades.length > 0 || (engineStats && engineStats.total_trades > 0)

  let trades: ReturnType<typeof mapEngineTrade>[]
  let totalTrades: number
  let totalPnL: number
  let openTrades: number

  if (useEngine) {
    trades = engineTrades.map(mapEngineTrade)
    totalTrades = engineStats?.total_trades ?? engineTrades.length
    totalPnL = engineStats?.total_pnl ?? 0
    openTrades = engineStats ? engineStats.total_trades - engineStats.winning_trades - engineStats.losing_trades : 0
  } else {
    const where = {
      botInstance: { userId: session.user.id },
      ...(symbol && { symbol }),
      ...(type && { type: type as "BUY" | "SELL" }),
      ...(status && { status: status as "OPEN" | "CLOSED" }),
    }

    const orderBy = (() => {
      const [field, direction] = sort.split("-")
      return { [field]: direction as "asc" | "desc" }
    })()

    const [dbTrades, dbTotal, dbStats] = await Promise.all([
      db.trade.findMany({
        where,
        orderBy,
        take: PAGE_SIZE,
        skip: offset,
        include: { botInstance: { select: { broker: true } } },
      }),
      db.trade.count({ where }),
      db.trade.aggregate({
        where: {
          botInstance: { userId: session.user.id },
          status: "CLOSED",
          ...(symbol && { symbol }),
        },
        _count: { id: true },
        _sum: { profit: true },
      }),
    ])

    trades = dbTrades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      type: t.type,
      openPrice: t.openPrice,
      closePrice: t.closePrice,
      lotSize: t.lotSize,
      profit: t.profit,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      status: t.status,
      openTime: t.openTime.toISOString(),
      closeTime: t.closeTime?.toISOString() ?? null,
      botInstance: t.botInstance,
    }))
    totalTrades = dbTotal
    totalPnL = dbStats._sum.profit ?? 0
    openTrades = dbTotal - dbStats._count.id
  }

  const totalPages = Math.ceil(totalTrades / PAGE_SIZE)
  const hasMore = page < totalPages

  return (
    <>
      <Topbar title="Trade History" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="text-sm text-muted-foreground">
            Total trades: <span className="text-foreground font-medium">{totalTrades}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Open: <span className="text-foreground font-medium">{openTrades}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total P&L:{" "}
            <span className={totalPnL >= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
              {formatPnL(totalPnL)}
            </span>
          </div>
          {useEngine && (
            <div className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                Live Engine
              </span>
            </div>
          )}
        </div>

        <Card className="bg-card border-border rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-foreground">All Trades</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <Suspense fallback={null}>
                <TradeFilters
                  currentSymbol={symbol}
                  currentType={type}
                  currentStatus={status}
                />
              </Suspense>
              <Suspense fallback={null}>
                <TradeSort currentSort={sort} />
              </Suspense>
            </div>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {symbol || type || status
                  ? "No trades match your filters."
                  : "No trades yet. Your bot will start trading once activated."}
              </p>
            ) : (
              <>
                <TradesTable trades={trades} />
                {hasMore && <LoadMoreTrades />}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
