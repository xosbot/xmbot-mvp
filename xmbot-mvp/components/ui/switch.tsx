"use client"

import { useId } from "react"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-emerald-600" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-all ${
            checked ? "ml-[18px]" : "ml-[3px]"
          }`}
        />
    </label>
  )
}
