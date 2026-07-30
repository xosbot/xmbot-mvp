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

export default async function AdminBotsPage() {
  const bots = await db.botInstance.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { trades: true } },
    },
  })

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Bot Instances</h1>
        <span className="text-sm text-slate-500 ml-2">({bots.length} total)</span>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Bot Instances</CardTitle>
          </CardHeader>
          <CardContent>
            {bots.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No bot instances yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Broker</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Trades</TableHead>
                      <TableHead className="text-slate-400">Start Date</TableHead>
                      <TableHead className="text-slate-400">Expiry</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bots.map((bot) => (
                      <TableRow key={bot.id} className="border-slate-800">
                        <TableCell className="text-white">{bot.user.email}</TableCell>
                        <TableCell className="text-slate-300">{bot.broker}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              bot.status === "ACTIVE" ? "default" :
                              bot.status === "EXPIRED" ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {bot.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{bot._count.trades}</TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {bot.startDate ? formatDate(bot.startDate) : "—"}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {bot.expiryDate ? formatDate(bot.expiryDate) : "—"}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {formatDate(bot.createdAt)}
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
