import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (!action || !["start", "stop", "restart"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be: start, stop, or restart" },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-User-Id": session.user.id,
    }
    if (API_KEY) {
      headers["x-api-key"] = API_KEY
    }

    const res = await fetch(`${ENGINE_URL}/control`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "Engine error")
      console.error(`Engine ${action} failed:`, res.status, text)
      return NextResponse.json(
        { error: `Failed to ${action} engine`, detail: text },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Engine timeout" },
        { status: 504 }
      )
    }
    console.error("Engine control error:", error)
    return NextResponse.json(
      { error: "Engine unreachable" },
      { status: 503 }
    )
  }
}
