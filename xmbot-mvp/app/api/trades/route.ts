import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const cursor = url.searchParams.get("cursor")
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100)

    const trades = await db.trade.findMany({
      where: {
        botInstance: { userId: session.user.id },
      },
      orderBy: { openTime: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = trades.length > limit
    const items = hasMore ? trades.slice(0, limit) : trades
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    return NextResponse.json({ trades: items, nextCursor, hasMore })
  } catch (error) {
    console.error("Fetch trades error:", error)
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
  }
}
