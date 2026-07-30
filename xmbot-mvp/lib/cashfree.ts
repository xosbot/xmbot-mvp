import { Cashfree, CFEnvironment, type CreateOrderRequest } from "cashfree-pg"

function getCashfreeClient() {
  const env =
    process.env.CASHFREE_ENV === "PRODUCTION"
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX

  return new Cashfree(
    env,
    process.env.CASHFREE_APP_ID || "",
    process.env.CASHFREE_SECRET_KEY || ""
  )
}

export const cashfree = getCashfreeClient()

export const PLANS = {
  beta: { name: "Beta Access", amount: 9999, currency: "INR", label: "₹9,999", originalLabel: "₹19,999", discountLabel: "50% off", period: "/3 months", popular: false },
  monthly: { name: "Monthly", amount: 2999, currency: "INR", label: "₹2,999", period: "/month", popular: false },
  quarterly: { name: "Quarterly", amount: 7999, currency: "INR", label: "₹7,999", period: "/quarter", popular: true },
  yearly: { name: "Yearly", amount: 24999, currency: "INR", label: "₹24,999", period: "/year", popular: false },
} as const

export type PlanKey = keyof typeof PLANS

export function getExpiryDate(plan: string): Date {
  const now = new Date()
  switch (plan) {
    case "monthly":
      return new Date(now.setMonth(now.getMonth() + 1))
    case "quarterly":
      return new Date(now.setMonth(now.getMonth() + 3))
    case "yearly":
      return new Date(now.setFullYear(now.getFullYear() + 1))
    case "beta":
      return new Date(now.setMonth(now.getMonth() + 3))
    default:
      return new Date(now.setMonth(now.getMonth() + 1))
  }
}

export async function createCashfreeOrder({
  orderId,
  amount,
  currency,
  customerName,
  customerEmail,
  customerPhone,
  returnUrl,
  notifyUrl,
}: {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerEmail: string
  customerPhone: string
  returnUrl: string
  notifyUrl: string
}) {
  const request = {
    order_id: orderId,
    order_amount: amount,
    order_currency: currency,
    customer_details: {
      customer_id: orderId.split("_")[1] ?? "customer",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
    },
  }

  const response = await cashfree.PGCreateOrder(request as CreateOrderRequest)
  return response.data
}

export function verifyWebhookSignature(
  signature: string,
  rawBody: string,
  timestamp: string
) {
  try {
    cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp)
    return true
  } catch {
    return false
  }
}
