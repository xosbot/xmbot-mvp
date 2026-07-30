import { db } from "@/lib/db"
import { StatCard } from "@/components/dashboard/stats-cards"
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
import { Users, Bot, DollarSign, Clock } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const totalUsers = await db.user.count()
  const activeSubscriptions = await db.botInstance.count({ where: { status: "ACTIVE" } })

  const successfulPayments = await db.payment.findMany({
    where: { status: "SUCCESS" },
  })
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0)

  const pendingUsers = await db.user.count({ where: { isActive: false } })

  // Recent registrations
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Recent payments
  const recentPayments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { email: true } } },
  })

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Admin Overview</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={String(totalUsers)} icon={Users} />
          <StatCard title="Active Subscriptions" value={String(activeSubscriptions)} icon={Bot} />
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
          <StatCard title="Pending Approvals" value={String(pendingUsers)} icon={Clock} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Registrations */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-800">
                      <TableCell className="text-slate-300 text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id} className="border-slate-800">
                      <TableCell className="text-slate-300 text-sm">{payment.user.email}</TableCell>
                      <TableCell className="text-white">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "SUCCESS" ? "default" :
                            payment.status === "FAILED" ? "destructive" : "secondary"
                          }
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
