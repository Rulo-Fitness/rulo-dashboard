"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"

const SIGN_IN_PATH = "/sign-in"

function isPublicRoute(pathname: string) {
  return (
    pathname === SIGN_IN_PATH ||
    pathname.startsWith(`${SIGN_IN_PATH}/`) ||
    pathname === "/sign-up" ||
    pathname.startsWith("/checkout")
  )
}

function LoadingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background" aria-live="polite" aria-busy="true">
      <span className="text-4xl font-bold tracking-[0.3em] text-foreground animate-pulse select-none">
        RULO
      </span>
    </main>
  )
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const onAuthRoute = isPublicRoute(pathname)

    if (!user && !onAuthRoute) {
      router.replace(SIGN_IN_PATH)
      return
    }

    if (user && onAuthRoute) {
      router.replace("/")
      return
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) return <LoadingScreen />

  if (!user && !isPublicRoute(pathname)) return <LoadingScreen />

  return <>{children}</>
}
