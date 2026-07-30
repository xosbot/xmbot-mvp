import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { z } from "zod/v4"

export const dynamic = "force-dynamic"

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone } = profileSchema.parse(body)

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { name, phone: phone || null },
    })

    return NextResponse.json({ message: "Profile updated", user: { name: user.name, phone: user.phone } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: z.prettifyError(error) }, { status: 400 })
    }
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
