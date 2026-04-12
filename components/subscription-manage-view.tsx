"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Check, Clock3, Crown, Sparkles, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { useCurrentPlan } from "@/lib/hooks/use-current-plan"
import { CHEAPEST_DASHBOARD_PLAN, getDashboardPlanByName, displayPlanName } from "@/lib/plans"

type SubscriptionManageViewProps = {
  isOpen: boolean
  onCloseComplete: () => void
  onOpenUpgrade: () => void
}

function getSubscriptionState(user: {
  subscription_active_until?: string | null
  trial_used?: boolean
} | null) {
  const activeUntil = user?.subscription_active_until ?? null
  const hasActiveAccess = activeUntil ? new Date(activeUntil) > new Date() : false

  if (hasActiveAccess) return "active" as const
  if (user?.trial_used) return "expired" as const
  return "available" as const
}

function formatActiveUntil(activeUntil: string | null | undefined, locale: "en" | "es") {
  if (!activeUntil) return null
  const parsed = new Date(activeUntil)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString(locale === "es" ? "es-AR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function SubscriptionManageView({
  isOpen,
  onCloseComplete,
  onOpenUpgrade,
}: SubscriptionManageViewProps) {
  const { user, updateUser } = useAuth()
  const { t, locale } = useI18n()
  const [showCancelInfo, setShowCancelInfo] = useState(false)
  const [isEntered, setIsEntered] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState("")

  const state = getSubscriptionState(user)
  const activeUntilLabel = formatActiveUntil(user?.subscription_active_until, locale)
  const { planName } = useCurrentPlan(user?.id, user?.current_plan)
  const displayName = displayPlanName(planName, t)
  const effectivePlanName =
    state === "active" && displayName
      ? displayName
      : state === "active" && user?.trial_used
        ? t("subscription.trialName")
      : state === "expired" && displayName
        ? displayName
        : state === "available"
          ? t("subscription.trialName")
        : null

  const effectivePlan = useMemo(() => {
    if (effectivePlanName === t("subscription.trialName")) return CHEAPEST_DASHBOARD_PLAN
    return getDashboardPlanByName(effectivePlanName)
  }, [effectivePlanName, t])

  const planHighlights = (effectivePlan?.highlightKeys ?? CHEAPEST_DASHBOARD_PLAN.highlightKeys).slice(0, 3)

  const summaryText = useMemo(() => {
    if (state === "active") {
      return activeUntilLabel
        ? t("subscription.manageValidUntil").replace("{date}", activeUntilLabel)
        : t("subscription.manageActiveNoDate")
    }
    if (state === "expired") return t("subscription.manageExpiredBody")
    return t("subscription.manageAvailableBody")
  }, [activeUntilLabel, state, t])

  const leadingIcon = state === "active"
    ? <Crown className="h-5 w-5 text-[#D4A017]" strokeWidth={2.2} />
    : state === "expired"
      ? <Clock3 className="h-5 w-5 text-foreground" strokeWidth={2.2} />
      : <Sparkles className="h-5 w-5 text-foreground" strokeWidth={2.2} />

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsEntered(isOpen))
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  function handleClose() {
    setIsEntered(false)
    window.setTimeout(() => {
      onCloseComplete()
    }, 300)
  }

  return (
    <main
      className="no-scrollbar fixed inset-0 z-40 mx-auto flex min-h-[100lvh] max-w-md flex-col overflow-y-auto overscroll-contain bg-background px-6 pb-28 pt-6 transition-transform duration-300 ease-out"
      style={{ transform: isEntered ? "translateX(0)" : "translateX(100%)" }}
    >
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-sm active:scale-95"
          aria-label={t("profile.cancel")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("subscription.manageEyebrow")}
          </p>
        </div>
        <div className="h-10 w-10" aria-hidden />
      </header>

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        <section className="rounded-[32px] bg-card p-6 card-shadow">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary">
              {leadingIcon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("subscription.manageCurrentLabel")}
              </p>
              <h1 className="mt-2 text-[28px] font-bold leading-[1.05] tracking-tight text-foreground">
                {effectivePlanName ?? t("subscription.statusExpired")}
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
                {summaryText}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("subscription.manageBenefitsLabel")}
            </p>
            <div className="mt-3 space-y-3">
              {planHighlights.map((highlightKey) => (
                <div key={highlightKey} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Check className="h-3.5 w-3.5 text-foreground" strokeWidth={2.4} />
                  </div>
                  <p className="text-[14px] leading-5 text-foreground">{t(highlightKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-[15px] font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:scale-[0.99]"
          >
            {t("subscription.upgrade")}
            <ChevronRight className="h-4 w-4" />
          </button>

          {planName !== "free_trial" && (
            <button
              type="button"
              onClick={() => setShowCancelInfo(true)}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-secondary px-4 text-[15px] font-semibold text-foreground transition-colors active:scale-[0.99]"
            >
              {t("subscription.cancel")}
            </button>
          )}
        </div>
      </div>

      <div
        className="fixed inset-0 z-[80] flex flex-col justify-end"
        style={{
          pointerEvents: showCancelInfo ? "auto" : "none",
          visibility: showCancelInfo ? "visible" : "hidden",
        }}
        aria-hidden={!showCancelInfo}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: showCancelInfo ? 1 : 0 }}
          onClick={() => setShowCancelInfo(false)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: showCancelInfo ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("subscription.cancel")}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelInfo(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <p className="text-[14px] text-center text-muted-foreground">
              {t("subscription.cancelConfirm")}
            </p>
            {cancelError && (
              <p className="mt-3 text-center text-[13px] text-destructive">{cancelError}</p>
            )}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  if (!user?.id) return
                  setIsCancelling(true)
                  setCancelError("")
                  try {
                    const res = await fetch("/api/subscription-cancel", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ user_id: user.id }),
                    })
                    const data = await res.json()
                    if (!res.ok || !data.success) {
                      setCancelError(data.error ?? "No se pudo cancelar")
                    } else {
                      updateUser({ mp_subscription_id: null })
                      setShowCancelInfo(false)
                    }
                  } catch {
                    setCancelError("Error de conexión")
                  } finally {
                    setIsCancelling(false)
                  }
                }}
                className="flex h-12 w-full items-center justify-center rounded-full bg-destructive px-4 text-[15px] font-semibold text-destructive-foreground active:scale-[0.99]"
              >
                {isCancelling ? "Cancelando..." : t("subscription.cancel")}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelInfo(false)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-secondary px-4 text-[15px] font-semibold text-foreground active:scale-[0.99]"
              >
                {t("profile.cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
