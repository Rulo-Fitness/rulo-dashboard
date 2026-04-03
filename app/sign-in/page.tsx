"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/phone-input"
import { Eye, EyeOff, ChevronRight } from "lucide-react"
import { useForceLightMode } from "@/lib/hooks/use-force-light-mode"
import { useDefaultSpanishLocale } from "@/lib/hooks/use-default-spanish-locale"

export default function SignInPage() {
  const router = useRouter()
  const { login } = useAuth()
  useForceLightMode()
  useDefaultSpanishLocale()

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
      router.replace("/app")
      router.refresh()
    } else {
      setIsSubmitting(false)
      setError(result.error ?? "Error al iniciar sesión")
    }
  }

  return (
    <main
      className="relative flex h-[100lvh] min-h-[100lvh] flex-col overflow-hidden overflow-x-hidden text-foreground md:min-h-dvh md:h-auto md:flex-row"
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/login-bg.webp)" }}
        aria-hidden
      />

      {isSubmitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="text-4xl font-bold tracking-[0.3em] text-foreground animate-pulse select-none">
            RULO
          </span>
        </div>
      )}

      {/* Mobile: mascot + bubble */}
      <div
        className="relative z-20 flex min-h-0 flex-shrink-0 items-end justify-center pb-0 pt-10 md:hidden"
      >
        <div className="flex items-end justify-center gap-0 px-4">
          <div className="relative z-20 flex shrink-0 translate-y-5 animate-float-soft">
            <img src="/rulo-mascot.webp" alt="Rulo" className="h-24 w-auto object-contain" />
          </div>
          <div className="relative -ml-1 -translate-y-7 rounded-[28px] rounded-bl-lg border border-border bg-card px-4 py-3 shadow-sm">
            <p className="max-w-[210px] text-left text-[13px] font-medium leading-5 text-foreground">
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
      <div
        className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden px-0 pt-1 md:mt-0 md:min-h-dvh md:w-[48%] md:max-w-[760px] md:flex-none md:px-3 md:pt-3 md:pb-0 md:pr-0 lg:w-[46%] lg:px-4 lg:pt-4 lg:pb-0 lg:pr-0"
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-hidden overflow-x-hidden rounded-t-[2rem] rounded-b-none border border-border bg-card px-5 py-7 shadow-xl md:overflow-y-auto md:rounded-t-[2rem] md:rounded-b-none md:px-9 md:py-10 lg:px-10"
          style={{ touchAction: "pan-y" }}
        >
          <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center md:max-w-[420px] md:justify-center">
            <h1 className="text-center text-[2rem] font-bold tracking-tight text-foreground md:text-[2.35rem]">
              Bienvenido de nuevo
            </h1>
            <p className="mt-4 text-center text-sm leading-6 text-muted-foreground md:mt-5 md:text-[15px]">
              Ingresa tus datos para acceder a Rulo Dashboard
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-8 md:mt-12 md:space-y-9">
              {error && (
                <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="space-y-3.5">
                <PhoneInput
                  id="phone"
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  phoneNumber={phoneNumber}
                  onPhoneNumberChange={setPhoneNumber}
                  disabled={isSubmitting}
                  lockedCountryCode
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="space-y-3.5">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="h-12 rounded-2xl border-border/60 text-base shadow-xs focus-visible:border-white focus-visible:ring-[1.5px] focus-visible:ring-white/80 md:h-[52px] md:rounded-2xl"
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
                <div className="flex justify-end">
                  <Link
                    href="/sign-in/forgot"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full max-w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 md:h-[54px] md:rounded-full"
              >
                {isSubmitting ? "Entrando…" : "Iniciar sesión"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground md:mt-7">
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
        className="relative z-10 hidden min-h-[280px] flex-1 md:flex md:min-w-0 md:flex-col md:justify-center md:px-10 lg:px-16 xl:px-20"
      >
        <div className="relative flex flex-col items-center justify-center gap-5 py-10 lg:gap-6 lg:py-12">
          <div className="relative rounded-[30px] rounded-b-lg border border-border bg-card px-5 py-4 shadow-lg md:px-6 md:py-5">
            <p className="max-w-[280px] text-left text-[15px] font-medium leading-6 text-foreground md:max-w-[320px] md:text-base">
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
              className="h-56 w-auto object-contain md:h-72 lg:h-[20rem] xl:h-[22rem]"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
