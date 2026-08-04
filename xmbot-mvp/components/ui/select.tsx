"use client"

import { useId } from "react"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
  id?: string
}

export function Select({ value, onValueChange, children, disabled, id }: SelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      className="flex h-9 w-full rounded-md border border-input bg-secondary px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  )
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <>{children}</>
}

export function SelectValue() {
  return null
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
