"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
      <p className="mt-2 text-muted-foreground">
        El registro estará disponible pronto. Mientras tanto, usa el login con tu teléfono.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/login">Volver al inicio de sesión</Link>
      </Button>
    </main>
  )
}
