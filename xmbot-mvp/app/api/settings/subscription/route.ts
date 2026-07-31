import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { PLANS } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        isActive: true,
        botInstances: {
          select: {
            id: true,
            status: true,
            expiryDate: true,
            startDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            plan: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activeBot = user.botInstances[0]
    const currentPlan = activeBot?.status === "ACTIVE" ? activeBot : null

    let planDetails = null
    if (currentPlan?.expiryDate) {
      const now = new Date()
      const expiry = new Date(currentPlan.expiryDate)
      const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      planDetails = {
        planName: "Beta Access",
        status: currentPlan.status,
        startDate: currentPlan.startDate?.toISOString(),
        expiryDate: expiry.toISOString(),
        daysLeft,
        expired: now > expiry,
      }
    }

    return NextResponse.json({
      isActive: user.isActive,
      plan: planDetails,
      payments: user.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        plan: p.plan,
        date: p.createdAt.toISOString(),
        planLabel: PLANS[p.plan as keyof typeof PLANS]?.label ?? p.plan,
      })),
    })
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
