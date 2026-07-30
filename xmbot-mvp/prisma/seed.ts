import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"
import { hash } from "bcryptjs"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "navigator.xm@gmail.com" },
    update: {},
    create: {
      email: "navigator.xm@gmail.com",
      name: "Navigator",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  })
  console.log("✅ Admin user created:", admin.email)

  // Create demo users
  const demoPassword = await hash("demo123", 10)
  const demoUsers = []
  const demoData = [
    { email: "trader1@demo.com", name: "Rajesh Kumar", isActive: true },
    { email: "trader2@demo.com", name: "Priya Sharma", isActive: true },
    { email: "trader3@demo.com", name: "Amit Patel", isActive: true },
    { email: "trader4@demo.com", name: "Sneha Reddy", isActive: false },
    { email: "trader5@demo.com", name: "Vikram Singh", isActive: false },
  ]

  for (const data of demoData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: demoPassword,
        role: "USER",
        isActive: data.isActive,
        phone: "+91" + Math.floor(7000000000 + Math.random() * 2999999999),
      },
    })
    demoUsers.push(user)
    console.log(`✅ Demo user: ${user.email} (${data.isActive ? "active" : "inactive"})`)
  }

  // Create bot instances for active users
  const activeUsers = [admin, ...demoUsers.filter((_, i) => demoData[i].isActive)]
  const botInstances = []

  for (const user of activeUsers) {
    const bot = await prisma.botInstance.create({
      data: {
        userId: user.id,
        status: "ACTIVE",
        broker: "XM",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    })
    botInstances.push(bot)
    console.log(`✅ Bot instance for ${user.email}`)
  }

  // Create expired bot for one inactive user
  if (demoUsers[3]) {
    await prisma.botInstance.create({
      data: {
        userId: demoUsers[3].id,
        status: "EXPIRED",
        broker: "XM",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    })
    console.log(`✅ Expired bot for ${demoUsers[3].email}`)
  }

  // Generate realistic XAUUSD trades
  console.log("📊 Generating trades...")
  const tradeTypes = ["BUY", "SELL"]
  const lotSizes = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5]

  for (const bot of botInstances) {
    const numTrades = 10 + Math.floor(Math.random() * 15) // 10-25 trades per bot

    for (let i = 0; i < numTrades; i++) {
      const type = tradeTypes[Math.floor(Math.random() * 2)]
      const lotSize = lotSizes[Math.floor(Math.random() * lotSizes.length)]
      const daysAgo = Math.floor(Math.random() * 30)
      const openTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      // Realistic gold prices (around 2000-2080 range)
      const basePrice = 2000 + Math.random() * 80
      const openPrice = Math.round(basePrice * 100) / 100

      // 65% win rate
      const isWin = Math.random() < 0.65
      const pipChange = (Math.random() * 5 + 0.5) * (isWin ? 1 : -1)
      const closePrice = Math.round((openPrice + (type === "BUY" ? pipChange : -pipChange)) * 100) / 100

      // Profit calculation: for XAUUSD, 1 lot = 100 oz, pip value ~$1 per 0.01 lot
      const priceDiff = type === "BUY" ? closePrice - openPrice : openPrice - closePrice
      const profit = Math.round(priceDiff * lotSize * 100 * 100) / 100

      const isClosed = Math.random() > 0.1 // 90% closed

      await prisma.trade.create({
        data: {
          botInstanceId: bot.id,
          symbol: "XAUUSD",
          type,
          openPrice,
          closePrice: isClosed ? closePrice : null,
          lotSize,
          profit: isClosed ? profit : null,
          openTime,
          closeTime: isClosed ? new Date(openTime.getTime() + Math.random() * 8 * 60 * 60 * 1000) : null,
          status: isClosed ? "CLOSED" : "OPEN",
        },
      })
    }
  }
  console.log("✅ Trades generated")

  // Create payment records
  const paymentData = [
    { user: admin, status: "SUCCESS" as const, plan: "beta", amount: 9999 },
    { user: demoUsers[0], status: "SUCCESS" as const, plan: "beta", amount: 9999 },
    { user: demoUsers[1], status: "SUCCESS" as const, plan: "beta", amount: 9999 },
    { user: demoUsers[2], status: "SUCCESS" as const, plan: "monthly", amount: 2999 },
    { user: demoUsers[3], status: "FAILED" as const, plan: "beta", amount: 9999 },
    { user: demoUsers[4], status: "PENDING" as const, plan: "beta", amount: 9999 },
  ]

  for (const pd of paymentData) {
    await prisma.payment.create({
      data: {
        userId: pd.user.id,
        cashfreeOrderId: `XMBOT_${pd.user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        amount: pd.amount,
        currency: "INR",
        status: pd.status,
        plan: pd.plan,
        cfPaymentId: pd.status === "SUCCESS" ? `cf_${Math.random().toString(36).slice(2, 12)}` : null,
        paymentMethod: pd.status === "SUCCESS" ? "UPI" : null,
      },
    })
    console.log(`✅ Payment for ${pd.user.email}: ${pd.status}`)
  }

  console.log("\n🎉 Seed complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
