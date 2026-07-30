import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const ENGINE_URL = process.env.ENGINE_API_URL || "http://localhost:8080"
const API_KEY = process.env.XMBOT_API_KEY || ""

interface EngineErrorResponse {
  error: string
  detail?: string
}

async function proxyToEngine(
  req: NextRequest,
  method: string,
  path: string
): Promise<NextResponse> {
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

    const init: RequestInit = { method, headers }

    if (method !== "GET" && method !== "HEAD") {
      try {
        const body = await req.json()
        init.body = JSON.stringify(body)
      } catch {
        // No body
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    init.signal = controller.signal

    const res = await fetch(`${ENGINE_URL}${path}`, init)
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => "Engine error")
      console.error(`Engine ${method} ${path} failed:`, res.status, text)
      return NextResponse.json(
        { error: "Engine error", detail: text },
        { status: res.status }
      )
    }

    return NextResponse.json(await res.json())
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Engine timeout" },
        { status: 504 }
      )
    }
    console.error("Engine proxy error:", error)
    return NextResponse.json(
      { error: "Engine unreachable" },
      { status: 503 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = "/" + (path?.join("/") || "health")
  return proxyToEngine(req, "GET", pathStr)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = "/" + (path?.join("/") || "")
  return proxyToEngine(req, "POST", pathStr)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = "/" + (path?.join("/") || "")
  return proxyToEngine(req, "PUT", pathStr)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathStr = "/" + (path?.join("/") || "")
  return proxyToEngine(req, "DELETE", pathStr)
}
