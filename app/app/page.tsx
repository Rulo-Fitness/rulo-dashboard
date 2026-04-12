"use client"

import { useState, useCallback, useEffect } from "react"
import { TrainingRecapMock } from "@/components/analytics/training-recap-mock"
import { BottomNav } from "@/components/bottom-nav"
import { AnalyticsView } from "@/components/analytics-view"
import { TrainingView } from "@/components/training-view"
import { MealsView } from "@/components/meals-view"
import { ProfileView } from "@/components/profile-view"
import { SubscriptionManageView } from "@/components/subscription-manage-view"
import { SubscriptionUpgradeView } from "@/components/subscription-upgrade-view"
import { TrainingSync } from "@/components/training-sync"
import { MealsSync } from "@/components/meals-sync"
import { SubscriptionBanner } from "@/components/subscription-banner"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { AppSignature } from "@/components/app-signature"

function isBestiaPlan(plan: string | null | undefined): boolean {
  if (!plan) return false
  const normalized = plan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return normalized === "bestia" || normalized === "free_trial" || normalized === "prueba gratis"
}

function isFieraPlan(plan: string | null | undefined): boolean {
  if (!plan) return false
  return plan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "fiera"
}

export default function AppDashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const hasBestia = isBestiaPlan(user?.current_plan)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("analytics")
  const [refreshKey, setRefreshKey] = useState(0)
  const [trainingAddPanelOpen, setTrainingAddPanelOpen] = useState(false)
  const [mealsPanelOpen, setMealsPanelOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [recapSource, setRecapSource] = useState<"analytics" | "settings" | null>(null)
  const [settingsOverlayOpen, setSettingsOverlayOpen] = useState(false)
  const [navHiddenByScroll, setNavHiddenByScroll] = useState(false)
  const [gateOverlay, setGateOverlay] = useState<"recap" | "recapComingSoon" | null>(null)
  const [subscriptionViewOpen, setSubscriptionViewOpen] = useState(false)
  const [subscriptionViewVisible, setSubscriptionViewVisible] = useState(false)
  const [upgradeViewOpen, setUpgradeViewOpen] = useState(false)
  const [upgradeViewVisible, setUpgradeViewVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (activeTab !== "training") setTrainingAddPanelOpen(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "meals") setMealsPanelOpen(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "analytics" && activeTab !== "settings") setRecapOpen(false)
  }, [activeTab])

  useEffect(() => {
    if (recapOpen) return
    const timeout = window.setTimeout(() => setRecapSource(null), 320)
    return () => window.clearTimeout(timeout)
  }, [recapOpen])
  useEffect(() => {
    if (activeTab !== "settings") setSettingsOverlayOpen(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "settings") setSubscriptionViewOpen(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "settings") setSubscriptionViewVisible(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "settings" && !upgradeViewVisible) setUpgradeViewOpen(false)
  }, [activeTab, upgradeViewVisible])
  useEffect(() => {
    if (activeTab !== "settings" && !upgradeViewVisible) setUpgradeViewVisible(false)
  }, [activeTab, upgradeViewVisible])

  useEffect(() => {
    const shouldLockBodyScroll = subscriptionViewVisible || upgradeViewVisible
    if (!shouldLockBodyScroll) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [subscriptionViewVisible, upgradeViewVisible])

  useEffect(() => {
    if (!mounted) return

    const getScrollY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0

    let lastScrollY = getScrollY()
    let lastTouchY = 0

    const revealNav = () => setNavHiddenByScroll(false)
    const hideNav = () => setNavHiddenByScroll(true)

    const handleDirectionalChange = (delta: number) => {
      const currentScrollY = getScrollY()
      if (currentScrollY <= 24) {
        setNavHiddenByScroll(false)
        lastScrollY = currentScrollY
        return
      }

      if (delta > 3) {
        hideNav()
        lastScrollY = currentScrollY
        return
      }

      if (delta < -3) {
        revealNav()
        lastScrollY = currentScrollY
      }
    }

    const handleScroll = () => {
      const currentScrollY = getScrollY()
      handleDirectionalChange(currentScrollY - lastScrollY)
    }

    const handleWheel = (event: WheelEvent) => {
      handleDirectionalChange(event.deltaY)
    }

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0
    }

    const handleTouchMove = (event: TouchEvent) => {
      const currentTouchY = event.touches[0]?.clientY ?? lastTouchY
      const delta = lastTouchY - currentTouchY
      lastTouchY = currentTouchY
      handleDirectionalChange(delta)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("wheel", handleWheel, { passive: true })
    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
    }
  }, [mounted, activeTab])

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleTrainingSynced = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setRefreshKey((k) => k + 1)
    setNavHiddenByScroll(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (!mounted) {
    return (
      <main className="mx-auto min-h-[100lvh] max-w-lg bg-background pb-14 pt-3">
        <div className="flex flex-col gap-6 px-4 pb-6 animate-pulse">
          <div className="flex flex-col gap-1">
            <div className="h-8 w-48 rounded-md bg-secondary" />
            <div className="h-4 w-32 rounded-md bg-secondary" />
          </div>
          <div className="h-40 rounded-xl bg-secondary" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 rounded-xl bg-secondary" />
            <div className="h-28 rounded-xl bg-secondary" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <TrainingSync onSynced={handleTrainingSynced} />
      {hasBestia && <MealsSync onSynced={handleTrainingSynced} />}
      <main className="mx-auto flex min-h-[100lvh] max-w-md flex-1 flex-col bg-background pb-16 pt-3 overflow-visible touch-manipulation pointer-events-auto" style={{ touchAction: "pan-y" }}>
        <SubscriptionBanner onUpgrade={() => { setUpgradeViewVisible(true); setUpgradeViewOpen(true) }} />
        <div className="flex min-h-0 flex-1 flex-col overflow-visible pointer-events-auto" style={{ touchAction: "pan-y" }}>
          {activeTab === "analytics" && (
            <AnalyticsView
              refreshKey={refreshKey}
              onNavigate={handleTabChange}
              onOpenRecap={() => {
                if (isFieraPlan(user?.current_plan)) {
                  setGateOverlay("recap")
                } else {
                  setGateOverlay("recapComingSoon")
                }
              }}
              onUpgrade={() => {
                setUpgradeViewVisible(true)
                setUpgradeViewOpen(true)
              }}
              recapOpen={recapOpen}
              recapSource={recapSource}
            />
          )}
          {activeTab === "training" && (
            <TrainingView onUpdate={triggerRefresh} onAddPanelChange={setTrainingAddPanelOpen} />
          )}
          {activeTab === "meals" && (
            hasBestia ? (
              <MealsView onUpdate={triggerRefresh} onMealPanelChange={setMealsPanelOpen} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                <span className="text-4xl">🍌</span>
                <h2 className="text-xl font-bold text-foreground">{t("gate.mealsTitle")}</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t("gate.mealsDescription")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeViewVisible(true)
                    setUpgradeViewOpen(true)
                  }}
                  className="mt-2 h-12 rounded-full bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:scale-[0.99]"
                >
                  {t("gate.mealsCta")}
                </button>
                <AppSignature />
              </div>
            )
          )}
          {activeTab === "settings" && (
            <ProfileView
              onOverlayChange={setSettingsOverlayOpen}
              onOpenSubscription={() => {
                setSubscriptionViewVisible(true)
                setSubscriptionViewOpen(true)
              }}
              onOpenRecap={() => {
                if (isFieraPlan(user?.current_plan)) {
                  setGateOverlay("recap")
                } else {
                  setGateOverlay("recapComingSoon")
                }
              }}
              recapOpen={recapOpen}
              recapSource={recapSource}
            />
          )}
        </div>
      </main>
      {subscriptionViewVisible && (
        <SubscriptionManageView
          isOpen={subscriptionViewOpen}
          onOpenUpgrade={() => {
            setUpgradeViewVisible(true)
            setUpgradeViewOpen(true)
          }}
          onCloseComplete={() => {
            setSubscriptionViewOpen(false)
            setSubscriptionViewVisible(false)
          }}
        />
      )}
      {upgradeViewVisible && (
        <SubscriptionUpgradeView
          isOpen={upgradeViewOpen}
          onCloseComplete={() => {
            setUpgradeViewOpen(false)
            setUpgradeViewVisible(false)
          }}
        />
      )}
      {recapOpen && <TrainingRecapMock onClose={() => setRecapOpen(false)} />}
      {gateOverlay === "recap" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <span className="text-5xl">🏆</span>
            <h2 className="text-2xl font-bold text-foreground">{t("gate.recapTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("gate.recapDescription")}
            </p>
            <button
              type="button"
              onClick={() => {
                setGateOverlay(null)
                setUpgradeViewVisible(true)
                setUpgradeViewOpen(true)
              }}
              className="mt-2 h-12 rounded-full bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:scale-[0.99]"
            >
              {t("gate.recapCta")}
            </button>
            <button
              type="button"
              onClick={() => setGateOverlay(null)}
              className="mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("profile.cancel")}
            </button>
          </div>
        </div>
      )}
      {gateOverlay === "recapComingSoon" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <span className="text-5xl">🚀</span>
            <h2 className="text-2xl font-bold text-foreground">{t("gate.recapComingSoonTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("gate.recapComingSoonDescription")}
            </p>
            <button
              type="button"
              onClick={() => setGateOverlay(null)}
              className="mt-2 h-12 rounded-full bg-secondary px-8 text-[15px] font-semibold text-foreground shadow-md transition-colors hover:bg-secondary/90 active:scale-[0.99]"
            >
              {t("profile.cancel")}
            </button>
          </div>
        </div>
      )}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hidden={trainingAddPanelOpen || mealsPanelOpen || recapOpen || settingsOverlayOpen || subscriptionViewVisible || upgradeViewVisible || navHiddenByScroll}
      />
    </>
  )
}
