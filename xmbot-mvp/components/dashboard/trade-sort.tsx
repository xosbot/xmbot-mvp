"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown } from "lucide-react"

const SORT_OPTIONS = [
  { value: "openTime-desc", label: "Newest First" },
  { value: "openTime-asc", label: "Oldest First" },
  { value: "profit-desc", label: "Highest P&L" },
  { value: "profit-asc", label: "Lowest P&L" },
  { value: "symbol-asc", label: "Symbol A-Z" },
  { value: "symbol-desc", label: "Symbol Z-A" },
]

interface TradeSortProps {
  currentSort?: string
}

export function TradeSort({ currentSort }: TradeSortProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "openTime-desc") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    params.delete("page")
    router.push(`/dashboard/trades?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      <select
        value={currentSort || "openTime-desc"}
        onChange={(e) => handleSort(e.target.value)}
        className="flex h-7 w-[140px] rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
