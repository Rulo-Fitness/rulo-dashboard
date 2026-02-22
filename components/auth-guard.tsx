"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

const SIGN_IN_PATH = "/sign-in"

function isAuthRoute(pathname: string) {
  return pathname === SIGN_IN_PATH || pathname.startsWith(`${SIGN_IN_PATH}/`) || pathname === "/sign-up"
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const onAuthRoute = isAuthRoute(pathname)

    if (!user && !onAuthRoute) {
      router.replace(SIGN_IN_PATH)
      return
    }

    if (user && onAuthRoute) {
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

  if (!user && !isAuthRoute(pathname)) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background" aria-live="polite" aria-busy="true">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando…</p>
      </main>
    )
  }

  return <>{children}</>
}
