"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface EngineHealth {
  status: string
  broker: string
  connected: boolean
}

interface Position {
  id: string
  symbol: string
  direction: string
  volume: number
  entry_price: number
  current_price: number
  stop_loss: number
  take_profit: number
  unrealized_pnl: number
}

interface AccountInfo {
  balance: number
  equity: number
  currency: string
}

interface Metrics {
  total_trades: number
  winning_trades: number
  win_rate: number
  total_pnl: number
  open_trades: number
  account_balance: number
  account_equity: number
}

export function useEngineStream() {
  const [health, setHealth] = useState<EngineHealth | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    const es = new EventSource("/api/engine/stream")
    eventSourceRef.current = es

    es.addEventListener("health", (e) => {
      setHealth(JSON.parse(e.data))
      setConnected(true)
    })

    es.addEventListener("positions", (e) => {
      setPositions(JSON.parse(e.data))
    })

    es.addEventListener("account", (e) => {
      setAccount(JSON.parse(e.data))
    })

    es.addEventListener("metrics", (e) => {
      setMetrics(JSON.parse(e.data))
    })

    es.addEventListener("error", () => {
      setConnected(false)
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      // Reconnect after 5 seconds
      setTimeout(connect, 5000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  return { health, positions, account, metrics, connected }
}
