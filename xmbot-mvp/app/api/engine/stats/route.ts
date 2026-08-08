import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { engineAuthHeaders } from "@/lib/engine-client"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const headers = engineAuthHeaders(session.user.id)

    const res = await fetch(`${ENGINE_URL}/api/history/stats`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_pnl: 0,
        avg_pnl: 0,
        best_trade: 0,
        worst_trade: 0,
      })
    }

    return NextResponse.json(await res.json())
  } catch (error) {
    console.error("Engine stats fetch error:", error)
    return NextResponse.json({
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      total_pnl: 0,
      avg_pnl: 0,
      best_trade: 0,
      worst_trade: 0,
    })
  }
}
