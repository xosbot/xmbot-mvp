import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin, forbiddenResponse } from "@/lib/auth-helpers"
import { proxyEngineRequest } from "@/lib/engine-client"

async function handle(
  req: NextRequest,
  method: string,
  path: string[] | undefined,
  fallback: string
): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return forbiddenResponse(auth)
  }

  const pathStr = "/" + (path?.join("/") || fallback)
  return proxyEngineRequest(req, method, pathStr, auth.user.id)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(req, "GET", path, "health")
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(req, "POST", path, "")
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(req, "PUT", path, "")
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handle(req, "DELETE", path, "")
}
