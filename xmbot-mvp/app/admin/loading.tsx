import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AdminLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b border-slate-800 px-4 lg:px-6">
        <Skeleton className="h-6 w-32 bg-slate-800" />
      </div>
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white/[0.03] border-white/10 rounded-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 bg-slate-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-white/[0.03] border-white/10 rounded-md">
          <CardContent className="pt-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-slate-800" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
