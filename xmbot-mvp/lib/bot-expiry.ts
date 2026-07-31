import { db } from "./db"

export async function enforceBotExpiry(userId: string): Promise<{ deactivated: boolean; expired: boolean }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      botInstances: {
        where: { status: "ACTIVE" },
        select: { id: true, expiryDate: true },
      },
    },
  })

  if (!user) return { deactivated: false, expired: false }

  const now = new Date()
  let deactivated = false

  for (const bot of user.botInstances) {
    if (bot.expiryDate && now > new Date(bot.expiryDate)) {
      await db.botInstance.update({
        where: { id: bot.id },
        data: { status: "EXPIRED" },
      })
      deactivated = true
    }
  }

  const hasActive = user.botInstances.some(
    (b) => !b.expiryDate || now <= new Date(b.expiryDate)
  )

  if (!hasActive && user.botInstances.length > 0) {
    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
  }

  return { deactivated, expired: !hasActive }
}
