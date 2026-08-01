"use client"

import { useSession } from "next-auth/react"
import { MobileSidebar } from "./sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Topbar({ title }: { title: string }) {
  const { data: session } = useSession()
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-400 sm:inline">
          {session?.user?.email}
        </span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gold-500/20 text-gold-400 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
