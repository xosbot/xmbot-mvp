"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, UserCheck, UserX, Shield, ShieldOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserActionsProps {
  userId: string
  isActive: boolean
  role: string
  onAction: () => void
}

export function UserActions({ userId, isActive, role, onAction }: UserActionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleToggleActive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: isActive ? "User deactivated" : "User activated" })
      onAction()
    } catch {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = async () => {
    setLoading(true)
    try {
      const newRole = role === "ADMIN" ? "USER" : "ADMIN"
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error("Failed")
      toast({ title: `Role changed to ${newRole}` })
      onAction()
    } catch {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
        <DropdownMenuItem onClick={handleToggleActive} className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer">
          {isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
          {isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleRole} className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer">
          {role === "ADMIN" ? <ShieldOff className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
          {role === "ADMIN" ? "Remove Admin" : "Make Admin"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
