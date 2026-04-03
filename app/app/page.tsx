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

export default function AppDashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("analytics")
  const [refreshKey, setRefreshKey] = useState(0)
  const [trainingAddPanelOpen, setTrainingAddPanelOpen] = useState(false)
  const [mealsPanelOpen, setMealsPanelOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [recapSource, setRecapSource] = useState<"analytics" | "settings" | null>(null)
  const [settingsOverlayOpen, setSettingsOverlayOpen] = useState(false)
  const [navHiddenByScroll, setNavHiddenByScroll] = useState(false)
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
    if (activeTab !== "settings") setUpgradeViewOpen(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "settings") setUpgradeViewVisible(false)
  }, [activeTab])

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
      <MealsSync onSynced={handleTrainingSynced} />
      <main className="mx-auto flex min-h-[100lvh] max-w-md flex-1 flex-col bg-background pb-16 pt-3 overflow-visible touch-manipulation pointer-events-auto" style={{ touchAction: "pan-y" }}>
        <SubscriptionBanner />
        <div className="flex min-h-0 flex-1 flex-col overflow-visible pointer-events-auto" style={{ touchAction: "pan-y" }}>
          {activeTab === "analytics" && (
            <AnalyticsView
              refreshKey={refreshKey}
              onNavigate={handleTabChange}
              onOpenRecap={() => {
                setRecapSource("analytics")
                setRecapOpen(true)
              }}
              recapOpen={recapOpen}
              recapSource={recapSource}
            />
          )}
          {activeTab === "training" && (
            <TrainingView onUpdate={triggerRefresh} onAddPanelChange={setTrainingAddPanelOpen} />
          )}
          {activeTab === "meals" && (
            <MealsView onUpdate={triggerRefresh} onMealPanelChange={setMealsPanelOpen} />
          )}
          {activeTab === "settings" && (
            <ProfileView
              onOverlayChange={setSettingsOverlayOpen}
              onOpenSubscription={() => {
                setSubscriptionViewVisible(true)
                setSubscriptionViewOpen(true)
              }}
              onOpenRecap={() => {
                setRecapSource("settings")
                setRecapOpen(true)
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
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hidden={trainingAddPanelOpen || mealsPanelOpen || recapOpen || settingsOverlayOpen || subscriptionViewVisible || upgradeViewVisible || navHiddenByScroll}
      />
    </>
  )
}
