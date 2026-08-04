"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  Bot,
  CreditCard,
  LogOut,
  Shield,
  Menu,
  BarChart3,
  Cpu,
  SlidersHorizontal,
  Brain,
  ShieldAlert,
  Activity,
} from "lucide-react"
import { useState } from "react"

const adminNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Bot Instances", href: "/admin/bots", icon: Bot },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
]

const engineNavItems = [
  { title: "Status & Control", href: "/admin/engine", icon: Cpu },
  { title: "Strategy Tuning", href: "/admin/engine/strategy", icon: SlidersHorizontal },
  { title: "AI Config", href: "/admin/engine/ai", icon: Brain },
  { title: "Risk Limits", href: "/admin/engine/risk", icon: ShieldAlert },
  { title: "Positions/Account", href: "/admin/engine/positions", icon: Activity },
]

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const isSuperAdmin = role === "SUPERADMIN"

  return (
    <div className="flex h-full flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-800">
        <div className="corner-frame w-8 h-8 rounded-md border border-white/15 bg-white/[0.03] flex items-center justify-center">
          <Shield className="h-4 w-4 text-gold-400" />
        </div>
        <span className="text-lg font-bold text-white">Admin Panel</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-gold-500/10 text-gold-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}

        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Engine
            </div>
            {engineNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-gold-500/10 text-gold-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 p-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          User Dashboard
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 lg:block">
      <AdminSidebarContent />
    </aside>
  )
}

export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <AdminSidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
