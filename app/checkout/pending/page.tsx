import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckoutPendingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-5xl">⏳</div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pago pendiente
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>
        <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
          <Link href="/app">Ir al dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
