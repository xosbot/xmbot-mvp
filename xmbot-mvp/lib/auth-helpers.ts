import { NextResponse } from "next/server"
import { auth } from "@/auth"

export type SessionUser = {
  id: string
  role: string
}

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403 }

async function checkRole(allowedRoles: string[]): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, status: 401 }
  }

  const role = (session.user as { role?: string }).role
  if (!role || !allowedRoles.includes(role)) {
    return { ok: false, status: 403 }
  }

  return { ok: true, user: { id: session.user.id, role } }
}

/** ADMIN and SUPERADMIN both pass — SUPERADMIN is a superset of ADMIN. */
export function requireAdmin(): Promise<AuthResult> {
  return checkRole(["ADMIN", "SUPERADMIN"])
}

/** Only SUPERADMIN passes — for engine-control surfaces regular admins shouldn't reach. */
export function requireSuperAdmin(): Promise<AuthResult> {
  return checkRole(["SUPERADMIN"])
}

export function forbiddenResponse(result: Extract<AuthResult, { ok: false }>) {
  return NextResponse.json(
    { error: result.status === 401 ? "Unauthorized" : "Forbidden" },
    { status: result.status }
  )
}
