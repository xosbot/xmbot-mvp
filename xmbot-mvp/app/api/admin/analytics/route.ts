import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const payments = await db.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    })

    const revenueByMonth: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      revenueByMonth[key] = 0
    }

    payments.forEach((p) => {
      const d = new Date(p.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (key in revenueByMonth) {
        revenueByMonth[key] += p.amount
      }
    })

    const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
    }))

    // User registrations by month (last 6 months)
    const users = await db.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })

    const usersByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      usersByMonth[key] = 0
    }

    users.forEach((u) => {
      const d = new Date(u.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (key in usersByMonth) {
        usersByMonth[key]++
      }
    })

    const userData = Object.entries(usersByMonth).map(([month, count]) => ({
      month,
      count,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
    }))

    // MRR (Monthly Recurring Revenue)
    const activePayments = await db.botInstance.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          select: {
            payments: {
              where: { status: "SUCCESS" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { amount: true, plan: true },
            },
          },
        },
      },
    })

    let mrr = 0
    activePayments.forEach((bot) => {
      const lastPayment = bot.user.payments[0]
      if (lastPayment) {
        // Normalize to monthly
        switch (lastPayment.plan) {
          case "monthly": mrr += lastPayment.amount; break
          case "quarterly": mrr += lastPayment.amount / 3; break
          case "yearly": mrr += lastPayment.amount / 12; break
          case "beta": mrr += lastPayment.amount / 3; break
        }
      }
    })

    return NextResponse.json({ revenueData, userData, mrr: Math.round(mrr) })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
