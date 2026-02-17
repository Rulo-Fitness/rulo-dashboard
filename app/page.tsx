"use client"

import { useState, useCallback, useEffect } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { DashboardView } from "@/components/dashboard-view"
import { TrainingView } from "@/components/training-view"
import { MealsView } from "@/components/meals-view"
import { ProfileView } from "@/components/profile-view"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [refreshKey, setRefreshKey] = useState(0)
  const [trainingAddPanelOpen, setTrainingAddPanelOpen] = useState(false)
  const [mealsPanelOpen, setMealsPanelOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (activeTab !== "training") setTrainingAddPanelOpen(false)
  }, [activeTab])
  useEffect(() => {
    if (activeTab !== "meals") setMealsPanelOpen(false)
  }, [activeTab])

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

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
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
      <main className="mx-auto min-h-dvh max-w-lg bg-background pb-20 pt-8 overflow-visible touch-manipulation" style={{ touchAction: "pan-y" }}>
        <div className="overflow-visible" style={{ touchAction: "pan-y" }}>
          {activeTab === "dashboard" && (
            <DashboardView refreshKey={refreshKey} onNavigate={handleTabChange} />
          )}
          {activeTab === "training" && (
            <TrainingView onUpdate={triggerRefresh} onAddPanelChange={setTrainingAddPanelOpen} />
          )}
          {activeTab === "meals" && (
            <MealsView onUpdate={triggerRefresh} onMealPanelChange={setMealsPanelOpen} />
          )}
          {activeTab === "profile" && <ProfileView />}
        </div>
      </main>
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hidden={trainingAddPanelOpen || mealsPanelOpen}
      />
    </>
  )
}
