import { NextResponse } from "next/server"
import { auth } from "@/auth"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

export const dynamic = "force-dynamic"

interface AccountInfo {
  balance: number
  equity: number
  margin: number
  freeMargin: number
  marginLevel: number
  currency: string
}

export async function GET() {
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

    const res = await fetch(`${ENGINE_URL}/account`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({
        balance: 0,
        equity: 0,
        margin: 0,
        freeMargin: 0,
        marginLevel: 0,
        currency: "USD",
      })
    }

    const data = await res.json()
    const account: AccountInfo = {
      balance: data.balance || data.equity || 0,
      equity: data.equity || data.balance || 0,
      margin: data.margin || 0,
      freeMargin: data.free_margin || data.freeMargin || 0,
      marginLevel: data.margin_level || data.marginLevel || 0,
      currency: data.currency || "USD",
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error("Account fetch error:", error)
    return NextResponse.json({
      balance: 0,
      equity: 0,
      margin: 0,
      freeMargin: 0,
      marginLevel: 0,
      currency: "USD",
    })
  }
}
