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

  useEffect(() => {
    setMounted(true)
  }, [])

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
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
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col bg-background pb-20 pt-8">
      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab === "dashboard" && (
          <DashboardView refreshKey={refreshKey} onNavigate={setActiveTab} />
        )}
        {activeTab === "training" && <TrainingView onUpdate={triggerRefresh} />}
        {activeTab === "meals" && <MealsView onUpdate={triggerRefresh} />}
        {activeTab === "profile" && <ProfileView />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}
