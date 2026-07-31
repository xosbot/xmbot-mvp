import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial data
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-User-Id": session.user.id,
        }
        if (API_KEY) headers["x-api-key"] = API_KEY

        const [healthRes, positionsRes, accountRes, metricsRes] = await Promise.allSettled([
          fetch(`${ENGINE_URL}/health`, { headers }),
          fetch(`${ENGINE_URL}/positions`, { headers }),
          fetch(`${ENGINE_URL}/account`, { headers }),
          fetch(`${ENGINE_URL}/api/sync/metrics`, { headers }),
        ])

        if (healthRes.status === "fulfilled" && healthRes.value.ok) {
          send("health", await healthRes.value.json())
        }
        if (positionsRes.status === "fulfilled" && positionsRes.value.ok) {
          send("positions", await positionsRes.value.json())
        }
        if (accountRes.status === "fulfilled" && accountRes.value.ok) {
          send("account", await accountRes.value.json())
        }
        if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
          send("metrics", await metricsRes.value.json())
        }
      } catch {
        send("error", { message: "Failed to fetch initial data" })
      }

      // Poll and send updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-User-Id": session.user.id,
          }
          if (API_KEY) headers["x-api-key"] = API_KEY

          const [positionsRes, accountRes, metricsRes] = await Promise.allSettled([
            fetch(`${ENGINE_URL}/positions`, { headers }),
            fetch(`${ENGINE_URL}/account`, { headers }),
            fetch(`${ENGINE_URL}/api/sync/metrics`, { headers }),
          ])

          if (positionsRes.status === "fulfilled" && positionsRes.value.ok) {
            send("positions", await positionsRes.value.json())
          }
          if (accountRes.status === "fulfilled" && accountRes.value.ok) {
            send("account", await accountRes.value.json())
          }
          if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
            send("metrics", await metricsRes.value.json())
          }
        } catch {
          send("error", { message: "Poll failed" })
        }
      }, 5000)

      // Keep alive ping every 30s
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: keepalive\n\n`))
      }, 30000)

      // Clean up after 5 minutes (SSE best practice)
      setTimeout(() => {
        clearInterval(interval)
        clearInterval(keepAlive)
        controller.close()
      }, 300000)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
