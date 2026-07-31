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
              <TableRow
                key={trade.id}
                className="border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => handleRowClick(trade)}
              >
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
