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
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "25" })
      if (cursor) params.set("cursor", cursor)

      const symbol = searchParams.get("symbol")
      const type = searchParams.get("type")
      const status = searchParams.get("status")
      const sort = searchParams.get("sort")
      if (symbol) params.set("symbol", symbol)
      if (type) params.set("type", type)
      if (status) params.set("status", status)
      if (sort) params.set("sort", sort)

      const res = await fetch(`/api/trades?${params}`)
      const data = await res.json()

      if (data.trades) {
        setTrades((prev) => [...prev, ...data.trades])
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
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
          className="flex items-center gap-4 border-t border-slate-800 px-6 py-3 text-sm"
        >
          <span className="text-slate-400 w-32">{formatDate(trade.openTime)}</span>
          <span className="text-white font-medium w-16">{trade.symbol}</span>
          <span className="w-14">
            <Badge variant={trade.type === "BUY" ? "default" : "destructive"} className="text-xs">
              {trade.type}
            </Badge>
          </span>
          <span className="text-slate-300 w-12">{trade.lotSize}</span>
          <span className="text-slate-300 w-20">{formatPrice(trade.openPrice)}</span>
          <span className="text-slate-300 w-20">
            {trade.closePrice ? formatPrice(trade.closePrice) : "—"}
          </span>
          <span className={`w-20 ${trade.profit && trade.profit >= 0 ? "text-emerald-500" : "text-red-400"}`}>
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
            className="border-slate-700 text-slate-400"
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
