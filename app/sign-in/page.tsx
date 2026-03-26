"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/phone-input"
import { Eye, EyeOff, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { useForceLightMode } from "@/lib/hooks/use-force-light-mode"

export default function SignInPage() {
  const router = useRouter()
  const { login } = useAuth()
  useForceLightMode()

  const [countryCode, setCountryCode] = useState("+54")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, "")}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    const result = await login(fullPhone, password)
    if (result.ok) {
      router.replace("/")
      router.refresh()
    } else {
      setIsSubmitting(false)
      setError(result.error ?? "Error al iniciar sesión")
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col text-foreground md:flex-row">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/login-bg.webp)" }}
        aria-hidden
      />

      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Entrando…</p>
        </div>
      )}

      {/* Mobile: mascot + bubble */}
      <div
        className="relative z-10 flex min-h-0 flex-shrink-0 items-end justify-start pb-0 pt-16 md:hidden"
      >
        <div className="-mt-4 flex items-end gap-0 pl-2 pr-4">
          <div className="flex shrink-0 animate-float">
            <img src="/rulo-mascot.webp" alt="Rulo" className="h-28 w-auto object-contain" />
          </div>
          <div className="relative -ml-1 rounded-3xl rounded-bl-lg border border-border bg-card px-4 py-3 shadow-sm">
            <p className="max-w-[200px] text-left text-sm font-medium text-foreground">
              ¡Hola otra vez! Sigue tus entrenamientos y comidas. ¿Listo para retomarlo?
            </p>
            <div
              className="absolute left-0 top-1/2 h-0 w-0 -translate-y-1/2 -translate-x-full border-t-[10px] border-b-[10px] border-r-[12px] border-t-transparent border-b-transparent"
              style={{ borderRightColor: "var(--card)" }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="relative z-10 mt-2 flex min-h-0 flex-1 flex-col px-0 pt-2 md:mt-0 md:min-h-dvh md:w-[50%] md:flex-none md:px-3 md:pt-3 md:pb-0 md:pr-0 lg:px-4 lg:pt-4 lg:pb-0 lg:pr-0">
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-t-[2rem] rounded-b-none border border-border bg-card px-4 py-6 shadow-xl md:rounded-t-3xl md:rounded-b-none md:px-8 md:py-9"
        >
          <div className="mx-auto w-full max-w-[340px] md:max-w-[400px]">
            <h1 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-8 text-center text-sm text-muted-foreground md:text-base">
              Ingresa tus datos para acceder a tu cuenta
            </p>

            <form onSubmit={handleSubmit} className="mt-16 space-y-[3.25rem]">
              {error && (
                <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="space-y-5">
                <Label htmlFor="phone">Número de teléfono</Label>
                <PhoneInput
                  id="phone"
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  phoneNumber={phoneNumber}
                  onPhoneNumberChange={setPhoneNumber}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/sign-in/forgot"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="h-12 rounded-2xl border-border/60 text-base md:rounded-xl md:border-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full max-w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 md:h-14 md:rounded-3xl"
              >
                {isSubmitting ? "Entrando…" : "Iniciar sesión"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link href="/sign-up" className="font-medium text-primary hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop: mascot right side */}
      <div
        className="relative z-10 hidden min-h-[280px] flex-1 md:flex md:min-w-0 md:flex-col md:justify-center md:px-12 lg:px-20"
      >
        <div className="relative flex flex-col items-center justify-center gap-4 py-12">
          <div className="relative rounded-3xl rounded-b-lg border border-border bg-card px-5 py-4 shadow-lg md:px-6 md:py-5">
            <p className="max-w-[260px] text-left text-sm font-medium text-foreground md:max-w-[280px] md:text-base">
              ¡Hola otra vez! Sigue tus entrenamientos y comidas. ¿Listo para retomarlo?
            </p>
            <div
              className="absolute -bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[14px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: "var(--card)" }}
              aria-hidden
            />
          </div>
          <div className="flex w-full flex-1 items-center justify-center animate-float">
            <img
              src="/rulo-mascot.webp"
              alt="Rulo"
              className="h-52 w-auto object-contain md:h-64 lg:h-72"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
