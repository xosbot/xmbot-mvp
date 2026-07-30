import { db } from "@/lib/db"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      botInstances: { select: { status: true } },
      _count: { select: { payments: true } },
    },
  })

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">User Management</h1>
        <span className="text-sm text-slate-500 ml-2">({users.length} total)</span>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Bot</TableHead>
                    <TableHead className="text-slate-400">Payments</TableHead>
                    <TableHead className="text-slate-400">Registered</TableHead>
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
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.botInstances.length > 0 ? (
                          <Badge
                            variant={user.botInstances[0].status === "ACTIVE" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.botInstances[0].status}
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">{user._count.payments}</TableCell>
                      <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
