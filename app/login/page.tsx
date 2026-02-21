"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

function useIsPwa() {
  const [isPwa, setIsPwa] = useState(false)
  useEffect(() => {
    const standalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true)
    setIsPwa(!!standalone)
  }, [])
  return isPwa
}

const COUNTRY_CODES = [
  { code: "+34", label: "ES", country: "España" },
  { code: "+52", label: "MX", country: "México" },
  { code: "+54", label: "AR", country: "Argentina" },
  { code: "+57", label: "CO", country: "Colombia" },
  { code: "+51", label: "PE", country: "Perú" },
  { code: "+56", label: "CL", country: "Chile" },
  { code: "+58", label: "VE", country: "Venezuela" },
  { code: "+593", label: "EC", country: "Ecuador" },
  { code: "+1", label: "US", country: "EE.UU." },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const isPwa = useIsPwa()
  const [countryCode, setCountryCode] = useState("+34")
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
      // No poner isSubmitting en false: la pantalla de carga sigue hasta que se monta el dashboard
    } else {
      setIsSubmitting(false)
      setError(result.error ?? "Error al iniciar sesión")
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col md:flex-row">
      {/* Pantalla de carga: entre login y dashboard */}
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

      {/* Left: form card. En mobile ocupa toda la altura (min-h-dvh); en desktop igual. */}
      <div className="flex min-h-dvh flex-1 flex-col justify-center px-4 py-10 md:min-h-dvh md:px-12 md:py-10 lg:px-20">
        <div className={cn("mx-auto w-full max-w-[400px]", isPwa && "select-none")}>
          <div className="mb-6 md:mb-10">
            <img src="/logo.png" alt="Rulo" className="h-12 w-12 rounded-xl md:h-14 md:w-14 md:rounded-2xl" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Ingresa tus datos para acceder a tu cuenta
          </p>

          <form onSubmit={handleSubmit} className={cn("mt-8 space-y-5", isPwa && "select-text")}>
            {error && (
              <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <div className="flex overflow-hidden rounded-lg border border-input bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="flex h-9 items-center border-0 bg-muted/50 px-3 text-sm font-medium text-foreground outline-none [&>option]:bg-card"
                  aria-label="Código de país"
                >
                  {COUNTRY_CODES.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {code} {label}
                    </option>
                  ))}
                </select>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="600 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  autoComplete="tel"
                  disabled={isSubmitting}
                  className="min-w-0 flex-1 rounded-none border-0 border-l bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/login/forgot"
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
                  className="pr-10"
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
              className={cn(
                "h-11 w-full bg-gradient-to-r from-[#2563eb] to-[#a855f7] text-base font-semibold text-white shadow-md",
                "hover:from-[#1d4ed8] hover:to-[#9333ea] hover:opacity-95",
              )}
            >
              {isSubmitting ? "Entrando…" : "Iniciar sesión"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className={cn("mt-6 text-center text-sm text-muted-foreground", isPwa && "select-none")}>
            ¿No tienes una cuenta?{" "}
            <Link href="/login/register" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      {/* Right: illustration / mascot panel (hidden on small screens). En PWA no seleccionable. */}
      <div
        className={cn(
          "relative hidden min-h-[280px] flex-1 overflow-hidden bg-gradient-to-br from-violet-200 via-fuchsia-100 to-amber-100 md:flex md:flex-col md:justify-center md:px-12 lg:px-20 dark:from-violet-950/40 dark:via-fuchsia-950/30 dark:to-amber-950/20",
          isPwa && "select-none",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,80,200,0.25),transparent)]" />
        <div className="relative flex flex-col items-center justify-center gap-6 py-12">
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-xl md:h-52 md:w-52">
            <img src="/logo.png" alt="" className="h-20 w-20 rounded-xl md:h-24 md:w-24" />
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-lg backdrop-blur dark:border-white/20 dark:bg-white/10">
            <p className="max-w-[260px] text-center text-sm font-medium text-slate-700 dark:text-slate-200">
              ¡Hola otra vez! Sigue tus entrenamientos y comidas. ¿Listo para retomarlo?
            </p>
            <span className="mt-2 block text-center text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
              Rulo Fitness
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
