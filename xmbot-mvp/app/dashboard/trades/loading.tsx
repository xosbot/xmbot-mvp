import { Topbar } from "@/components/dashboard/topbar"
import { TradesPageSkeleton } from "@/components/ui/skeleton"

export default function TradesLoading() {
  return (
    <>
      <Topbar title="Trade History" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <TradesPageSkeleton />
      </main>
    </>
  )
}
