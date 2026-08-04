import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SuperAdminEngineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as { role?: string }).role
  if (role !== "SUPERADMIN") {
    redirect("/admin")
  }

  return <>{children}</>
}
