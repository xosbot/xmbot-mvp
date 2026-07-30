import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { createCashfreeOrder, PLANS, type PlanKey } from "@/lib/cashfree"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const plan = (body.plan as PlanKey) || "beta"

    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const { amount, currency } = PLANS[plan]
    const orderId = `XMBOT_${session.user.id}_${Date.now()}`

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create CashFree order
    const orderData = await createCashfreeOrder({
      orderId,
      amount,
      currency,
      customerName: user.name || "Customer",
      customerEmail: user.email,
      customerPhone: user.phone || "9999999999",
      returnUrl: `${appUrl}/payment/status?order_id=${orderId}`,
      notifyUrl: `${appUrl}/api/payment/webhook`,
    })

    // Save payment record
    await db.payment.create({
      data: {
        userId: session.user.id,
        cashfreeOrderId: orderId,
        amount,
        currency,
        plan,
        status: "PENDING",
      },
    })

    return NextResponse.json({
      orderId,
      paymentSessionId: orderData?.payment_session_id,
      orderData,
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
