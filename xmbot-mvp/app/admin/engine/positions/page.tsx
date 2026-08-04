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
import { EngineLivePositions } from "@/components/admin/engine-live-positions"

export const dynamic = "force-dynamic"

export default async function SuperAdminPositionsPage() {
  const trades = await db.trade.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      botInstance: { include: { user: { select: { email: true } } } },
    },
  })

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Positions &amp; Account</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <EngineLivePositions />

        <Card className="bg-white/[0.03] border-white/10 rounded-md">
          <CardHeader>
            <CardTitle className="text-white">Recent Trades (all users)</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No trades recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Symbol</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Open</TableHead>
                      <TableHead className="text-slate-400">Close</TableHead>
                      <TableHead className="text-slate-400">Profit</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Opened</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((t) => (
                      <TableRow key={t.id} className="border-slate-800">
                        <TableCell className="text-white">{t.botInstance.user.email}</TableCell>
                        <TableCell className="text-slate-300">{t.symbol}</TableCell>
                        <TableCell className="text-slate-300">{t.type}</TableCell>
                        <TableCell className="text-slate-300">{t.openPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-slate-300">{t.closePrice?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell
                          className={
                            t.profit != null ? (t.profit >= 0 ? "text-emerald-500" : "text-red-500") : "text-slate-500"
                          }
                        >
                          {t.profit != null ? `${t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.status === "OPEN" ? "default" : "secondary"} className="text-xs">
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">{formatDate(t.openTime)}</TableCell>
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
