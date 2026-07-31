import { Topbar } from "@/components/dashboard/topbar"
import { DashboardSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <DashboardSkeleton />
      </main>
    </>
  )
}
