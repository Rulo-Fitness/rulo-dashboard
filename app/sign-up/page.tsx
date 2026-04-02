"use client"

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { saveProfile } from "@/lib/storage"
import type { UserProfile, Sex, ActivityLevel, Goal } from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/phone-input"
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
import { useForceLightMode } from "@/lib/hooks/use-force-light-mode"
import { useDefaultSpanishLocale } from "@/lib/hooks/use-default-spanish-locale"

const STEPS = 5

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
const AGE_OPTIONS = Array.from({ length: 119 }, (_, index) => index + 1)
const WEIGHT_OPTIONS = Array.from({ length: 300 }, (_, index) => index + 1)
const HEIGHT_OPTIONS = Array.from({ length: 201 }, (_, index) => index + 50)
const WHEEL_ITEM_HEIGHT = 52
const WHEEL_VISIBLE_ROWS = 5

type OpenField =
  | "age"
  | "sex"
  | "weight"
  | "height"
  | "activityLevel"
  | "goal"
  | "weeklyRateKg"
  | null

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

function WheelPicker<T extends string | number>({
  options,
  value,
  onChange,
  formatOption,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  formatOption?: (value: T) => string
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spacerHeight = ((WHEEL_VISIBLE_ROWS - 1) / 2) * WHEEL_ITEM_HEIGHT

  useLayoutEffect(() => {
    const index = Math.max(0, options.findIndex((option) => option === value))
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: "auto" })
  }, [options, value])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  const commitSelection = useCallback(() => {
    const node = scrollRef.current
    if (!node) return
    const rawIndex = Math.round(node.scrollTop / WHEEL_ITEM_HEIGHT)
    const nextIndex = Math.min(options.length - 1, Math.max(0, rawIndex))
    const nextValue = options[nextIndex]
    if (nextValue !== value) onChange(nextValue)
    node.scrollTo({ top: nextIndex * WHEEL_ITEM_HEIGHT, behavior: "smooth" })
  }, [onChange, options, value])

  return (
    <div className="relative mx-auto w-full max-w-[14rem]">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-2xl border border-border/70 bg-secondary/70"
        style={{ height: `${WHEEL_ITEM_HEIGHT}px` }}
      />
      <div
        ref={scrollRef}
        className="no-scrollbar h-[260px] overflow-y-auto overscroll-contain px-1"
        style={{ scrollSnapType: "y mandatory" }}
        onScroll={() => {
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
          scrollTimeoutRef.current = setTimeout(commitSelection, 80)
        }}
      >
        <div style={{ height: spacerHeight }} />
        {options.map((option) => {
          const isSelected = option === value
          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange(option)}
              className="flex w-full items-center justify-center rounded-2xl px-4 text-center transition-colors"
              style={{ height: `${WHEEL_ITEM_HEIGHT}px`, scrollSnapAlign: "center" }}
            >
              <span className={cn("text-lg font-semibold tracking-tight", isSelected ? "text-foreground" : "text-muted-foreground")}>
                {formatOption ? formatOption(option) : String(option)}
              </span>
            </button>
          )
        })}
        <div style={{ height: spacerHeight }} />
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const { t } = useI18n()
  const { register: registerApi, login: loginApi } = useAuth()
  const router = useRouter()
  useForceLightMode()
  useDefaultSpanishLocale()

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<RegisterProfile>({ ...defaultForm })
  const [done, setDone] = useState(false)
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

  const isAccountStep = step === 5

  // Clear register errors when entering the account creation step
  useEffect(() => {
    if (isAccountStep) setRegisterError("")
  }, [isAccountStep])

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
    if (!openField) return
    setProfile((prev) => {
      if (openField === "age" && prev.age <= 0) return { ...prev, age: 25 }
      if (openField === "weight" && prev.weight <= 0) return { ...prev, weight: 70 }
      if (openField === "height" && prev.height <= 0) return { ...prev, height: 175 }
      if (openField === "weeklyRateKg" && prev.weeklyRateKg <= 0) return { ...prev, weeklyRateKg: 0.5 }
      return prev
    })
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
    if (step < STEPS) {
      // Clear register error when entering account step
      if (step === 4) setRegisterError("")
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (step > 1) {
      setTriedNext(false)
      setSlideDirection("backward")
      if (isAccountStep) setRegisterError("")
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
    if (!result.ok) {
      setIsSubmitting(false)
      setRegisterError(result.error ?? t("register.createAccountError"))
      return
    }
    saveProfile({
      ...profile,
      sex: profile.sex as Sex,
      activityLevel: profile.activityLevel as ActivityLevel,
      goal: profile.goal as Goal,
    })
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rulo-post-signup-redirect", "/gift")
    }
    const loginResult = await loginApi(fullPhone, password)
    if (!loginResult.ok) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("rulo-post-signup-redirect")
      }
      setIsSubmitting(false)
      setRegisterError(loginResult.error ?? t("register.createAccountError"))
      return
    }
    router.push("/gift")
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

  const mascotMessage = done
    ? t("register.mascotMessage")
    : isAccountStep
      ? t("register.mascotCreateAccount")
      : t(`register.mascotStep${step}` as "register.mascotStep1" | "register.mascotStep2" | "register.mascotStep3" | "register.mascotStep4")

  return (
    <main
      className="relative flex h-[100lvh] min-h-[100lvh] flex-col overflow-hidden overflow-x-hidden text-foreground md:min-h-dvh md:h-auto md:flex-row"
      style={{ touchAction: "pan-y" }}
    >
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/login-bg.webp)" }}
        aria-hidden
      />

      {/* Mobile: mascot + bubble */}
      <div
        className="relative z-20 flex min-h-0 flex-shrink-0 items-end justify-center pb-0 pt-7 md:hidden"
      >
        <div className="flex items-end justify-center gap-0 px-4">
          <div className="relative z-20 flex shrink-0 translate-y-5 animate-float-soft">
            <img src="/rulo-mascot.webp" alt="Rulo" className="h-22 w-auto object-contain" />
          </div>
          <div className="relative -ml-1 -translate-y-7 rounded-[28px] rounded-bl-lg border border-border bg-card px-4 py-3 shadow-sm">
            <p className="max-w-[210px] text-left text-[13px] font-medium leading-5 text-foreground">
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

      {/* Form card — left side; 50% on desktop */}
      <div
        className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden px-0 pt-1 md:mt-0 md:min-h-dvh md:w-[48%] md:max-w-[760px] md:flex-none md:px-3 md:pt-3 md:pb-0 md:pr-0 lg:w-[46%] lg:px-4 lg:pt-4 lg:pb-0 lg:pr-0"
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-hidden rounded-t-[2rem] rounded-b-none border border-border bg-card px-5 py-7 shadow-xl md:overflow-y-auto md:rounded-t-[2rem] md:rounded-b-none md:px-9 md:py-10 lg:px-10"
        >
          <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center md:max-w-[420px] md:justify-center">
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
            ) : isAccountStep ? (
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
                        style={{ width: `${(step / STEPS) * 100}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                </header>
                <div className="flex h-[380px] w-full max-w-md shrink-0 flex-col items-stretch justify-center overflow-visible pt-8 md:h-[400px]">
                  <form id="register-create-account-form" onSubmit={handleCreateAccount} noValidate className="flex w-full flex-col gap-5 py-3">
                    {registerError && (
                      <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{registerError}</p>
                    )}
                    <div className="space-y-3">
                      <Label htmlFor="register-name">{t("profile.name")}</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder={t("register.createAccountNamePlaceholder")}
                        value={profile.name}
                        onChange={(e) => update("name", e.target.value)}
                        autoComplete="given-name"
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl border-border/60 bg-background shadow-xs focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 md:h-[52px] md:rounded-2xl md:border-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-phone">{t("register.createAccountPhone")}</Label>
                      <PhoneInput
                        id="register-phone"
                        countryCode={countryCode}
                        onCountryCodeChange={setCountryCode}
                        phoneNumber={phoneNumber}
                        onPhoneNumberChange={setPhoneNumber}
                        disabled={isSubmitting}
                        lockedCountryCode
                      />
                    </div>
                    <div className="space-y-3">
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
                          className="h-12 rounded-2xl border-border/60 bg-background pr-10 shadow-xs focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 md:h-[52px] md:rounded-2xl md:border-input"
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
                    <div className="space-y-3">
                      <Label htmlFor="register-confirm">{t("register.createAccountConfirmPassword")}</Label>
                      <Input
                        id="register-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("register.createAccountConfirmPlaceholder")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl border-border/60 bg-background shadow-xs focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 md:h-[52px] md:rounded-2xl md:border-input"
                      />
                    </div>
                  </form>
                </div>
                <div className="flex w-full max-w-md shrink-0 justify-center pt-6">
                  <Button
                    type="button"
                    onClick={(e) => {
                      // Trigger the form's onSubmit manually to avoid React DOM recycling
                      // causing auto-submit when transitioning from step 4's button
                      const form = document.getElementById("register-create-account-form") as HTMLFormElement | null
                      if (form) form.requestSubmit()
                    }}
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 md:h-[54px] md:rounded-full"
                  >
                    {isSubmitting ? t("register.createAccountSubmitting") : t("register.createAccountSubmit")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center">
          {/* Header: back arrow + progress bar */}
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
          </header>

          <div
            className={cn(
              "flex h-[380px] w-full max-w-md shrink-0 flex-col items-stretch justify-center overflow-y-hidden overflow-x-hidden pt-8 md:h-[400px]"
            )}
          >
            <div
              key={step}
              className={cn(
                "flex w-full flex-col items-stretch space-y-8 md:space-y-9",
                slideDirection === "forward" ? "animate-register-slide-right" : "animate-register-slide-left"
              )}
            >
          {/* Step 1: Physical data */}
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

          {/* Step 2: Activity level */}
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

          {/* Step 3: Goal */}
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

          {/* Step 4: Weekly rate */}
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
                <div className="flex w-full max-w-md shrink-0 justify-center pt-10">
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 md:h-[54px] md:rounded-full"
            >
              {step === 4 ? t("register.finish") : t("register.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop right side: mascot */}
      <div
        className="relative z-10 hidden min-h-[280px] flex-1 md:flex md:min-w-0 md:flex-col md:justify-center md:px-10 lg:px-16 xl:px-20"
      >
        <div className="relative flex flex-col items-center justify-center gap-5 py-10 lg:gap-6 lg:py-12">
          <div className="relative rounded-[30px] rounded-b-lg border border-border bg-card px-5 py-4 shadow-lg md:px-6 md:py-5">
            <p className="max-w-[280px] text-left text-[15px] font-medium leading-6 text-foreground md:max-w-[320px] md:text-base">
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
              src="/rulo-mascot.webp"
              alt="Rulo"
              className="h-56 w-auto object-contain md:h-72 lg:h-[20rem] xl:h-[22rem]"
            />
          </div>
        </div>
      </div>

      {/* Bottom sheet modal */}
      {!done && !isAccountStep && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{
              pointerEvents: openField || isClosing ? "auto" : "none",
              visibility: openField || isClosing ? "visible" : "hidden",
            }}
            aria-hidden={!openField && !isClosing}
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              style={{ opacity: openField && !isClosing ? 1 : 0 }}
              onClick={handleBackdropClick}
              aria-hidden
            />
            <div className="pointer-events-none relative flex flex-col items-center justify-end md:absolute md:left-0 md:top-0 md:h-full md:w-[50%] md:justify-end">
              <div
                className="pointer-events-auto relative mx-auto flex w-full max-w-lg max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out md:max-w-[400px]"
                style={{ transform: openField && !isClosing ? "translateY(0)" : "translateY(100%)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <header className="flex shrink-0 justify-center px-6 py-4">
                  <h2 className="text-center text-xl font-bold text-foreground">
                    {openField === "age" && t("register.age")}
                    {openField === "sex" && t("register.sex")}
                    {openField === "weight" && `${t("register.weight")} (kg)`}
                    {openField === "height" && `${t("register.height")} (cm)`}
                    {openField === "activityLevel" && t("register.activityLevel")}
                    {openField === "goal" && t("register.goal")}
                    {openField === "weeklyRateKg" && t("register.weeklyRate")}
                  </h2>
                </header>
                <div className="flex flex-1 flex-col overflow-y-auto overflow-x-visible px-6 pb-8">
                  <div className="mx-auto w-full max-w-xs flex-1">
                  {openField === "age" && (
                    <div className="w-full">
                      <WheelPicker
                        options={AGE_OPTIONS}
                        value={profile.age || 25}
                        onChange={(value) => {
                          update("age", value)
                          setHasTouchedCurrentField(true)
                        }}
                      />
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
                      <WheelPicker
                        options={WEIGHT_OPTIONS}
                        value={profile.weight || 70}
                        onChange={(value) => {
                          update("weight", value)
                          setHasTouchedCurrentField(true)
                        }}
                        formatOption={(value) => `${value} kg`}
                      />
                      <div className="mt-1.5 flex min-h-5 w-full items-center justify-center">
                          {modalError && (
                            <p className={cn("text-xs font-bold text-destructive whitespace-nowrap", errorShake && "animate-modal-error-shake")}>{modalError}</p>
                          )}
                        </div>
                    </div>
                  )}
                  {openField === "height" && (
                    <div className="w-full">
                      <WheelPicker
                        options={HEIGHT_OPTIONS}
                        value={profile.height || 175}
                        onChange={(value) => {
                          update("height", value)
                          setHasTouchedCurrentField(true)
                        }}
                        formatOption={(value) => `${value} cm`}
                      />
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
