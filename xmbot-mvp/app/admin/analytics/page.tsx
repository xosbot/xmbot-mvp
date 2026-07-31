"use client"

import { useState, useEffect } from "react"
import { AdminMobileSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { UserGrowthChart } from "@/components/admin/user-growth-chart"
import { Users, Bot, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AnalyticsData {
  revenueData: Array<{ month: string; label: string; revenue: number }>
  userData: Array<{ month: string; label: string; count: number }>
  mrr: number
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalRevenue = data?.revenueData.reduce((s, d) => s + d.revenue, 0) ?? 0
  const totalUsers = data?.userData.reduce((s, d) => s + d.count, 0) ?? 0

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6">
        <AdminMobileSidebar />
        <h1 className="text-lg font-semibold text-white">Analytics</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Revenue (6mo)" value={formatCurrency(totalRevenue)} icon={DollarSign} />
              <StatCard title="MRR" value={formatCurrency(data.mrr)} icon={TrendingUp} />
              <StatCard title="New Users (6mo)" value={String(totalUsers)} icon={Users} />
              <StatCard title="Avg Revenue/User" value={totalUsers > 0 ? formatCurrency(Math.round(totalRevenue / totalUsers)) : "₹0"} icon={Bot} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueChart data={data.revenueData} />
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserGrowthChart data={data.userData} />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-center text-slate-500 py-20">Failed to load analytics.</p>
        )}
      </main>
    </>
  )
}
