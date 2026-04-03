import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckoutFailurePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-5xl">😕</div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          El pago no se pudo completar
        </h1>
        <p className="text-sm text-muted-foreground">
          Hubo un problema con el pago. Podés intentar de nuevo.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
            <Link href="/checkout">Reintentar</Link>
          </Button>
          <Button asChild variant="ghost" className="h-12 w-full rounded-full text-base">
            <Link href="/app">Volver al dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
