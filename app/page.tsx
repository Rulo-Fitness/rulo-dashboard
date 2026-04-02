"use client"

import { useState, useCallback, useEffect } from "react"
import { TrainingRecapMock } from "@/components/analytics/training-recap-mock"
import { BottomNav } from "@/components/bottom-nav"
import { AnalyticsView } from "@/components/analytics-view"
import { TrainingView } from "@/components/training-view"
import { MealsView } from "@/components/meals-view"
import { ProfileView } from "@/components/profile-view"
import { TrainingSync } from "@/components/training-sync"
import { MealsSync } from "@/components/meals-sync"
import { SubscriptionBanner } from "@/components/subscription-banner"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("analytics")
  const [refreshKey, setRefreshKey] = useState(0)
  const [trainingAddPanelOpen, setTrainingAddPanelOpen] = useState(false)
  const [mealsPanelOpen, setMealsPanelOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [recapSource, setRecapSource] = useState<"analytics" | "settings" | null>(null)
  const [settingsOverlayOpen, setSettingsOverlayOpen] = useState(false)
  const [navHiddenByScroll, setNavHiddenByScroll] = useState(false)


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

  // #region agent log
  useEffect(() => {
    if (!mounted) return
    const log = (label: string, extra: Record<string, unknown> = {}) => {
      const doc = document.documentElement
      const body = document.body
      const data = {
        label,
        scrollY: window.scrollY,
        scrollHeight: doc.scrollHeight,
        bodyScrollHeight: body.scrollHeight,
        innerHeight: window.innerHeight,
        canScroll: doc.scrollHeight > window.innerHeight,
        bodyOverflowY: getComputedStyle(body).overflowY,
        htmlOverflowY: getComputedStyle(doc).overflowY,
        ...extra,
      }
      fetch("http://127.0.0.1:7242/ingest/3e36ce2e-2a69-43c9-9c65-a57f4cfc2cbc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: "page.tsx:scroll-debug", message: label, data, timestamp: Date.now() }),
      }).catch(() => {})
    }
    const t = setTimeout(() => log("onLoad"), 600)
    let scrollCount = 0
    const onScroll = () => {
      scrollCount += 1
      if (scrollCount === 1) log("firstScroll", { scrollCount: 1 })
      if (scrollCount === 3) log("afterFewScrolls", { scrollCount: 3 })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener("scroll", onScroll)
    }
  }, [mounted])
  // #endregion

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  // Sincroniza entrenos desde la API al cargar (usuario logueado)
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
      <main className="mx-auto min-h-dvh max-w-lg bg-background pb-20 pt-8">
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
      <main className="mx-auto flex min-h-dvh max-w-md flex-1 flex-col bg-background pb-32 pt-12 overflow-visible touch-manipulation pointer-events-auto" style={{ touchAction: "pan-y" }}>
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
      {recapOpen && <TrainingRecapMock onClose={() => setRecapOpen(false)} />}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hidden={trainingAddPanelOpen || mealsPanelOpen || recapOpen || settingsOverlayOpen || navHiddenByScroll}
      />
    </>
  )
}
