"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-background px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>
      <p className="mt-2 text-muted-foreground">
        Esta función estará disponible pronto. Contacta con soporte si necesitas ayuda.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/sign-in">Volver al inicio de sesión</Link>
      </Button>
    </main>
  )
}
