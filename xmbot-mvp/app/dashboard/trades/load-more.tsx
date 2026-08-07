"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatPrice, formatPnL } from "@/lib/utils"

interface Trade {
  id: string
  symbol: string
  type: string
  openPrice: number
  closePrice: number | null
  lotSize: number
  profit: number | null
  status: string
  openTime: string
}

export function LoadMoreTrades() {
  const searchParams = useSearchParams()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 25

  const loadMore = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })

      const symbol = searchParams.get("symbol")
      const type = searchParams.get("type")
      const status = searchParams.get("status")
      if (symbol) params.set("symbol", symbol)
      if (type) params.set("action", type)
      if (status) params.set("status", status)

      const res = await fetch(`/api/engine/history?${params}`)
      const data = await res.json()

      if (data.trades) {
        const mapped = data.trades.map((t: any) => ({
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
        setTrades((prev) => [...prev, ...mapped])
        setOffset((prev) => prev + PAGE_SIZE)
        setHasMore(mapped.length === PAGE_SIZE)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!hasMore && trades.length === 0) return null

  return (
    <>
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="flex items-center gap-4 border-t border-border px-6 py-3 text-sm"
        >
          <span className="text-muted-foreground w-32">{formatDate(trade.openTime)}</span>
          <span className="text-foreground font-medium w-16">{trade.symbol}</span>
          <span className="w-14">
            <Badge variant={trade.type === "BUY" ? "default" : "destructive"} className="text-xs">
              {trade.type}
            </Badge>
          </span>
          <span className="text-muted-foreground w-12">{trade.lotSize}</span>
          <span className="text-muted-foreground w-20">{formatPrice(trade.openPrice)}</span>
          <span className="text-muted-foreground w-20">
            {trade.closePrice ? formatPrice(trade.closePrice) : "—"}
          </span>
          <span className={`w-20 ${trade.profit && trade.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trade.profit !== null ? formatPnL(trade.profit) : "—"}
          </span>
          <span>
            <Badge variant={trade.status === "OPEN" ? "outline" : "secondary"} className="text-xs">
              {trade.status}
            </Badge>
          </span>
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="border-border text-muted-foreground"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            Load More
          </Button>
        </div>
      )}
    </>
  )
}
