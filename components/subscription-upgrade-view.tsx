"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, ChevronLeft, Crown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { useCurrentPlan } from "@/lib/hooks/use-current-plan"
import { DASHBOARD_PLANS, formatPlanPrice, getDashboardPlanByName, displayPlanName } from "@/lib/plans"

type SubscriptionUpgradeViewProps = {
  isOpen: boolean
  onCloseComplete: () => void
}

export function SubscriptionUpgradeView({ isOpen, onCloseComplete }: SubscriptionUpgradeViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const { planName } = useCurrentPlan(user?.id, user?.current_plan)
  const [isEntered, setIsEntered] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<(typeof DASHBOARD_PLANS)[number] | null>(null)

  const isActivePaidPlan = useMemo(() => {
    const hasActiveAccess = Boolean(user?.subscription_active_until && new Date(user.subscription_active_until) > new Date())
    return hasActiveAccess && Boolean(planName) && !user?.trial_used
  }, [planName, user?.subscription_active_until, user?.trial_used])

  const currentPlanData = useMemo(() => getDashboardPlanByName(planName), [planName])
  const isMaxPlan = isActivePaidPlan && currentPlanData?.price === Math.max(...DASHBOARD_PLANS.map(p => p.price))

  useEffect(() => {
    if (!selectedPlan) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [selectedPlan])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsEntered(isOpen))
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  function handleClose() {
    setSelectedPlan(null)
    setIsEntered(false)
    window.setTimeout(() => {
      onCloseComplete()
      setPayerEmail("")
      setError("")
    }, 300)
  }

  async function handleCheckout() {
    if (!user || !selectedPlan) return

    if (!payerEmail || !payerEmail.includes("@")) {
      setError(t("subscription.emailRequired"))
      return
    }

    setLoadingPlan(selectedPlan.name)
    setError("")

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, plan: selectedPlan.name, payer_email: payerEmail }),
      })
      const data = await res.json()
      if (!res.ok || !data.init_point) {
        setError(data.error ?? "Error al iniciar el pago")
        setLoadingPlan(null)
        return
      }
      window.location.href = data.init_point
    } catch {
      setError(t("subscription.connectionError"))
      setLoadingPlan(null)
    }
  }

  return (
    <>
    <main
      className={`no-scrollbar fixed inset-0 z-50 mx-auto flex min-h-[100lvh] max-w-md flex-col overscroll-contain bg-background px-6 pb-28 pt-6 transition-transform duration-300 ease-out ${selectedPlan ? "overflow-hidden" : "overflow-y-auto"}`}
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
            {t("subscription.upgradeEyebrow")}
          </p>
        </div>
        <div className="h-10 w-10" aria-hidden />
      </header>

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <>
            <div>
              <h1 className="text-[30px] font-bold leading-[1.02] tracking-tight text-foreground">
                {t("subscription.upgradeTitle")}
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
                {t("subscription.upgradeSubtitle")}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {DASHBOARD_PLANS.map((plan) => {
                const isCurrentPlan = isActivePaidPlan && planName === plan.name
                const isDowngrade = isActivePaidPlan && currentPlanData && plan.price < currentPlanData.price
                const isBlocked = isCurrentPlan || Boolean(isDowngrade) || isMaxPlan

                return (
                  <section key={plan.name} className="rounded-[32px] bg-card p-5 card-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-[24px] font-bold tracking-tight text-foreground">{plan.name}</h2>
                          {isCurrentPlan && (
                            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                              {t("subscription.upgradeYourPlanBadge")}
                            </span>
                          )}
                          {!isCurrentPlan && plan.popular && (
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[14px] leading-5 text-muted-foreground">{t(plan.descKey)}</p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                        <Crown className="h-5 w-5 text-[#D4A017]" strokeWidth={2.2} />
                      </div>
                    </div>

                    <div className="mt-5 flex items-end gap-2">
                      <p className="text-[28px] font-bold tracking-tight text-foreground">
                        {formatPlanPrice(plan.price)}
                      </p>
                      <p className="pb-1 text-[13px] text-muted-foreground">/mes</p>
                      <p className="pb-1 text-[13px] text-muted-foreground line-through">
                        {formatPlanPrice(plan.originalPrice)}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {plan.highlightKeys.slice(0, 3).map((highlightKey) => (
                        <div key={highlightKey} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                            <Check className="h-3.5 w-3.5 text-foreground" strokeWidth={2.4} />
                          </div>
                          <p className="text-[14px] leading-5 text-foreground">{t(highlightKey)}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(isBlocked)}
                      onClick={() => setSelectedPlan(plan)}
                      className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors active:scale-[0.99] ${
                        isBlocked
                          ? "bg-secondary text-foreground/60"
                          : "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      }`}
                    >
                      {isCurrentPlan ? t("subscription.upgradeCurrentPlan") : isDowngrade ? t("subscription.upgradeLowerPlan") : isMaxPlan ? t("subscription.upgradeCurrentPlan") : t("subscription.upgradeChoosePlan")}
                      {!isBlocked && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </section>
                )
              })}
            </div>

            {error && !selectedPlan && (
              <p className="mt-5 text-center text-[13px] text-destructive">
                {error}
              </p>
            )}
          </>
      </div>

    </main>

    {/* Email popup — outside main so it covers the full viewport */}
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6"
      style={{
        pointerEvents: selectedPlan ? "auto" : "none",
        visibility: selectedPlan ? "visible" : "hidden",
      }}
      aria-hidden={!selectedPlan}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: selectedPlan ? 1 : 0 }}
        onClick={() => { setSelectedPlan(null); setError("") }}
        aria-hidden
      />
      <div
        className="relative mx-auto flex w-full max-w-md flex-col rounded-[24px] bg-card shadow-xl transition-all duration-300 ease-out"
        style={{ opacity: selectedPlan ? 1 : 0, transform: selectedPlan ? "scale(1)" : "scale(0.95)" }}
      >
        <div className="px-6 pt-6 pb-8">
          <h2 className="text-xl font-bold text-foreground">{t("subscription.emailTitle")}</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {t("subscription.emailSubtitle")}
          </p>

          <div className="mt-5">
            <label htmlFor="payer-email" className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("subscription.emailLabel")}
            </label>
            <input
              id="payer-email"
              type="email"
              value={payerEmail}
              onChange={(e) => { setPayerEmail(e.target.value); setError("") }}
              placeholder="tu@email.com"
              className="mt-2 flex h-12 w-full rounded-2xl border border-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="mt-3 text-center text-[13px] text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={Boolean(selectedPlan && loadingPlan === selectedPlan.name)}
            onClick={handleCheckout}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-[15px] font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:scale-[0.99]"
          >
            {selectedPlan && loadingPlan === selectedPlan.name ? t("subscription.upgradeRedirecting") : t("subscription.continueToPayment")}
            {!(selectedPlan && loadingPlan === selectedPlan.name) && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
