import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await db.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: "desc" },
      select: {
        id: true,
        sessionToken: true,
        expires: true,
      },
    })

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        expires: s.expires.toISOString(),
        isCurrent: s.sessionToken === session.sessionToken,
      })),
    })
  } catch (error) {
    console.error("Sessions fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await req.json()

    if (sessionId) {
      // Delete specific session
      await db.session.deleteMany({
        where: {
          id: sessionId,
          userId: session.user.id,
        },
      })
    } else {
      // Delete all other sessions
      await db.session.deleteMany({
        where: {
          userId: session.user.id,
          sessionToken: { not: session.sessionToken },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session delete error:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
