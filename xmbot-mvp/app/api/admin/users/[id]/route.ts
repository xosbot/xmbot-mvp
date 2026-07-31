import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive
    if (typeof body.role === "string") updateData.role = body.role

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, isActive: true, role: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
