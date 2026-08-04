import { NextResponse } from "next/server"
import { requireAdmin, forbiddenResponse } from "@/lib/auth-helpers"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) {
      return forbiddenResponse(auth)
    }

    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (typeof body.status === "string") updateData.status = body.status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 })
    }

    const bot = await db.botInstance.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Admin bot update error:", error)
    return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
  }
}
