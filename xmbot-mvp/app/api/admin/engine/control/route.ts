import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin, forbiddenResponse } from "@/lib/auth-helpers"
import { proxyEngineRequest } from "@/lib/engine-client"

const VALID_ACTIONS = ["start", "stop", "restart", "pause", "resume"]

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return forbiddenResponse(auth)
  }

  let action: string | undefined
  try {
    const body = await req.clone().json()
    action = body?.action
  } catch {
    // no/invalid body — caught by the check below
  }

  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    )
  }

  return proxyEngineRequest(req, "POST", "/api/trading/control", auth.user.id)
}
