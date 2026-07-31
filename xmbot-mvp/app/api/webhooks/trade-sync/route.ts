import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

const WEBHOOK_SECRET = process.env.TRADE_SYNC_SECRET || ""

interface TradePayload {
  action: "open" | "close" | "update"
  userId: string
  tradeId?: string
  symbol: string
  type: "BUY" | "SELL"
  openPrice?: number
  closePrice?: number
  lotSize: number
  profit?: number
  stopLoss?: number
  takeProfit?: number
  openTime?: string
  closeTime?: string
  status?: "OPEN" | "CLOSED"
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload: TradePayload = await req.json()

    if (!payload.userId || !payload.symbol || !payload.type || !payload.lotSize) {
      return NextResponse.json(
        { error: "Missing required fields: userId, symbol, type, lotSize" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let botInstance = await db.botInstance.findFirst({
      where: { userId: payload.userId },
    })

    if (!botInstance) {
      botInstance = await db.botInstance.create({
        data: {
          userId: payload.userId,
          status: "ACTIVE",
          broker: "paper",
        },
      })
    }

    if (payload.action === "open") {
      const trade = await db.trade.create({
        data: {
          botInstanceId: botInstance.id,
          symbol: payload.symbol,
          type: payload.type,
          openPrice: payload.openPrice || 0,
          lotSize: payload.lotSize,
          stopLoss: payload.stopLoss,
          takeProfit: payload.takeProfit,
          openTime: payload.openTime ? new Date(payload.openTime) : new Date(),
          status: "OPEN",
        },
      })

      return NextResponse.json({ success: true, trade })
    }

    if (payload.action === "close" && payload.tradeId) {
      const trade = await db.trade.findUnique({
        where: { id: payload.tradeId },
      })

      if (!trade) {
        return NextResponse.json({ error: "Trade not found" }, { status: 404 })
      }

      if (trade.botInstanceId !== botInstance.id) {
        return NextResponse.json({ error: "Trade belongs to different bot instance" }, { status: 403 })
      }

      const updatedTrade = await db.trade.update({
        where: { id: payload.tradeId },
        data: {
          closePrice: payload.closePrice,
          profit: payload.profit,
          closeTime: payload.closeTime ? new Date(payload.closeTime) : new Date(),
          status: "CLOSED",
        },
      })

      return NextResponse.json({ success: true, trade: updatedTrade })
    }

    if (payload.action === "update" && payload.tradeId) {
      const trade = await db.trade.findUnique({
        where: { id: payload.tradeId },
      })

      if (!trade) {
        return NextResponse.json({ error: "Trade not found" }, { status: 404 })
      }

      if (trade.botInstanceId !== botInstance.id) {
        return NextResponse.json({ error: "Trade belongs to different bot instance" }, { status: 403 })
      }

      const updatedTrade = await db.trade.update({
        where: { id: payload.tradeId },
        data: {
          ...(payload.closePrice !== undefined && { closePrice: payload.closePrice }),
          ...(payload.profit !== undefined && { profit: payload.profit }),
          ...(payload.stopLoss !== undefined && { stopLoss: payload.stopLoss }),
          ...(payload.takeProfit !== undefined && { takeProfit: payload.takeProfit }),
          ...(payload.status !== undefined && { status: payload.status }),
        },
      })

      return NextResponse.json({ success: true, trade: updatedTrade })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Trade sync webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
