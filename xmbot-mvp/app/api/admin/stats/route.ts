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

    const [totalUsers, activeSubscriptions, pendingUsers, payments] = await Promise.all([
      db.user.count(),
      db.botInstance.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { isActive: false } }),
      db.payment.findMany({ where: { status: "SUCCESS" } }),
    ])

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      pendingUsers,
      totalRevenue,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
