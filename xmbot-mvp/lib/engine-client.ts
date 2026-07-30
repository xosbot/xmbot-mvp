const ENGINE_BASE = process.env.ENGINE_API_URL || "http://localhost:8080";

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

export function controlEngine(action: "start" | "stop" | "status") {
  return fetchEngine<{ status: string }>("/control", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}
