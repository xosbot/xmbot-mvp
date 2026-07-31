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

export const dynamic = "force-dynamic"

const PAGE_SIZE = 25

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

  const skip = (page - 1) * PAGE_SIZE

  const [trades, totalTrades, tradeStats] = await Promise.all([
    db.trade.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip,
      include: {
        botInstance: { select: { broker: true } },
      },
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

  const totalPnL = tradeStats._sum.profit ?? 0
  const openTrades = totalTrades - tradeStats._count.id
  const totalPages = Math.ceil(totalTrades / PAGE_SIZE)
  const hasMore = page < totalPages

  return (
    <>
      <Topbar title="Trade History" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
          <div className="text-sm text-slate-400">
            Total trades: <span className="text-white font-medium">{totalTrades}</span>
          </div>
          <div className="text-sm text-slate-400">
            Open: <span className="text-white font-medium">{openTrades}</span>
          </div>
          <div className="text-sm text-slate-400">
            Total P&L:{" "}
            <span className={totalPnL >= 0 ? "text-emerald-500 font-medium" : "text-red-400 font-medium"}>
              {formatPnL(totalPnL)}
            </span>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-white">All Trades</CardTitle>
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
              <p className="text-sm text-slate-500 text-center py-8">
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
