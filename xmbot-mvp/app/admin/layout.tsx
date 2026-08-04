import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Role check — SUPERADMIN is a superset of ADMIN
  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
