"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Bot,
  Menu,
  CreditCard,
  Terminal,
  Brain,
  Wifi,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Agents", href: "/dashboard/agents", icon: Brain },
  { title: "Bots", href: "/dashboard/bots", icon: Bot },
  { title: "Brokers", href: "/dashboard/brokers", icon: Wifi },
  { title: "Trades", href: "/dashboard/trades", icon: BarChart3 },
  { title: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <div className="corner-frame w-8 h-8 rounded-md border border-gold-500/30 bg-gold-500/5 flex items-center justify-center">
          <Terminal className="h-4 w-4 text-gold-600" />
        </div>
        <span className="text-lg font-bold tracking-aggressive">
          <span className="text-foreground">XM</span>
          <span className="text-gold-600">One</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-gold-500/10 text-gold-700 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 lg:block">
      <SidebarContent />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
