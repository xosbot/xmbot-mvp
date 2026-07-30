import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Bot } from "lucide-react"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: { order_id?: string }
}) {
  const orderId = searchParams.order_id

  let status: "success" | "failed" | "pending" | "unknown" = "unknown"

  if (orderId) {
    const payment = await db.payment.findUnique({
      where: { cashfreeOrderId: orderId },
    })

    if (payment) {
      status = payment.status === "SUCCESS" ? "success" : payment.status === "FAILED" ? "failed" : "pending"
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        {status === "success" ? (
          <>
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Payment Successful!</CardTitle>
          </>
        ) : status === "failed" ? (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Payment Failed</CardTitle>
          </>
        ) : (
          <>
            <Bot className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Processing Payment</CardTitle>
          </>
        )}
      </CardHeader>
      <CardContent className="text-center">
        {status === "success" && (
          <p className="text-slate-400">
            Your account has been activated. Welcome to XMBot! Head to your dashboard to get started.
          </p>
        )}
        {status === "failed" && (
          <p className="text-slate-400">
            Something went wrong with your payment. Please try again or contact support.
          </p>
        )}
        {(status === "pending" || status === "unknown") && (
          <p className="text-slate-400">
            Your payment is being processed. This may take a few moments. Check your dashboard for updates.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/dashboard" className="w-full">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Go to Dashboard
          </Button>
        </Link>
        {status === "failed" && (
          <Link href="/checkout" className="w-full">
            <Button variant="outline" className="w-full">
              Try Again
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
