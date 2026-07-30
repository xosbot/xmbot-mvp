import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { z } from "zod/v4"

export const dynamic = "force-dynamic"

const telegramSchema = z.object({
  telegramChatId: z.string().min(1, "Chat ID is required"),
})

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { telegramChatId } = telegramSchema.parse(body)

    await db.user.update({
      where: { id: session.user.id },
      data: { telegramChatId },
    })

    return NextResponse.json({
      message: "Telegram linked successfully",
      telegramChatId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: z.prettifyError(error) }, { status: 400 })
    }
    console.error("Telegram link error:", error)
    return NextResponse.json({ error: "Failed to link Telegram" }, { status: 500 })
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
      data: { telegramChatId: null },
    })

    return NextResponse.json({ message: "Telegram unlinked" })
  } catch (error) {
    console.error("Telegram unlink error:", error)
    return NextResponse.json({ error: "Failed to unlink Telegram" }, { status: 500 })
  }
}
