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

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        botInstances: {
          select: {
            id: true,
            status: true,
            broker: true,
          },
        },
        payments: {
          where: { status: "SUCCESS" },
          select: {
            amount: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const usersWithStats = users.map((user) => ({
      ...user,
      totalSpent: user.payments.reduce((sum, p) => sum + p.amount, 0),
      activeBots: user.botInstances.filter((b) => b.status === "ACTIVE").length,
      payments: undefined,
    }))

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
