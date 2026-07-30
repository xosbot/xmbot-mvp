import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Topbar } from "@/components/dashboard/topbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatPrice, formatPnL } from "@/lib/utils"
import { LoadMoreTrades } from "./load-more"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 25

export default async function TradesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trades = await db.trade.findMany({
    where: {
      botInstance: { userId: session.user.id },
    },
    orderBy: { openTime: "desc" },
    take: PAGE_SIZE,
    include: {
      botInstance: { select: { broker: true } },
    },
  })

  const totalTrades = await db.trade.count({
    where: { botInstance: { userId: session.user.id } },
  })

  const closedTrades = await db.trade.findMany({
    where: {
      botInstance: { userId: session.user.id },
      status: "CLOSED",
    },
    select: { profit: true },
  })

  const totalPnL = closedTrades.reduce((s, t) => s + (t.profit ?? 0), 0)
  const openTrades = totalTrades - closedTrades.length
  const hasMore = totalTrades > PAGE_SIZE

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
          <CardHeader>
            <CardTitle className="text-white">All Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No trades yet. Your bot will start trading once activated.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">Symbol</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Lot</TableHead>
                      <TableHead className="text-slate-400">Open</TableHead>
                      <TableHead className="text-slate-400">Close</TableHead>
                      <TableHead className="text-slate-400">P&L</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id} className="border-slate-800">
                        <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                          {formatDate(trade.openTime)}
                        </TableCell>
                        <TableCell className="text-white font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === "BUY" ? "default" : "destructive"} className="text-xs">
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{trade.lotSize}</TableCell>
                        <TableCell className="text-slate-300">{formatPrice(trade.openPrice)}</TableCell>
                        <TableCell className="text-slate-300">
                          {trade.closePrice ? formatPrice(trade.closePrice) : "—"}
                        </TableCell>
                        <TableCell className={trade.profit && trade.profit >= 0 ? "text-emerald-500" : "text-red-400"}>
                          {trade.profit !== null ? formatPnL(trade.profit) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.status === "OPEN" ? "outline" : "secondary"} className="text-xs">
                            {trade.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {hasMore && <LoadMoreTrades />}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
