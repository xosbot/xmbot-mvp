"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Filter, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const SYMBOLS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"]
const TYPES = ["BUY", "SELL"]
const STATUSES = ["OPEN", "CLOSED"]

interface TradeFiltersProps {
  currentSymbol?: string
  currentType?: string
  currentStatus?: string
}

export function TradeFilters({ currentSymbol, currentType, currentStatus }: TradeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/dashboard/trades?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("symbol")
    params.delete("type")
    params.delete("status")
    params.delete("page")
    router.push(`/dashboard/trades?${params.toString()}`)
  }

  const hasFilters = currentSymbol || currentType || currentStatus
  const activeFilterCount = [currentSymbol, currentType, currentStatus].filter(Boolean).length

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Filter className="h-3 w-3" />
        Filters
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-300">
            Symbol
            {currentSymbol && <Badge variant="secondary" className="ml-1 h-4 px-1">{currentSymbol}</Badge>}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700">
          <DropdownMenuLabel className="text-xs text-slate-400">Filter by Symbol</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />
          {SYMBOLS.map((symbol) => (
            <DropdownMenuCheckboxItem
              key={symbol}
              checked={currentSymbol === symbol}
              onCheckedChange={() => updateFilter("symbol", currentSymbol === symbol ? null : symbol)}
              className="text-xs text-slate-300 focus:bg-slate-800"
            >
              {symbol}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-300">
            Type
            {currentType && <Badge variant="secondary" className="ml-1 h-4 px-1">{currentType}</Badge>}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700">
          <DropdownMenuLabel className="text-xs text-slate-400">Filter by Type</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />
          {TYPES.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={currentType === type}
              onCheckedChange={() => updateFilter("type", currentType === type ? null : type)}
              className="text-xs text-slate-300 focus:bg-slate-800"
            >
              {type}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-300">
            Status
            {currentStatus && <Badge variant="secondary" className="ml-1 h-4 px-1">{currentStatus}</Badge>}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700">
          <DropdownMenuLabel className="text-xs text-slate-400">Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />
          {STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={currentStatus === status}
              onCheckedChange={() => updateFilter("status", currentStatus === status ? null : status)}
              className="text-xs text-slate-300 focus:bg-slate-800"
            >
              {status}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-slate-400 hover:text-white"
          onClick={clearFilters}
        >
          <X className="h-3 w-3 mr-1" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  )
}
