import { Cashfree, CFEnvironment, type CreateOrderRequest } from "cashfree-pg"

export { PLANS, getExpiryDate } from "./plans"
export type { PlanKey } from "./plans"

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
