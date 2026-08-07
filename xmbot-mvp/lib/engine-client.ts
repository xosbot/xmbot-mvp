import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ENGINE_BASE = process.env.ENGINE_API_URL || "http://localhost:8080";
const API_KEY = process.env.XMBOT_API_KEY || "";

/**
 * The engine trusts X-User-Id to scope trades/positions/metrics per user, but
 * only ever talks to this Next.js server (bound to 127.0.0.1 in production).
 * That's a single point of failure: if the engine port is ever exposed
 * directly, X-User-Id becomes a trivially spoofable header. Sign it with the
 * same shared secret both sides already hold (XMBOT_API_KEY) so the engine
 * can reject a forged user id even if the network boundary is misconfigured.
 */
export function signUserId(userId: string): string {
  return createHmac("sha256", API_KEY).update(userId).digest("hex");
}

/** Headers to attach to any authenticated engine request for `userId`. */
export function engineAuthHeaders(userId: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
    "X-User-Signature": signUserId(userId),
  };
  if (API_KEY) headers["x-api-key"] = API_KEY;
  return headers;
}

interface EngineStatus {
  engine: string;
  broker: string;
  broker_connected: boolean;
  agents: string[];
  pending_signals: number;
  uptime_hours: number;
  last_sync: string | null;
}

interface TradeData {
  id: string;
  symbol: string;
  action: string;
  open_price: number;
  close_price: number | null;
  lot_size: number;
  profit: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  open_time: string;
  close_time: string | null;
  status: string;
  broker_trade_id: string | null;
}

interface EngineMetrics {
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_pnl: number;
  open_trades: number;
  account_balance: number;
  account_equity: number;
}

async function fetchEngine<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${ENGINE_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
      next: { revalidate: 5 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function getHealth() {
  return fetchEngine<{ status: string; agents: string[]; broker: string; connected: boolean }>("/health");
}

export function getPositions() {
  return fetchEngine<any[]>("/positions");
}

export function getAccount() {
  return fetchEngine<any>("/account");
}

export function getStatus() {
  return fetchEngine<EngineStatus>("/api/sync/status");
}

export function getMetrics() {
  return fetchEngine<EngineMetrics>("/api/sync/metrics");
}

export function getTrades(since?: string) {
  const params = since ? `?since=${encodeURIComponent(since)}` : "";
  return fetchEngine<TradeData[]>(`/api/sync/trades${params}`);
}

export function controlEngine(action: "start" | "stop" | "restart" | "pause" | "resume" | "status") {
  return fetchEngine<{ status: string }>("/control", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

/**
 * Forward a request from a Next.js API route to the engine, attaching the
 * shared X-User-Id / x-api-key headers. Single implementation used by both
 * the user-facing `/api/engine/*` routes and the admin-facing
 * `/api/admin/engine/*` routes — do not hand-roll another fetch-to-engine
 * helper next to this one.
 */
export async function proxyEngineRequest(
  req: NextRequest,
  method: string,
  path: string,
  userId: string
): Promise<NextResponse> {
  try {
    const headers = engineAuthHeaders(userId);
    const init: RequestInit = { method, headers };

    if (method !== "GET" && method !== "HEAD") {
      try {
        const body = await req.json();
        init.body = JSON.stringify(body);
      } catch {
        // No body
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    init.signal = controller.signal;

    const res = await fetch(`${ENGINE_BASE}${path}`, init);
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "Engine error");
      console.error(`Engine ${method} ${path} failed:`, res.status, text);
      return NextResponse.json({ error: "Engine error", detail: text }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Engine timeout" }, { status: 504 });
    }
    console.error("Engine proxy error:", error);
    return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
  }
}
