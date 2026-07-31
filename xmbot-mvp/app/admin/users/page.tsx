"use client"

import { useState, useEffect } from "react"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatCurrency } from "@/lib/utils"
import { UserActions } from "@/components/admin/user-actions"
import { Loader2 } from "lucide-react"

interface UserWithStats {
  id: string
  name: string | null
  email: string
  isActive: boolean
  role: string
  createdAt: string
  activeBots: number
  totalSpent: number
  binanceConnectedAt: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">User Management</h1>
        <span className="text-sm text-slate-500 ml-2">({users.length} total)</span>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">All Users</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="border-slate-700 text-slate-300">
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Role</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Bot</TableHead>
                      <TableHead className="text-slate-400">Spent</TableHead>
                      <TableHead className="text-slate-400">Binance</TableHead>
                      <TableHead className="text-slate-400">Registered</TableHead>
                      <TableHead className="text-slate-400"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-800">
                        <TableCell className="text-white font-medium">{user.email}</TableCell>
                        <TableCell className="text-slate-300">{user.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "destructive"} className="text-xs">
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.activeBots > 0 ? "default" : "secondary"} className="text-xs">
                            {user.activeBots > 0 ? `${user.activeBots} active` : "None"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(user.totalSpent)}</TableCell>
                        <TableCell>
                          <Badge variant={user.binanceConnectedAt ? "default" : "secondary"} className="text-xs">
                            {user.binanceConnectedAt ? "Connected" : "Not connected"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(new Date(user.createdAt))}
                        </TableCell>
                        <TableCell>
                          <UserActions
                            userId={user.id}
                            isActive={user.isActive}
                            role={user.role}
                            onAction={fetchUsers}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
