import { NextResponse } from "next/server"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await fetch(`${ENGINE_URL}/api/sync/live-stats`, {
      headers: { "x-api-key": API_KEY },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({
        active_traders: 0,
        signals_generated: 0,
        approval_rate: 0,
      })
    }

    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({
      active_traders: 0,
      signals_generated: 0,
      approval_rate: 0,
    })
  }
}
