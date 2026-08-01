"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Monitor, Smartphone, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SessionData {
  id: string
  expires: string
  isCurrent: boolean
}

export function SessionsCard() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/settings/sessions")
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAll = async () => {
    setRevoking(true)
    try {
      const res = await fetch("/api/settings/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        toast({ title: "Sessions revoked", description: "All other sessions have been terminated." })
        fetchSessions()
      }
    } catch {
      toast({ title: "Error", description: "Failed to revoke sessions", variant: "destructive" })
    } finally {
      setRevoking(false)
    }
  }

  const handleRevokeOne = async (sessionId: string) => {
    try {
      const res = await fetch("/api/settings/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        toast({ title: "Session revoked" })
        fetchSessions()
      }
    } catch {
      toast({ title: "Error", description: "Failed to revoke session", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sessions...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
        </p>
        {sessions.length > 1 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRevokeAll}
            disabled={revoking}
          >
            {revoking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Revoke All Others
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((s) => (
          <Card key={s.id} className="bg-white/[0.03] border-white/10 rounded-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">Browser Session</span>
                    {s.isCurrent && (
                      <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Expires: {new Date(s.expires).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeOne(s.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Revoke
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
