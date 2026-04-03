"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const { updateUser } = useAuth()
  const [syncError, setSyncError] = useState("")

  const paymentId = useMemo(() => searchParams.get("payment_id"), [searchParams])

  useEffect(() => {
    if (!paymentId) return

    let cancelled = false

    fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return

        if (!res.ok || !data.success) {
          setSyncError("El pago se aprobó, pero todavía no pudimos sincronizar tu suscripción.")
          return
        }

        updateUser({
          subscription_active_until: data.result.subscription_active_until,
          current_plan: data.result.current_plan,
          trial_used: true,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setSyncError("El pago se aprobó, pero todavía no pudimos sincronizar tu suscripción.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [paymentId, updateUser])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ¡Pago exitoso!
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu suscripción a Rulo Fitness ya está activa. Empezá a trackear tus entrenos y comidas.
        </p>
        {syncError && (
          <p className="text-sm text-amber-600">
            {syncError}
          </p>
        )}
        <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
          <Link href="/app">Ir al dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
