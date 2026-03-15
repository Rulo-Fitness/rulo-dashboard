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
import { Dumbbell, Flame, UtensilsCrossed, Plus } from "lucide-react"
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
  const [greeting, setGreeting] = useState("")
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    setTodayMeals(getTodayMeals())
    setAllMeals(getMeals())
    const now = new Date()
    const hour = now.getHours()
    setGreeting(
      hour < 12 ? t("greeting.morning") : hour < 18 ? t("greeting.afternoon") : t("greeting.evening")
    )
    setDateStr(
      now.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    )
  }, [mounted, refreshKey, t, locale])

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

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 px-4 pb-6 animate-pulse">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-48 rounded-md bg-secondary" />
          <div className="h-4 w-32 rounded-md bg-secondary" />
        </div>
        <div className="h-52 rounded-xl bg-secondary" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 rounded-xl bg-secondary" />
          <div className="h-20 rounded-xl bg-secondary" />
          <div className="h-20 rounded-xl bg-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-0 pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1 px-4 pb-3 animate-slide-up">
        <p className="text-[13px] font-medium text-muted-foreground capitalize tracking-wide" style={{ textWrap: "balance" }}>{dateStr}</p>
        <h1 className="text-[32px] font-extrabold tracking-tight text-foreground leading-[1.1]" style={{ textWrap: "balance" }}>{greeting}</h1>
      </div>

      {/* ── Large CalorieRing ── */}
      <section className="flex justify-center px-4 pt-2 pb-1 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <CalorieRing
          current={todayCalories}
          goal={calGoal}
          size={200}
          label={isOverCal ? t("dashboard.caloriesOver") : t("dashboard.caloriesRemaining")}
        />
      </section>

      {/* Eaten / Goal summary */}
      <div className="flex justify-center gap-6 px-4 pb-2 animate-slide-up" style={{ animationDelay: "0.08s" }}>
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

      {/* ── 3x MacroRingCard grid ── */}
      <section className="grid grid-cols-3 gap-2 px-4 pt-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <MacroRingCard label={t("macro.protein")} current={todayProtein} goal={protGoal} color="#FF6B00" />
        <MacroRingCard label={t("macro.carbs")} current={todayCarbs} goal={carbsGoal} color="#F59E0B" />
        <MacroRingCard label={t("macro.fat")} current={todayFat} goal={fatGoal} color="#8B5CF6" />
      </section>

      {/* ── WeekStrip ── */}
      <section className="px-4 pt-4 animate-slide-up" style={{ animationDelay: "0.13s" }}>
        <div className="rounded-[16px] bg-card px-3 py-1 card-warm">
          <WeekStrip selectedDate={today} dataMap={weekDataMap} locale={locale} />
        </div>
      </section>

      {/* ── Today's training summary ── */}
      <section aria-label={t("dashboard.todayTraining")} className="px-4 pt-3 animate-slide-up" style={{ animationDelay: "0.16s" }}>
        <div className="rounded-[16px] bg-card overflow-hidden card-warm">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#3B82F6]">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {todayExercises.length > 0 ? (
                <>
                  <p className="text-[15px] font-medium text-foreground">{t("dashboard.youTrained")}</p>
                  <p className="text-[13px] text-muted-foreground truncate">
                    {todayExercises.length} {t("dashboard.exercises")}
                    {todayVolume > 0 && ` · ${todayVolume.toLocaleString()} ${t("unit.kg")} ${t("dashboard.todayVolume")}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-medium text-foreground">{t("dashboard.noTrainingYet")}</p>
                  <p className="text-[13px] text-muted-foreground">{t("dashboard.addExercise")}</p>
                </>
              )}
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("training")}
                className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
                aria-label={t("dashboard.addExercise")}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Quick log buttons (pill style) ── */}
      {onNavigate && (
        <section className="flex gap-3 px-4 pt-4 animate-slide-up" style={{ animationDelay: "0.19s" }}>
          <button
            type="button"
            onClick={() => onNavigate("meals")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-card border border-border py-3 px-4 text-[14px] font-semibold text-foreground transition-all active:scale-[0.97] card-warm"
          >
            <UtensilsCrossed className="h-4 w-4 text-[#F59E0B]" />
            {t("dashboard.addMeal")}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("training")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-card border border-border py-3 px-4 text-[14px] font-semibold text-foreground transition-all active:scale-[0.97] card-warm"
          >
            <Dumbbell className="h-4 w-4 text-[#3B82F6]" />
            {t("dashboard.addExercise")}
          </button>
        </section>
      )}

      {/* ── Recent activity ── */}
      {(todayMeals.length > 0 || todayExercises.length > 0) && (
        <>
          <p className="section-label px-4 pt-5 pb-2 select-none">
            {t("dashboard.recentActivity")}
          </p>
          <section aria-label={t("dashboard.recentActivity")} className="px-4 animate-slide-up" style={{ animationDelay: "0.22s" }}>
            <div className="rounded-[16px] bg-card overflow-hidden divide-y divide-border/40 card-warm">
              {todayExercises.slice(0, 3).map((ex) => (
                <div key={ex.id} className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#3B82F6]">
                    <Dumbbell className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{ex.name}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {ex.sets}×{ex.reps} @ {ex.weight}{t("unit.kg")}
                    </p>
                  </div>
                </div>
              ))}
              {todayMeals.slice(0, 3).map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#F59E0B]">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">{meal.name}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {meal.calories} {t("unit.cal")} · {meal.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
