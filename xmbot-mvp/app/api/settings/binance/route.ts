import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { encrypt, decrypt, maskKey } from "@/lib/crypto"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const BINANCE_API = "https://api.binance.com"

interface BinanceAccountResponse {
  balances?: Array<{ asset: string; free: string; locked: string }>
  totalWalletBalance?: string
  totalMarginBalance?: string
}

function sign(params: Record<string, string>, secret: string): string {
  const query = new URLSearchParams(params).toString()
  return crypto.createHmac("sha256", secret).update(query).digest("hex")
}

async function testBinanceKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ valid: boolean; balance?: number; error?: string }> {
  try {
    const timestamp = Date.now().toString()
    const params: Record<string, string> = { timestamp }
    params.signature = sign(params, apiSecret)

    const res = await fetch(
      `${BINANCE_API}/api/v3/account?${new URLSearchParams(params)}`,
      { headers: { "X-MBX-APIKEY": apiKey } }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { valid: false, error: err.msg || `HTTP ${res.status}` }
    }

    const data: BinanceAccountResponse = await res.json()
    const usdt = data.balances?.find((b) => b.asset === "USDT")
    const balance = usdt ? parseFloat(usdt.free) : 0

    return { valid: true, balance }
  } catch (e: any) {
    return { valid: false, error: e.message || "Connection failed" }
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        binanceApiKeyEncrypted: true,
        binanceApiSecretEncrypted: true,
        binanceConnectedAt: true,
      },
    })

    if (!user?.binanceApiKeyEncrypted) {
      return NextResponse.json({ connected: false })
    }

    const apiKey = decrypt(user.binanceApiKeyEncrypted)
    const apiSecret = decrypt(user.binanceApiSecretEncrypted!)

    const test = await testBinanceKeys(apiKey, apiSecret)

    if (!test.valid) {
      return NextResponse.json({
        connected: false,
        error: test.error,
      })
    }

    return NextResponse.json({
      connected: true,
      maskedKey: maskKey(apiKey),
      balance: test.balance,
      connectedAt: user.binanceConnectedAt?.toISOString(),
    })
  } catch (error) {
    console.error("Binance status error:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiKey, apiSecret } = await req.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "API Key and Secret are required" },
        { status: 400 }
      )
    }

    if (apiKey.length < 10 || apiSecret.length < 10) {
      return NextResponse.json(
        { error: "Invalid API Key or Secret format" },
        { status: 400 }
      )
    }

    const test = await testBinanceKeys(apiKey, apiSecret)
    if (!test.valid) {
      return NextResponse.json(
        { error: `Invalid API keys: ${test.error}` },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        binanceApiKeyEncrypted: encrypt(apiKey),
        binanceApiSecretEncrypted: encrypt(apiSecret),
        binanceConnectedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      maskedKey: maskKey(apiKey),
      balance: test.balance,
    })
  } catch (error) {
    console.error("Binance save error:", error)
    return NextResponse.json({ error: "Failed to save keys" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        binanceApiKeyEncrypted: null,
        binanceApiSecretEncrypted: null,
        binanceConnectedAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Binance disconnect error:", error)
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}
