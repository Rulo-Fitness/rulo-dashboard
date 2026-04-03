"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/app")
  }, [router])

  return (
    <main className="flex min-h-[100lvh] items-center justify-center bg-background" aria-live="polite" aria-busy="true">
      <span className="text-4xl font-bold tracking-[0.3em] text-foreground animate-pulse select-none">
        RULO
      </span>
    </main>
  )
}
