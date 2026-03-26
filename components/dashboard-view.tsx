"use client"

import { useEffect, useState } from "react"
import {
  getTodayMeals,
  getTodayString,
  getExercisesForDate,
  getMeals,
  getProfile,
} from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Dumbbell, Flame, UtensilsCrossed, Plus, TrendingUp } from "lucide-react"
import Image from "next/image"
import { CalorieRing } from "@/components/ui/calorie-ring"
import { MacroRingCard } from "@/components/ui/macro-ring-card"
import { WeekStrip } from "@/components/ui/week-strip"

function getWeekDates(centerDate: string): string[] {
  const d = new Date(centerDate + "T12:00:00")
  const daysFromMonday = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    out.push(day.toISOString().split("T")[0])
  }
  return out
}

interface DashboardViewProps {
  refreshKey: number
  onNavigate?: (tab: string) => void
  onDashboardModalChange?: (open: boolean) => void
}

export function DashboardView({ refreshKey, onNavigate }: DashboardViewProps) {
  const { t, locale } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [todayMeals, setTodayMeals] = useState<ReturnType<typeof getTodayMeals>>([])
  const [allMeals, setAllMeals] = useState<ReturnType<typeof getMeals>>([])
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    setTodayMeals(getTodayMeals())
    setAllMeals(getMeals())
  }, [mounted, refreshKey])

  const today = getTodayString()
  const profile = getProfile()
  const calGoal = profile.calorieGoal || 2000
  const protGoal = profile.proteinGoal || 150
  const carbsGoal = profile.carbsGoal || 250
  const fatGoal = profile.fatGoal || 65

  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  const todayProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0)
  const todayCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0)
  const todayFat = todayMeals.reduce((sum, m) => sum + m.fat, 0)

  const todayExercises = getExercisesForDate(today)
  const weekDates = getWeekDates(today)
  const isOverCal = todayCalories > calGoal

  // Build week data map for WeekStrip
  const weekDataMap: Record<string, { training: boolean; meals: boolean }> = {}
  for (const wd of weekDates) {
    weekDataMap[wd] = {
      training: getExercisesForDate(wd).length > 0,
      meals: allMeals.some((m) => m.date === wd),
    }
  }

  // Training volume
  const todayVolume = todayExercises.reduce((sum, ex) => sum + ex.sets * ex.reps * ex.weight, 0)

  // Goal percentage
  const goalPercent = calGoal > 0 ? Math.round((todayCalories / calGoal) * 100) : 0

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 px-6 pb-6 animate-pulse">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-48 rounded-md bg-secondary" />
          <div className="h-4 w-32 rounded-md bg-secondary" />
        </div>
        <div className="h-64 rounded-[32px] bg-card" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 rounded-[20px] bg-card" />
          <div className="h-20 rounded-[20px] bg-card" />
          <div className="h-20 rounded-[20px] bg-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-0 pb-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-6 pb-4 animate-slide-up">
        <Image src="/rulo-isotipo.webp" alt="Rulo" width={32} height={32} className="rounded-lg" />
        <span className="text-lg font-bold tracking-tight text-foreground">Rulo</span>
      </div>

      {/* ── Main Stats Card ── */}
      <section className="px-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <div className="bg-card rounded-[32px] p-8 card-shadow overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                {t("dashboard.dailyActivity") || "Daily Activity"}
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {todayCalories.toLocaleString()}
                </span>
                <span className="text-muted-foreground font-bold text-sm">{t("unit.kcal")}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isOverCal
                ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            }`}>
              {isOverCal ? `+${goalPercent - 100}%` : `${goalPercent}%`} {t("dashboard.goalLabel")}
            </div>
          </div>

          {/* Calorie Ring centered */}
          <div className="flex justify-center pt-6 pb-2">
            <CalorieRing
              current={todayCalories}
              goal={calGoal}
              size={180}
              label={isOverCal ? t("dashboard.caloriesOver") : t("dashboard.caloriesRemaining")}
            />
          </div>

          {/* Eaten / Goal summary */}
          <div className="flex justify-center gap-6 pt-2">
            <div className="text-center">
              <span className="text-[18px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{todayCalories.toLocaleString()}</span>
              <p className="text-[11px] text-muted-foreground">{t("unit.kcal")} {t("dashboard.eaten")}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-[18px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{calGoal.toLocaleString()}</span>
              <p className="text-[11px] text-muted-foreground">{t("dashboard.goalLabel")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3x MacroRingCard grid ── */}
      <section className="grid grid-cols-3 gap-2 px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <MacroRingCard label={t("macro.protein")} current={todayProtein} goal={protGoal} color="#10B981" />
        <MacroRingCard label={t("macro.carbs")} current={todayCarbs} goal={carbsGoal} color="#F59E0B" />
        <MacroRingCard label={t("macro.fat")} current={todayFat} goal={fatGoal} color="#8B5CF6" />
      </section>

      {/* ── WeekStrip ── */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.13s" }}>
        <div className="rounded-[32px] bg-card px-4 py-2 card-shadow">
          <WeekStrip selectedDate={today} dataMap={weekDataMap} locale={locale} />
        </div>
      </section>

      {/* ── Quick actions ── */}
      {onNavigate && (
        <section className="flex gap-3 px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.16s" }}>
          <button
            type="button"
            onClick={() => onNavigate("meals")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-card py-3 px-4 text-[14px] font-semibold text-foreground transition-all active:scale-[0.97] card-shadow"
          >
            <UtensilsCrossed className="h-4 w-4 text-chart-3" />
            {t("dashboard.addMeal")}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("training")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-card py-3 px-4 text-[14px] font-semibold text-foreground transition-all active:scale-[0.97] card-shadow"
          >
            <Dumbbell className="h-4 w-4 text-info" />
            {t("dashboard.addExercise")}
          </button>
        </section>
      )}

      {/* ── Latest Activity ── */}
      {(todayMeals.length > 0 || todayExercises.length > 0) && (
        <section className="px-6 pt-6 animate-slide-up" style={{ animationDelay: "0.19s" }}>
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider pb-3">
            {t("dashboard.recentActivity")}
          </h3>
          <div className="bg-card rounded-[32px] overflow-hidden card-shadow">
            {todayExercises.slice(0, 3).map((ex, idx) => (
              <div key={ex.id}>
                {idx > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
                <div className="px-5 py-3 min-h-[56px] flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-foreground shrink-0">
                    <Dumbbell className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px]">{ex.name}</h4>
                    <p className="text-muted-foreground text-xs font-medium">
                      {ex.sets}×{ex.reps} @ {ex.weight}{t("unit.kg")}
                    </p>
                  </div>
                  <span className="font-bold text-[15px] shrink-0">
                    {(ex.sets * ex.reps * ex.weight).toLocaleString()} {t("unit.kg")}
                  </span>
                </div>
              </div>
            ))}
            {todayExercises.length > 0 && todayMeals.length > 0 && (
              <div className="ml-[76px] mr-5 h-px bg-border" />
            )}
            {todayMeals.slice(0, 3).map((meal, idx) => (
              <div key={meal.id}>
                {idx > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
                <div className="px-5 py-3 min-h-[56px] flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-foreground shrink-0">
                    <UtensilsCrossed className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[15px]">{meal.name}</h4>
                    <p className="text-muted-foreground text-xs font-medium">{meal.time}</p>
                  </div>
                  <span className="font-bold text-[15px] shrink-0">{meal.calories} {t("unit.cal")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Today's training summary ── */}
      {todayExercises.length === 0 && todayMeals.length === 0 && (
        <section className="px-6 pt-6 animate-slide-up" style={{ animationDelay: "0.19s" }}>
          <div className="bg-card rounded-[32px] p-8 card-shadow text-center">
            <Dumbbell size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">{t("dashboard.noTrainingYet")}</p>
            <p className="text-muted-foreground/60 text-sm mt-1">{t("dashboard.addExercise")}</p>
          </div>
        </section>
      )}
    </div>
  )
}
