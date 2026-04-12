"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function CheckoutSuccessPage() {
  const { user, updateUser } = useAuth()
  const [confirmed, setConfirmed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/subscription-status?user_id=${user.id}`)
        const data = await res.json()

        if (data.result?.subscription_active_until && new Date(data.result.subscription_active_until) > new Date()) {
          updateUser({
            subscription_active_until: data.result.subscription_active_until,
            current_plan: data.result.current_plan,
            trial_used: true,
          })
          setConfirmed(true)
          clearInterval(interval)
        }
      } catch {
        // Retry on next interval
      }
    }, 3000)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setTimedOut(true)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [user?.id, updateUser])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {confirmed ? (
          <>
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              ¡Pago exitoso!
            </h1>
            <p className="text-sm text-muted-foreground">
              Tu suscripción a Rulo Fitness ya está activa. Empezá a trackear tus entrenos y comidas.
            </p>
          </>
        ) : timedOut ? (
          <>
            <div className="text-5xl">⏳</div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Procesando tu pago
            </h1>
            <p className="text-sm text-muted-foreground">
              Tu pago fue recibido pero todavía estamos activando tu suscripción.
              Puede tardar unos minutos — si no se activa, contactanos.
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl animate-pulse">⏳</div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Activando tu suscripción...
            </h1>
            <p className="text-sm text-muted-foreground">
              Estamos confirmando tu pago con Mercado Pago. Esto tarda unos segundos.
            </p>
          </>
        )}
        <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
          <Link href="/app">Ir al dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
