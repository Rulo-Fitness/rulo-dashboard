"use client"

import { useEffect } from "react"
import { useI18n } from "@/lib/i18n"

export function useDefaultSpanishLocale() {
  const { setLocale } = useI18n()

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedLocale = localStorage.getItem("fittrack-locale")
    if (!savedLocale) {
      setLocale("es")
    }
  }, [setLocale])
}
