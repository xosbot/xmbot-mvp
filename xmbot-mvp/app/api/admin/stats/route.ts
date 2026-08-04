import { NextResponse } from "next/server"
import { requireAdmin, forbiddenResponse } from "@/lib/auth-helpers"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) {
      return forbiddenResponse(auth)
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
