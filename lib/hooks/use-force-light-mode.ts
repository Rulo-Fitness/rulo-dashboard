"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export function useForceLightMode() {
  const { setTheme, resolvedTheme } = useTheme()
  const prevTheme = useRef<string | undefined>(undefined)

  useEffect(() => {
    prevTheme.current = resolvedTheme
    setTheme("light")
    return () => {
      setTheme(prevTheme.current ?? "system")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
