import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { engineAuthHeaders } from "@/lib/engine-client"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"

export const dynamic = "force-dynamic"

interface Position {
  id: string
  symbol: string
  type: "BUY" | "SELL"
  volume: number
  openPrice: number
  currentPrice: number
  profit: number
  stopLoss: number
  takeProfit: number
  openTime: string
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const headers = engineAuthHeaders(session.user.id)

    const res = await fetch(`${ENGINE_URL}/positions`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({ positions: [] })
    }

    const data = await res.json()
    const positions: Position[] = Array.isArray(data) ? data : data.positions || []

    return NextResponse.json({ positions })
  } catch (error) {
    console.error("Positions fetch error:", error)
    return NextResponse.json({ positions: [] })
  }
}
