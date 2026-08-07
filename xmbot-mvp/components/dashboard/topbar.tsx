"use client"

import { useSession } from "next-auth/react"
import { MobileSidebar } from "./sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useEngineStream } from "@/hooks/use-engine-stream"
import { Settings, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"

export function Topbar({ title }: { title: string }) {
  const { data: session } = useSession()
  const { connected } = useEngineStream()
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Engine status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-accent">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
          <span className={`text-xs font-mono ${connected ? "text-emerald-600" : "text-muted-foreground"}`}>
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        {/* Quick actions */}
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>

        {/* User menu */}
        <div className="flex items-center gap-2 ml-1">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session?.user?.email}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gold-500/10 text-gold-700 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
