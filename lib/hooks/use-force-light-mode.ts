"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function useForceLightMode() {
  const { setTheme } = useTheme()

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedTheme = localStorage.getItem("theme")
    if (!savedTheme) {
      setTheme("light")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
