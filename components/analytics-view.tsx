"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { useI18n } from "@/lib/i18n"
import { getProfile } from "@/lib/storage"
import type { TrainingSession, Meal, UserProfile } from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import { fetchWorkoutLogsByRange, fetchMealsByRange } from "@/lib/api"
import { TrainingAnalytics } from "@/components/analytics/training-analytics"
import { MealsAnalytics } from "@/components/analytics/meals-analytics"
import { MEALS_ENABLED } from "@/lib/constants"

function isBestiaPlan(plan: string | null | undefined): boolean {
  if (!plan) return false
  const normalized = plan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return normalized === "bestia" || normalized === "free_trial" || normalized === "prueba gratis"
}

interface AnalyticsViewProps {
  onUpgrade?: () => void
  refreshKey: number
  onNavigate?: (tab: string) => void
  onOpenRecap: () => void
  recapOpen: boolean
  recapSource: "analytics" | "settings" | null
}

export function AnalyticsView({ refreshKey, onOpenRecap, onUpgrade, recapOpen, recapSource }: AnalyticsViewProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const hasBestia = isBestiaPlan(user?.current_plan)
  const [mounted, setMounted] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<"training" | "meals">("training")
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    setProfile(getProfile())
    if (user) {
      const today = new Date().toISOString().slice(0, 10)
      fetchWorkoutLogsByRange(user.id, "2020-01-01", today).then(setSessions)
      if (MEALS_ENABLED && hasBestia) {
        fetchMealsByRange(user.id, "2020-01-01", today).then(setMeals)
      }
    }
  }, [hasBestia, mounted, refreshKey, user])

  if (!mounted || !profile) {
    return (
      <div className="flex flex-col gap-6 px-6 pb-6 animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-secondary" />
          <div className="h-5 w-16 rounded-md bg-secondary" />
        </div>
        <div className="h-10 w-48 mx-auto rounded-full bg-secondary" />
        <div className="h-64 rounded-[32px] bg-card" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-[20px] bg-card" />
          <div className="h-24 rounded-[20px] bg-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[calc(100lvh-170px)] flex-col gap-0 pb-6">
      {/* Sub-tabs */}
      {MEALS_ENABLED && (
      <div className="px-6 animate-slide-up" style={{ animationDelay: "0.03s" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-full nav-glass w-fit mx-auto">
          {(["training", "meals"] as const).map((tab) => {
            const isActive = activeSubTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className="relative flex items-center justify-center px-5 h-10 rounded-full transition-colors duration-300 outline-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="analytics-pill"
                    className="absolute inset-0 bg-secondary shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                      mass: 1,
                    }}
                  />
                )}
                <span
                  className="relative z-10 text-sm font-bold transition-colors duration-300"
                  style={{ color: isActive ? "var(--foreground)" : "#737373" }}
                >
                  {tab === "training" ? t("analytics.training") : t("analytics.meals")}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      )}

      {activeSubTab === "training" && (
        <TrainingAnalytics
          sessions={sessions}
          onOpenRecap={onOpenRecap}
          recapMorphEnabled={recapSource === "analytics" || (recapOpen && recapSource === "analytics")}
          recapAvailable={hasBestia}
        />
      )}
      {activeSubTab === "meals" && (
        hasBestia ? (
          <MealsAnalytics meals={meals} profile={profile} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="text-4xl">🍌</span>
            <h2 className="text-xl font-bold text-foreground">{t("gate.mealsTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">{t("gate.mealsDescription")}</p>
            {onUpgrade && (
              <button
                type="button"
                onClick={onUpgrade}
                className="mt-2 h-12 rounded-full bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:scale-[0.99]"
              >
                {t("gate.mealsCta")}
              </button>
            )}
          </div>
        )
      )}
    </div>
  )
}
