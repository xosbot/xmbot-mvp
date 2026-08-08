export const PLANS = {
  beta: { name: "Beta Access", amount: 9999, currency: "INR", label: "₹9,999", period: "/3 months", popular: false },
  monthly: { name: "Monthly", amount: 2999, currency: "INR", label: "₹2,999", period: "/month", popular: false },
  quarterly: { name: "Quarterly", amount: 7999, currency: "INR", label: "₹7,999", period: "/quarter", popular: true },
  yearly: { name: "Yearly", amount: 24999, currency: "INR", label: "₹24,999", period: "/year", popular: false },
} as const

export type PlanKey = keyof typeof PLANS

export function getExpiryDate(plan: string): Date {
  const now = new Date()
  switch (plan) {
    case "monthly":
      now.setMonth(now.getMonth() + 1)
      break
    case "quarterly":
      now.setMonth(now.getMonth() + 3)
      break
    case "yearly":
      now.setFullYear(now.getFullYear() + 1)
      break
    case "beta":
      now.setMonth(now.getMonth() + 3)
      break
  }
  return now
}
