"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function TrialActivatedPage() {
  const { user } = useAuth()

  const trialEnd = user?.subscription_active_until
    ? new Date(user.subscription_active_until).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-5xl">🚀</div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ¡Listo! Tenés 7 días gratis
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu prueba gratuita de Rulo está activa. Aprovechá para trackear tus
          entrenos y comidas sin límites.
        </p>
        {trialEnd && (
          <p className="text-xs text-muted-foreground">
            Tu prueba vence el <span className="font-semibold text-foreground">{trialEnd}</span>
          </p>
        )}
        <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
          <Link href="/app">Ir al dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
