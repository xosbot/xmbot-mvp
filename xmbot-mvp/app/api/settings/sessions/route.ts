import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

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

    const cookieStore = await cookies()
    const currentToken = cookieStore.get("next-auth.session-token")?.value
      ?? cookieStore.get("__Secure-next-auth.session-token")?.value

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        expires: s.expires.toISOString(),
        isCurrent: currentToken ? s.sessionToken === currentToken : false,
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
      await db.session.deleteMany({
        where: {
          id: sessionId,
          userId: session.user.id,
        },
      })
    } else {
      const cookieStore = await cookies()
      const currentToken = cookieStore.get("next-auth.session-token")?.value
        ?? cookieStore.get("__Secure-next-auth.session-token")?.value

      if (currentToken) {
        await db.session.deleteMany({
          where: {
            userId: session.user.id,
            sessionToken: { not: currentToken },
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session delete error:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
