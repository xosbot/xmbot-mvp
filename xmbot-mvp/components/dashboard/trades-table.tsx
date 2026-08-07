"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatPrice, formatPnL } from "@/lib/utils"
import { TradeDetailModal } from "./trade-detail-modal"

interface Trade {
  id: string
  symbol: string
  type: string
  openPrice: number
  closePrice: number | null
  lotSize: number
  profit: number | null
  status: string
  openTime: Date | string
  closeTime?: Date | string | null
  stopLoss?: number | null
  takeProfit?: number | null
  botInstance?: {
    broker: string
  }
}

interface TradesTableProps {
  trades: Trade[]
}

export function TradesTable({ trades }: TradesTableProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade)
    setModalOpen(true)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Symbol</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Lot</TableHead>
              <TableHead className="text-muted-foreground">Open</TableHead>
              <TableHead className="text-muted-foreground">Close</TableHead>
              <TableHead className="text-muted-foreground">P&L</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow
                key={trade.id}
                className="border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleRowClick(trade)}
              >
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatDate(trade.openTime)}
                </TableCell>
                <TableCell className="text-foreground font-medium">{trade.symbol}</TableCell>
                <TableCell>
                  <Badge variant={trade.type === "BUY" ? "default" : "destructive"} className="text-xs">
                    {trade.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{trade.lotSize}</TableCell>
                <TableCell className="text-muted-foreground">{formatPrice(trade.openPrice)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {trade.closePrice ? formatPrice(trade.closePrice) : "—"}
                </TableCell>
                <TableCell className={trade.profit && trade.profit >= 0 ? "text-emerald-600" : "text-red-500"}>
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
      </div>

      <TradeDetailModal
        trade={selectedTrade}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTrade(null)
        }}
      />
    </>
  )
}
