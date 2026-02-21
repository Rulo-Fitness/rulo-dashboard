"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

const LOGIN_PATH = "/login"

function isLoginRoute(pathname: string) {
  return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const onLoginRoute = isLoginRoute(pathname)

    if (!user && !onLoginRoute) {
      router.replace(LOGIN_PATH)
      return
    }

    if (user && onLoginRoute) {
      router.replace("/")
      return
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background" aria-live="polite" aria-busy="true">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando…</p>
      </main>
    )
  }

  if (!user && !isLoginRoute(pathname)) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background" aria-live="polite" aria-busy="true">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando…</p>
      </main>
    )
  }

  return <>{children}</>
}
