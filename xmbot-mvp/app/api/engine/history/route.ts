import { NextResponse } from "next/server"
import { auth } from "@/auth"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

export const dynamic = "force-dynamic"

interface TradeOut {
  id: string
  symbol: string
  action: string
  open_price: number
  close_price: number | null
  lot_size: number
  profit: number | null
  stop_loss: number | null
  take_profit: number | null
  open_time: string
  close_time: string | null
  status: string
  broker_trade_id: string | null
}

interface MetricsOut {
  total_trades: number
  winning_trades: number
  win_rate: number
  total_pnl: number
  open_trades: number
  account_balance: number
  account_equity: number
}

interface HistoryResponse {
  trades: TradeOut[]
  metrics: MetricsOut
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-User-Id": session.user.id,
    }
    if (API_KEY) {
      headers["x-api-key"] = API_KEY
    }

    const url = new URL(req.url)
    const limit = url.searchParams.get("limit") || "50"
    const since = url.searchParams.get("since") || ""

    const params = new URLSearchParams({ limit })
    if (since) params.set("since", since)

    const [tradesRes, metricsRes] = await Promise.allSettled([
      fetch(`${ENGINE_URL}/api/sync/trades?${params}`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${ENGINE_URL}/api/sync/metrics`, {
        headers,
        signal: AbortSignal.timeout(5000),
      }),
    ])

    let trades: TradeOut[] = []
    let metrics: MetricsOut = {
      total_trades: 0,
      winning_trades: 0,
      win_rate: 0,
      total_pnl: 0,
      open_trades: 0,
      account_balance: 10000,
      account_equity: 10000,
    }

    if (tradesRes.status === "fulfilled" && tradesRes.value.ok) {
      trades = await tradesRes.value.json()
    }

    if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
      metrics = await metricsRes.value.json()
    }

    const response: HistoryResponse = { trades, metrics }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Engine history fetch error:", error)
    return NextResponse.json(
      {
        trades: [],
        metrics: {
          total_trades: 0,
          winning_trades: 0,
          win_rate: 0,
          total_pnl: 0,
          open_trades: 0,
          account_balance: 10000,
          account_equity: 10000,
        },
      },
      { status: 500 }
    )
  }
}
