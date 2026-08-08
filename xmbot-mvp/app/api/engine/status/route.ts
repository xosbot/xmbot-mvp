import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { engineAuthHeaders } from "@/lib/engine-client"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"

export const dynamic = "force-dynamic"

interface EngineStatus {
  engine: "running" | "stopped" | "error" | "unknown"
  broker: string
  brokerConnected: boolean
  agents: string[]
  openPositions: number
  pendingSignals: number
  uptime: number
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const headers = engineAuthHeaders(session.user.id)

    const [healthRes, controlRes] = await Promise.allSettled([
      fetch(`${ENGINE_URL}/health`, { headers, signal: AbortSignal.timeout(5000) }),
      fetch(`${ENGINE_URL}/control`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "status" }),
        signal: AbortSignal.timeout(5000),
      }),
    ])

    let status: EngineStatus = {
      engine: "unknown",
      broker: "unknown",
      brokerConnected: false,
      agents: [],
      openPositions: 0,
      pendingSignals: 0,
      uptime: 0,
    }

    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      const health = await healthRes.value.json()
      status.engine = health.status === "running" ? "running" : "stopped"
      status.broker = health.broker || "unknown"
      status.brokerConnected = health.connected || false
      status.agents = health.agents || []
    }

    if (controlRes.status === "fulfilled" && controlRes.value.ok) {
      const control = await controlRes.value.json()
      status.pendingSignals = control.pending_signals || 0
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Engine status error:", error)
    return NextResponse.json({
      engine: "unknown",
      broker: "unknown",
      brokerConnected: false,
      agents: [],
      openPositions: 0,
      pendingSignals: 0,
      uptime: 0,
    })
  }
}
