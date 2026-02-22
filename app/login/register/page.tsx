"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { saveProfile } from "@/lib/storage"
import type { UserProfile, Sex, ActivityLevel, Goal } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

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

export default function RegisterPage() {
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<RegisterProfile>({ ...defaultForm })
  const [done, setDone] = useState(false)
  const [openField, setOpenField] = useState<OpenField>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [triedNext, setTriedNext] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">("forward")
  const [modalError, setModalError] = useState<string | null>(null)
  const [errorShake, setErrorShake] = useState(false)
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
    if (key === openField) setModalError(null)
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
      saveProfile({
        ...profile,
        sex: profile.sex as Sex,
        activityLevel: profile.activityLevel as ActivityLevel,
        goal: profile.goal as Goal,
      })
      setDone(true)
    }
  }

  function handleBack() {
    if (step > 1) {
      setTriedNext(false)
      setSlideDirection("backward")
      setStep((s) => s - 1)
    }
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

  function handleBackdropClick() {
    const err = getModalValidationError()
    if (err) {
      setModalError(err)
      setErrorShake(true)
      return
    }
    closeModal()
  }

  const stepTitles = [t("register.step1"), t("register.step2"), t("register.step3"), t("register.step4")] as const
  const stepHints = [
    t("register.step1Hint"),
    t("register.step2Hint"),
    t("register.step3Hint"),
    t("register.weeklyRateHint"),
  ] as const

  return (
    <main className="mx-auto flex h-dvh max-h-dvh max-w-md flex-col items-center overflow-y-auto px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {done ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className="w-full rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("register.done")}</p>
          <Button asChild className="mt-10 w-full" size="lg">
            <Link href="/login">Ir a iniciar sesión</Link>
          </Button>
          </div>
        </div>
      ) : (
        <>
        <div className="flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-between">
          {/* Header: flecha atrás + barra de progreso */}
          <header className="-mx-2 w-full shrink-0 self-stretch">
            <div className="flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3">
              {step === 1 ? (
                <Link
                  href="/login"
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
            <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-foreground">
              {stepTitles[step - 1]}
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {stepHints[step - 1]}
            </p>
          </header>

          <div className="flex w-full max-w-md min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden">
            <div
              key={step}
              className={cn(
                "flex w-full flex-col items-center space-y-10",
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
          <div className="flex w-full max-w-md shrink-0 justify-center pt-4">
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canNext}
              className="flex min-h-[5rem] w-full items-center justify-center rounded-xl p-5 text-xl font-medium"
            >
              {step === STEPS ? t("register.finish") : t("register.next")}
            </Button>
          </div>
        </div>

          {/* Modal desde abajo para completar el campo */}
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{
              pointerEvents: openField || isClosing ? "auto" : "none",
              visibility: openField || isClosing ? "visible" : "hidden",
            }}
            aria-hidden={!openField && !isClosing}
          >
            <div
              className="absolute inset-0 bg-black/40 transition-opacity duration-300"
              style={{ opacity: openField && !isClosing ? 1 : 0 }}
              onClick={handleBackdropClick}
              aria-hidden
            />
            <div
              className="relative mx-auto flex w-full max-w-lg flex-col rounded-t-3xl bg-card shadow-xl transition-transform duration-300 ease-out max-h-[85dvh]"
              style={{ transform: openField && !isClosing ? "translateY(0)" : "translateY(100%)" }}
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
        </>
      )}
    </main>
  )
}
