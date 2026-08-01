"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatPrice, formatPnL, formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock, Target, Shield } from "lucide-react"

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

interface TradeDetailModalProps {
  trade: Trade | null
  open: boolean
  onClose: () => void
}

export function TradeDetailModal({ trade, open, onClose }: TradeDetailModalProps) {
  if (!trade) return null

  const isBuy = trade.type === "BUY"
  const pnlPositive = trade.profit && trade.profit >= 0
  const isOpen = trade.status === "OPEN"

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-neutral-950 border-white/10 rounded-md max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-lg font-bold">{trade.symbol}</span>
            <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
              {isBuy ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trade.type}
            </Badge>
            <Badge variant={isOpen ? "outline" : "secondary"} className="text-xs">
              {trade.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Trade opened {formatDate(trade.openTime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/[0.05] border-white/10 rounded-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Entry Price
                </div>
                <p className="text-white font-medium">{formatPrice(trade.openPrice)}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.05] border-white/10 rounded-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <TrendingDown className="h-3 w-3" />
                  {isOpen ? "Current Price" : "Exit Price"}
                </div>
                <p className="text-white font-medium">
                  {trade.closePrice ? formatPrice(trade.closePrice) : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/[0.05] border-white/10 rounded-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Target className="h-3 w-3" />
                  Lot Size
                </div>
                <p className="text-white font-medium">{trade.lotSize}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.05] border-white/10 rounded-md">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Shield className="h-3 w-3" />
                  P&L
                </div>
                <p className={`font-medium ${pnlPositive ? "text-emerald-500" : "text-red-400"}`}>
                  {trade.profit !== null ? formatPnL(trade.profit) : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {(trade.stopLoss || trade.takeProfit) && (
            <div className="grid grid-cols-2 gap-4">
              {trade.stopLoss && trade.stopLoss > 0 && (
                <Card className="bg-white/[0.05] border-white/10 rounded-md">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Shield className="h-3 w-3 text-red-400" />
                      Stop Loss
                    </div>
                    <p className="text-red-400 font-medium">{formatPrice(trade.stopLoss)}</p>
                  </CardContent>
                </Card>
              )}

              {trade.takeProfit && trade.takeProfit > 0 && (
                <Card className="bg-white/[0.05] border-white/10 rounded-md">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Target className="h-3 w-3 text-emerald-500" />
                      Take Profit
                    </div>
                    <p className="text-emerald-500 font-medium">{formatPrice(trade.takeProfit)}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {isOpen ? "Open since" : "Closed"}: {formatDate(trade.closeTime || trade.openTime)}
            {trade.botInstance?.broker && (
              <span className="ml-auto">Broker: {trade.botInstance.broker}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
