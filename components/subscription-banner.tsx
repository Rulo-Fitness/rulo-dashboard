"use client"

import { useSubscription } from "@/lib/hooks/use-subscription"

export function SubscriptionBanner({ onUpgrade }: { onUpgrade?: () => void }) {
  const { isActive } = useSubscription()

  if (isActive) return null

  return (
    <div className="mx-4 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-medium text-foreground">
        Tu suscripción expiró
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Podés ver tus datos pero no agregar ni editar. Reactivá tu plan para seguir trackeando.
      </p>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Reactivar plan
      </button>
    </div>
  )
}
