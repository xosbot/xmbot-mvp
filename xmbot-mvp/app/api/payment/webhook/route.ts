import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getExpiryDate } from "@/lib/cashfree"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ""

function verifyWebhookSignature(
  signature: string,
  rawBody: string,
  timestamp: string
): boolean {
  if (!CASHFREE_SECRET_KEY) {
    console.error("CASHFREE_SECRET_KEY not set — rejecting webhook")
    return false
  }

  try {
    const signedPayload = `${timestamp}${rawBody}`
    const expectedSignature = crypto
      .createHmac("sha256", CASHFREE_SECRET_KEY)
      .update(signedPayload)
      .digest("base64")

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error("Signature verification error:", error)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-webhook-signature") || ""
    const timestamp = req.headers.get("x-webhook-timestamp") || ""

    if (!verifyWebhookSignature(signature, rawBody, timestamp)) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const data = JSON.parse(rawBody)
    const orderId = data?.data?.order?.order_id
    const paymentStatus = data?.data?.payment?.payment_status
    const cfPaymentId = data?.data?.payment?.cf_payment_id?.toString()
    const paymentMethod = data?.data?.payment?.payment_group

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { cashfreeOrderId: orderId },
    })

    if (!payment) {
      console.error("Payment not found:", orderId)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ status: "ok" })
    }

    if (paymentStatus === "SUCCESS") {
      await db.payment.update({
        where: { cashfreeOrderId: orderId },
        data: {
          status: "SUCCESS",
          cfPaymentId,
          paymentMethod,
        },
      })

      await db.user.update({
        where: { id: payment.userId },
        data: { isActive: true },
      })

      const existingBot = await db.botInstance.findFirst({
        where: { userId: payment.userId },
      })

      if (existingBot) {
        await db.botInstance.update({
          where: { id: existingBot.id },
          data: {
            status: "ACTIVE",
            startDate: new Date(),
            expiryDate: getExpiryDate(payment.plan),
          },
        })
      } else {
        await db.botInstance.create({
          data: {
            userId: payment.userId,
            status: "ACTIVE",
            broker: "XM",
            startDate: new Date(),
            expiryDate: getExpiryDate(payment.plan),
          },
        })
      }
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      await db.payment.update({
        where: { cashfreeOrderId: orderId },
        data: {
          status: "FAILED",
          cfPaymentId,
        },
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
