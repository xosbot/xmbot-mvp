"use client"

import { useEffect, useCallback } from "react"

interface UseUnsavedChangesWarningProps {
  isDirty: boolean
  message?: string
}

export function useUnsavedChangesWarning({
  isDirty,
  message = "You have unsaved changes. Are you sure you want to leave?"
}: UseUnsavedChangesWarningProps) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = message
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty, message])

  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (isDirty) {
        const confirmed = window.confirm(message)
        if (confirmed) {
          callback()
        }
      } else {
        callback()
      }
    },
    [isDirty, message]
  )

  return { confirmNavigation }
}
