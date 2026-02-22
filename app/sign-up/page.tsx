"use client"

import { useState, useRef, useCallback, useEffect } from "react"

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
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { saveProfile } from "@/lib/storage"
import type { UserProfile, Sex, ActivityLevel, Goal } from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Weight,
  Ruler,
  Activity,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COUNTRY_CODES = [
  { code: "+34", label: "ES", country: "España", flag: "🇪🇸" },
  { code: "+52", label: "MX", country: "México", flag: "🇲🇽" },
  { code: "+54", label: "AR", country: "Argentina", flag: "🇦🇷" },
  { code: "+57", label: "CO", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", label: "PE", country: "Perú", flag: "🇵🇪" },
  { code: "+56", label: "CL", country: "Chile", flag: "🇨🇱" },
  { code: "+58", label: "VE", country: "Venezuela", flag: "🇻🇪" },
  { code: "+593", label: "EC", country: "Ecuador", flag: "🇪🇨" },
  { code: "+1", label: "US", country: "EE.UU.", flag: "🇺🇸" },
]

type OpenField =
  | "age"
  | "sex"
  | "weight"
  | "height"
  | "activityLevel"
  | "goal"
  | "weeklyRateKg"
  | null

const STEPS = 4

const ACTIVITY_OPTIONS: { id: ActivityLevel; labelKey: "register.sedentary" | "register.light" | "register.moderate" | "register.high" | "register.veryHigh" }[] = [
  { id: "sedentary", labelKey: "register.sedentary" },
  { id: "light", labelKey: "register.light" },
  { id: "moderate", labelKey: "register.moderate" },
  { id: "high", labelKey: "register.high" },
  { id: "very_high", labelKey: "register.veryHigh" },
]

const GOAL_OPTIONS: { id: Goal; labelKey: "register.loseFat" | "register.maintain" | "register.gainMass" }[] = [
  { id: "lose_fat", labelKey: "register.loseFat" },
  { id: "maintain", labelKey: "register.maintain" },
  { id: "gain_mass", labelKey: "register.gainMass" },
]

const WEEKLY_RATE_OPTIONS = [0.25, 0.5, 0.75, 1] as const

type RegisterProfile = Omit<UserProfile, "activityLevel" | "sex" | "goal"> & {
  activityLevel: ActivityLevel | ""
  sex: Sex | ""
  goal: Goal | ""
}

const defaultForm: RegisterProfile = {
  name: "",
  age: 0,
  sex: "",
  weight: 0,
  height: 0,
  activityLevel: "",
  goal: "",
  weeklyRateKg: 0,
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
}

function FieldRow({
  icon: Icon,
  label,
  value,
  emptyLabel,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  emptyLabel: string
  onClick: () => void
}) {
  const isEmpty = !value
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl bg-card px-5 py-5 text-left transition-colors active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{label}</span>
      <span className={cn("text-sm", isEmpty ? "text-muted-foreground" : "text-foreground")}>
        {value || emptyLabel}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
    </button>
  )
}

export default function SignUpPage() {
  const { t } = useI18n()
  const { register: registerApi } = useAuth()
  const isPwa = useIsPwa()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<RegisterProfile>({ ...defaultForm })
  const [done, setDone] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [openField, setOpenField] = useState<OpenField>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [triedNext, setTriedNext] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward")
  const [modalError, setModalError] = useState<string | null>(null)
  const [errorShake, setErrorShake] = useState(false)
  const [hasTouchedCurrentField, setHasTouchedCurrentField] = useState(false)
  const [countryCode, setCountryCode] = useState("+54")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [registerError, setRegisterError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeModal = useCallback(() => {
    if (!openField) return
    setIsClosing(true)
    closeTimeoutRef.current = setTimeout(() => {
      setOpenField(null)
      setIsClosing(false)
      closeTimeoutRef.current = null
    }, 300)
  }, [openField])

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
  }, [])

  useEffect(() => {
    setModalError(null)
    setErrorShake(false)
    setHasTouchedCurrentField(false)
  }, [openField])

  useEffect(() => {
    if (!errorShake) return
    shakeTimeoutRef.current = setTimeout(() => {
      setErrorShake(false)
      shakeTimeoutRef.current = null
    }, 400)
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
    }
  }, [errorShake])

  function update<K extends keyof RegisterProfile>(key: K, value: RegisterProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
    if (key === openField) {
      setModalError(null)
      if (key === "age" || key === "weight" || key === "height" || key === "weeklyRateKg") setHasTouchedCurrentField(true)
    }
  }

  function handleNext() {
    if (!canNext) {
      setTriedNext(true)
      return
    }
    setTriedNext(false)
    setSlideDirection("forward")
    if (step < STEPS) setStep((s) => s + 1)
    else {
      setShowCreateAccount(true)
    }
  }

  function handleBack() {
    if (showCreateAccount) {
      setShowCreateAccount(false)
      setRegisterError("")
    } else if (step > 1) {
      setTriedNext(false)
      setSlideDirection("backward")
      setStep((s) => s - 1)
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setRegisterError("")
    const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, "").replace(/\D/g, "")}`
    if (fullPhone.replace(/\D/g, "").length < 9) {
      setRegisterError(t("register.createAccountInvalidPhone"))
      return
    }
    if (password.length < 4) {
      setRegisterError(t("register.createAccountPasswordShort"))
      return
    }
    if (password !== confirmPassword) {
      setRegisterError(t("register.createAccountPasswordMismatch"))
      return
    }
    setIsSubmitting(true)
    const result = await registerApi(fullPhone, password, profile.name || undefined)
    setIsSubmitting(false)
    if (!result.ok) {
      setRegisterError(result.error ?? t("register.createAccountError"))
      return
    }
    saveProfile({
      ...profile,
      sex: profile.sex as Sex,
      activityLevel: profile.activityLevel as ActivityLevel,
      goal: profile.goal as Goal,
    })
    setDone(true)
  }

  const canNextStep1 =
    profile.age > 0 &&
    profile.age <= 119 &&
    profile.sex !== "" &&
    profile.weight > 0 &&
    profile.weight <= 300 &&
    profile.height >= 50 &&
    profile.height <= 250
  const canNextStep2 = profile.activityLevel !== ""
  const canNextStep3 = profile.goal !== ""
  const canNextStep4 = profile.weeklyRateKg >= 0.25 && profile.weeklyRateKg <= 2
  const canNext =
    step === 1 ? canNextStep1 : step === 2 ? canNextStep2 : step === 3 ? canNextStep3 : step === 4 ? canNextStep4 : true

  function getModalValidationError(): string | null {
    if (!openField) return null
    if (openField === "age" && (profile.age <= 0 || profile.age > 119)) return t("register.validationAge")
    if (openField === "weight" && (profile.weight <= 0 || profile.weight > 300)) return t("register.validationWeight")
    if (openField === "height" && (profile.height < 50 || profile.height > 250)) return t("register.validationHeight")
    if (openField === "weeklyRateKg" && (profile.weeklyRateKg < 0.25 || profile.weeklyRateKg > 2)) return t("register.validationWeeklyRate")
    return null
  }

  function handleModalSave() {
    const err = getModalValidationError()
    if (err) {
      setModalError(err)
      return
    }
    setModalError(null)
    closeModal()
  }

  const needsValidation = openField === "age" || openField === "weight" || openField === "height" || openField === "weeklyRateKg"

  function handleBackdropClick() {
    if (needsValidation && !hasTouchedCurrentField) {
      closeModal()
      return
    }
    const err = getModalValidationError()
    if (err) {
      setModalError(err)
      setErrorShake(true)
      return
    }
    closeModal()
  }

  const stepTitles = [t("register.step1"), t("register.step2"), t("register.step3"), t("register.step4")] as const

  const mascotMessage = done
    ? t("register.mascotMessage")
    : showCreateAccount
      ? t("register.mascotCreateAccount")
      : t(`register.mascotStep${step}` as "register.mascotStep1" | "register.mascotStep2" | "register.mascotStep3" | "register.mascotStep4")

  return (
    <main className="relative flex min-h-dvh flex-col text-foreground md:flex-row">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/login-bg.png)" }}
        aria-hidden
      />

      {/* Móvil: ilustración arriba (mascota + burbuja) */}
      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-shrink-0 items-end justify-start pb-0 pt-16 md:hidden",
          isPwa && "select-none",
        )}
      >
        <div className="-mt-4 flex items-end gap-0 pl-2 pr-4">
          <div className="flex shrink-0 animate-float">
            <img src="/rulo-mascot.png" alt="Rulo" className="h-28 w-auto object-contain" />
          </div>
          <div className="relative -ml-1 rounded-3xl rounded-bl-lg border border-border bg-card px-4 py-3 shadow-sm">
            <p className="max-w-[200px] text-left text-sm font-medium text-foreground">
              {mascotMessage}
            </p>
            <div
              className="absolute left-0 top-1/2 h-0 w-0 -translate-y-1/2 -translate-x-full border-t-[10px] border-b-[10px] border-r-[12px] border-t-transparent border-b-transparent"
              style={{ borderRightColor: "var(--card)" }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Form card — izquierda; en desktop 50% */}
      <div className="relative z-10 mt-2 flex min-h-0 flex-1 flex-col px-0 pt-2 md:mt-0 md:min-h-dvh md:w-[50%] md:flex-none md:px-3 md:pt-3 md:pb-0 md:pr-0 lg:px-4 lg:pt-4 lg:pb-0 lg:pr-0">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col justify-start overflow-y-auto rounded-t-[2rem] rounded-b-none border border-border bg-card px-4 py-6 shadow-xl md:rounded-t-3xl md:rounded-b-none md:px-8 md:py-9",
            isPwa && "select-none",
          )}
        >
          <div className="mx-auto w-full max-w-[340px] md:max-w-[400px]">
            {done ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">{t("register.done")}</p>
                <Button asChild className="mt-10 h-12 w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 md:h-14 md:rounded-3xl" size="lg">
                  <Link href="/sign-in" className="inline-flex items-center justify-center gap-2">
                    Ir a iniciar sesión
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : showCreateAccount ? (
              <div className="flex min-h-0 w-full flex-1 flex-col items-center">
                <header className="-mx-2 w-full shrink-0 self-stretch">
                  <div className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors"
                      aria-label={t("register.back")}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="relative flex-1 max-w-[300px] overflow-hidden rounded-full bg-muted" style={{ height: 6 }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/30 transition-all duration-300 ease-out"
                        style={{ width: "100%" }}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-foreground">
                    {t("register.createAccountTitle")}
                  </h1>
                </header>
                <div className="flex h-[360px] w-full max-w-md shrink-0 flex-col items-stretch justify-start overflow-y-auto overflow-x-hidden">
                  <form id="register-create-account-form" onSubmit={handleCreateAccount} className="flex w-full flex-col gap-5 py-2">
                    {registerError && (
                      <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{registerError}</p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">{t("register.createAccountPhone")}</Label>
                      <div className="flex h-12 overflow-hidden rounded-2xl border border-border/60 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background md:rounded-xl md:border-input">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="flex h-12 items-center border-0 bg-muted/50 px-4 text-sm font-medium text-foreground outline-none [&>option]:bg-card"
                          aria-label="Código de país"
                        >
                          {COUNTRY_CODES.map(({ code, label, flag }) => (
                            <option key={code} value={code}>
                              {flag} {code} {label}
                            </option>
                          ))}
                        </select>
                        <Input
                          id="register-phone"
                          type="tel"
                          inputMode="numeric"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                          autoComplete="tel"
                          disabled={isSubmitting}
                          className="h-12 min-w-0 flex-1 rounded-none border-0 border-l bg-transparent px-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">{t("register.createAccountPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("register.createAccountPasswordPlaceholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className="h-12 rounded-2xl border-border/60 pr-10 md:rounded-xl md:border-input"
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
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">{t("register.createAccountConfirmPassword")}</Label>
                      <Input
                        id="register-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("register.createAccountConfirmPlaceholder")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl border-border/60 md:rounded-xl md:border-input"
                      />
                    </div>
                    <p className={cn("text-center text-sm text-muted-foreground", isPwa && "select-none")}>
                      ¿Ya tenés cuenta?{" "}
                      <Link href="/sign-in" className="font-medium text-primary hover:underline">
                        Iniciar sesión
                      </Link>
                    </p>
                  </form>
                </div>
                <div className="flex w-full max-w-md shrink-0 justify-center pt-3">
                  <Button
                    type="submit"
                    form="register-create-account-form"
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 md:h-14 md:rounded-3xl"
                  >
                    {isSubmitting ? t("register.createAccountSubmitting") : t("register.createAccountSubmit")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center">
          {/* Header: flecha atrás + barra de progreso */}
          <header className="-mx-2 w-full shrink-0 self-stretch">
            <div className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2">
              {step === 1 ? (
                <Link
                  href="/sign-in"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors"
                  aria-label={t("register.back")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors"
                  aria-label={t("register.back")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="relative flex-1 max-w-[300px] overflow-hidden rounded-full bg-muted" style={{ height: 6 }}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/30 transition-all duration-300 ease-out"
                  style={{ width: `${(step / STEPS) * 100}%` }}
                  aria-hidden
                />
              </div>
            </div>
            <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-foreground">
              {stepTitles[step - 1]}
            </h1>
          </header>

          <div
            className={cn(
              "flex h-[360px] w-full max-w-md shrink-0 flex-col items-stretch overflow-y-auto overflow-x-hidden",
              step === 1 ? "justify-start" : "justify-center"
            )}
          >
            <div
              key={step}
              className={cn(
                "flex w-full flex-col items-stretch space-y-10",
                slideDirection === "forward" ? "animate-register-slide-right" : "animate-register-slide-left"
              )}
            >
          {/* Step 1: Datos físicos */}
          {step === 1 && (
            <>
              <div className="w-full space-y-4">
                <FieldRow
                  icon={Calendar}
                  label={t("register.age")}
                  value={profile.age ? String(profile.age) : ""}
                  emptyLabel={t("register.select")}
                  onClick={() => setOpenField("age")}
                />
                <FieldRow
                  icon={User}
                  label={t("register.sex")}
                  value={profile.sex ? t(profile.sex === "male" ? "register.male" : "register.female") : ""}
                  emptyLabel={t("register.select")}
                  onClick={() => setOpenField("sex")}
                />
                <FieldRow
                  icon={Weight}
                  label={t("register.weight")}
                  value={profile.weight ? `${profile.weight} kg` : ""}
                  emptyLabel={t("register.select")}
                  onClick={() => setOpenField("weight")}
                />
                <FieldRow
                  icon={Ruler}
                  label={t("register.height")}
                  value={profile.height ? `${profile.height} cm` : ""}
                  emptyLabel={t("register.select")}
                  onClick={() => setOpenField("height")}
                />
              </div>
            </>
          )}

          {/* Step 2: Nivel de actividad */}
          {step === 2 && (
            <div className="w-full space-y-4">
              <FieldRow
                icon={Activity}
                label={t("register.activityLevel")}
                value={(() => {
                  const opt = ACTIVITY_OPTIONS.find((o) => o.id === profile.activityLevel)
                  return opt ? t(opt.labelKey) : ""
                })()}
                emptyLabel={t("register.select")}
                onClick={() => setOpenField("activityLevel")}
              />
            </div>
          )}

          {/* Step 3: Objetivo */}
          {step === 3 && (
            <div className="w-full space-y-4">
              <FieldRow
                icon={Target}
                label={t("register.goal")}
                value={profile.goal ? (() => { const opt = GOAL_OPTIONS.find((o) => o.id === profile.goal); return opt ? t(opt.labelKey) : "" })() : ""}
                emptyLabel={t("register.select")}
                onClick={() => setOpenField("goal")}
              />
            </div>
          )}

          {/* Step 4: Ritmo semanal */}
          {step === 4 && (
            <div className="w-full space-y-4">
              <FieldRow
                icon={TrendingUp}
                label={t("register.weeklyRate")}
                value={profile.weeklyRateKg ? `${profile.weeklyRateKg} kg/sem` : ""}
                emptyLabel={t("register.select")}
                onClick={() => setOpenField("weeklyRateKg")}
              />
            </div>
          )}

          </div>
          </div>

          {/* Nav buttons */}
          <div className="flex w-full max-w-md shrink-0 justify-center pt-3">
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 md:h-14 md:rounded-3xl"
            >
              {step === STEPS ? t("register.finish") : t("register.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
            )}
          </div>
        </div>
      </div>

      {/* Derecha: ilustración (solo desktop) */}
      <div
        className={cn(
          "relative z-10 hidden min-h-[280px] flex-1 md:flex md:min-w-0 md:flex-col md:justify-center md:px-12 lg:px-20",
          isPwa && "select-none",
        )}
      >
        <div className="relative flex flex-col items-center justify-center gap-4 py-12">
          <div className="relative rounded-3xl rounded-b-lg border border-border bg-card px-5 py-4 shadow-lg md:px-6 md:py-5">
            <p className="max-w-[260px] text-left text-sm font-medium text-foreground md:max-w-[280px] md:text-base">
              {mascotMessage}
            </p>
            <div
              className="absolute -bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[14px] border-l-transparent border-r-transparent"
              style={{ borderTopColor: "var(--card)" }}
              aria-hidden
            />
          </div>
          <div className="flex w-full flex-1 items-center justify-center animate-float">
            <img
              src="/rulo-mascot.png"
              alt="Rulo"
              className="h-52 w-auto object-contain md:h-64 lg:h-72"
            />
          </div>
        </div>
      </div>

      {!done && !showCreateAccount && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{
              pointerEvents: openField || isClosing ? "auto" : "none",
              visibility: openField || isClosing ? "visible" : "hidden",
            }}
            aria-hidden={!openField && !isClosing}
          >
            {/* Backdrop: toda la pantalla */}
            <div
              className="absolute inset-0 bg-black/40 transition-opacity duration-300"
              style={{ opacity: openField && !isClosing ? 1 : 0 }}
              onClick={handleBackdropClick}
              aria-hidden
            />
            {/* Modal: centrado en la mitad izquierda en desktop; no captura clics para que el backdrop reciba "click outside" */}
            <div className="pointer-events-none relative flex flex-col items-center justify-end md:absolute md:left-0 md:top-0 md:h-full md:w-[50%] md:justify-end">
              <div
                className="pointer-events-auto relative mx-auto flex w-full max-w-lg flex-col rounded-t-3xl bg-card shadow-xl transition-transform duration-300 ease-out max-h-[85dvh] md:max-w-[400px]"
                style={{ transform: openField && !isClosing ? "translateY(0)" : "translateY(100%)" }}
                onClick={(e) => e.stopPropagation()}
              >
              <div className="flex shrink-0 justify-center pt-3 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-input" aria-hidden />
              </div>
              <header className="flex shrink-0 justify-center px-4 py-3">
                <h2 className="text-center text-lg font-semibold text-foreground">
                  {openField === "age" && t("register.age")}
                  {openField === "sex" && t("register.sex")}
                  {openField === "weight" && `${t("register.weight")} (kg)`}
                  {openField === "height" && `${t("register.height")} (cm)`}
                  {openField === "activityLevel" && t("register.activityLevel")}
                  {openField === "goal" && t("register.goal")}
                  {openField === "weeklyRateKg" && t("register.weeklyRate")}
                </h2>
              </header>
              <div className="flex flex-1 flex-col overflow-y-auto overflow-x-visible px-4 py-4 pb-8">
                <div className="mx-auto w-full max-w-xs flex-1">
                  {openField === "age" && (
                    <div className="w-full">
                      <div className="mx-auto w-full max-w-[5.5rem]">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={120}
                          placeholder=""
                          value={profile.age || ""}
                          onChange={(e) => update("age", parseInt(e.target.value) || 0)}
                          onFocus={() => setHasTouchedCurrentField(true)}
                          className="h-12 border-border/40 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                      </div>
                      <div className="mt-1.5 flex min-h-5 w-full items-center justify-center">
                          {modalError && (
                            <p className={cn("text-xs font-bold text-destructive whitespace-nowrap", errorShake && "animate-modal-error-shake")}>{modalError}</p>
                          )}
                        </div>
                    </div>
                  )}
                  {openField === "sex" && (
                    <div className="flex gap-2">
                      {(["male", "female"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            update("sex", s)
                            closeModal()
                          }}
                          className={cn(
                            "flex flex-1 items-center justify-center rounded-xl px-4 py-4 text-sm font-medium transition-colors",
                            profile.sex === s
                              ? "bg-primary text-primary-foreground"
                              : "bg-card"
                          )}
                        >
                          {t(s === "male" ? "register.male" : "register.female")}
                        </button>
                      ))}
                    </div>
                  )}
                  {openField === "weight" && (
                    <div className="w-full">
                      <div className="mx-auto w-full max-w-[5.5rem]">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={1}
                          max={300}
                          step={0.5}
                          placeholder=""
                          value={profile.weight || ""}
                          onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
                          onFocus={() => setHasTouchedCurrentField(true)}
                          className="h-12 border-border/40 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                      </div>
                      <div className="mt-1.5 flex min-h-5 w-full items-center justify-center">
                          {modalError && (
                            <p className={cn("text-xs font-bold text-destructive whitespace-nowrap", errorShake && "animate-modal-error-shake")}>{modalError}</p>
                          )}
                        </div>
                    </div>
                  )}
                  {openField === "height" && (
                    <div className="w-full">
                      <div className="mx-auto w-full max-w-[5.5rem]">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={50}
                          max={250}
                          placeholder=""
                          value={profile.height || ""}
                          onChange={(e) => update("height", parseInt(e.target.value) || 0)}
                          onFocus={() => setHasTouchedCurrentField(true)}
                          className="h-12 border-border/40 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                          autoFocus
                        />
                      </div>
                      <div className="mt-1.5 flex min-h-5 w-full items-center justify-center">
                          {modalError && (
                            <p className={cn("text-xs font-bold text-destructive whitespace-nowrap", errorShake && "animate-modal-error-shake")}>{modalError}</p>
                          )}
                        </div>
                    </div>
                  )}
                  {openField === "activityLevel" && (
                    <div className="flex flex-col gap-2">
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            update("activityLevel", opt.id)
                            closeModal()
                          }}
                          className={cn(
                            "flex w-full items-center justify-center rounded-xl px-4 py-4 text-sm font-medium transition-colors",
                            profile.activityLevel === opt.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-card"
                          )}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                  {openField === "goal" && (
                    <div className="flex flex-col gap-2">
                      {GOAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            update("goal", opt.id)
                            closeModal()
                          }}
                          className={cn(
                            "flex w-full items-center justify-center rounded-xl px-4 py-4 text-sm font-medium transition-colors",
                            profile.goal === opt.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-card"
                          )}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                  {openField === "weeklyRateKg" && (
                    <div className="flex flex-col gap-2">
                      {WEEKLY_RATE_OPTIONS.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            update("weeklyRateKg", rate)
                            closeModal()
                          }}
                          className={cn(
                            "flex w-full items-center justify-center rounded-xl px-4 py-4 text-sm font-medium transition-colors",
                            profile.weeklyRateKg === rate
                              ? "bg-primary text-primary-foreground"
                              : "bg-card"
                          )}
                        >
                          {rate} kg/sem
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {openField !== "sex" && openField !== "activityLevel" && openField !== "goal" && openField !== "weeklyRateKg" && (
                  <div className="mt-10 flex justify-center px-2">
                    <button
                      type="button"
                      onClick={handleModalSave}
                      disabled={!!modalError}
                      className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-5 py-5 text-base font-semibold text-primary-foreground transition-colors active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {t("register.save")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
    </main>
  )
}
