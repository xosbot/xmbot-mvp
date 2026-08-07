import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-20 mt-2" />
      <Skeleton className="h-3 w-32 mt-2" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}

export function TradeRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-12" />
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export function TradesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <TradeRowSkeleton />
        <TradeRowSkeleton />
        <TradeRowSkeleton />
        <TradeRowSkeleton />
        <TradeRowSkeleton />
      </div>
    </div>
  )
}
