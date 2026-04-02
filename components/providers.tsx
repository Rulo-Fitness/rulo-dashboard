"use client"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { I18nProvider } from "@/lib/i18n"
import { AuthProvider } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((error) => {
        console.error("Failed to unregister service workers:", error)
      })
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
