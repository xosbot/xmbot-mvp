import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Trade {
  id: string
  symbol: string
  type: string
  openPrice: number
  closePrice: number | null
  profit: number | null
  status: string
  openTime: string | Date
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPrice(price: number): string {
  return price.toFixed(2)
}

function formatPnL(pnl: number): string {
  return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`
}

function TradeCard({ trade }: { trade: Trade }) {
  const isBuy = trade.type === "BUY"
  const pnlPositive = trade.profit !== null && trade.profit >= 0

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium text-sm">{trade.symbol}</span>
            <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
              {trade.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(trade.openTime)}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${pnlPositive ? "text-emerald-600" : trade.profit !== null ? "text-red-500" : "text-muted-foreground"}`}>
          {trade.profit !== null ? formatPnL(trade.profit) : "—"}
        </div>
        <p className="text-xs text-muted-foreground">{formatPrice(trade.openPrice)}</p>
      </div>
    </div>
  )
}

export function RecentTrades({ trades }: { trades: Trade[] }) {
  return (
    <Card className="bg-card border-border rounded-md">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No trades yet. Your bot will start trading once activated.
          </p>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="md:hidden">
              {trades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3">Time</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3">Symbol</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3">Type</th>
                    <th className="text-right text-xs font-medium text-muted-foreground pb-3">Open</th>
                    <th className="text-right text-xs font-medium text-muted-foreground pb-3">Close</th>
                    <th className="text-right text-xs font-medium text-muted-foreground pb-3">P&L</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-border/50">
                      <td className="py-3 text-muted-foreground text-xs">
                        {formatDate(trade.openTime)}
                      </td>
                      <td className="py-3 text-foreground font-medium">{trade.symbol}</td>
                      <td className="py-3">
                        <Badge
                          variant={trade.type === "BUY" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {trade.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{formatPrice(trade.openPrice)}</td>
                      <td className="py-3 text-right text-muted-foreground">
                        {trade.closePrice ? formatPrice(trade.closePrice) : "—"}
                      </td>
                      <td className={`py-3 text-right font-medium ${trade.profit && trade.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {trade.profit !== null ? formatPnL(trade.profit) : "—"}
                      </td>
                      <td className="py-3">
                        <Badge variant={trade.status === "OPEN" ? "outline" : "secondary"} className="text-xs">
                          {trade.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
