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
import { formatDate, formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminPaymentsPage() {
  const payments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  })

  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Payments</h1>
        <span className="text-sm text-slate-500 ml-2">
          Total Revenue: {formatCurrency(totalRevenue)}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Order ID</TableHead>
                      <TableHead className="text-slate-400">Amount</TableHead>
                      <TableHead className="text-slate-400">Plan</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Method</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="border-slate-800">
                        <TableCell className="text-white">{payment.user.email}</TableCell>
                        <TableCell className="text-slate-400 text-xs font-mono">
                          {payment.cashfreeOrderId.slice(0, 20)}...
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-slate-300 capitalize">{payment.plan}</TableCell>
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
                        <TableCell className="text-slate-400 text-sm">
                          {payment.paymentMethod || "—"}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(payment.createdAt)}
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
