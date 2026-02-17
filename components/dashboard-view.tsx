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
import { Dumbbell, Flame, UtensilsCrossed, Plus, Check, Circle } from "lucide-react"

function getWeekDates(centerDate: string): string[] {
  const d = new Date(centerDate + "T12:00:00")
  const daysFromMonday = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  const out: string[] = []
  for (let i = 0; i < 6; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    out.push(day.toISOString().split("T")[0])
  }
  return out
}

interface DashboardViewProps {
  refreshKey: number
  onNavigate?: (tab: string) => void
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
  const loc = locale === "es" ? "es-ES" : "en-US"

  const calPercent = Math.min((todayCalories / calGoal) * 100, 120)
  const isOverCal = todayCalories > calGoal
  const calDiff = isOverCal ? todayCalories - calGoal : calGoal - todayCalories

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 px-4 pb-6 animate-pulse">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-48 rounded-md bg-secondary" />
          <div className="h-4 w-32 rounded-md bg-secondary" />
        </div>
        <div className="h-28 rounded-xl bg-secondary" />
        <div className="h-24 rounded-xl bg-secondary" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-secondary" />
          <div className="h-20 rounded-xl bg-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>

      {/* Today's calories vs goal */}
      <section aria-label={t("dashboard.todayProgress")}>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {todayCalories.toLocaleString()} / {calGoal.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("unit.kcal")}</p>
              </div>
            </div>
            <p
              className={`text-sm font-semibold ${isOverCal ? "text-destructive" : "text-primary"}`}
            >
              {calDiff.toLocaleString()} {isOverCal ? t("dashboard.over") : t("dashboard.remaining")}
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(calPercent, 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-semibold text-foreground">{todayProtein}</p>
              <p className="text-[10px] text-muted-foreground">{t("macro.protein")} (meta {protGoal})</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{todayCarbs}</p>
              <p className="text-[10px] text-muted-foreground">{t("macro.carbs")} (meta {carbsGoal})</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{todayFat}</p>
              <p className="text-[10px] text-muted-foreground">{t("macro.fat")} (meta {fatGoal})</p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's training */}
      <section aria-label={t("dashboard.todayTraining")}>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                {todayExercises.length > 0 ? (
                  <>
                    <p className="font-semibold text-foreground">{t("dashboard.youTrained")}</p>
                    <p className="text-sm text-muted-foreground">
                      {todayExercises.length} {t("dashboard.exercises")}
                      {todayExercises.length <= 3
                        ? ` · ${todayExercises.map((e) => e.name).join(", ")}`
                        : ` · ${todayExercises.slice(0, 2).map((e) => e.name).join(", ")}...`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">{t("dashboard.noTrainingYet")}</p>
                    <p className="text-sm text-muted-foreground">{t("dashboard.addExercise")}</p>
                  </>
                )}
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("training")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-95"
                aria-label={t("dashboard.addExercise")}
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Week at a glance: Training + Meals */}
      <section aria-label={t("dashboard.thisWeek")}>
        <div className="rounded-xl border border-border bg-card px-2 py-3">
          <div className="mb-2 flex gap-4 px-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.weekTraining")}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.weekMeals")}
            </span>
          </div>
          <div className="flex gap-1">
            {weekDates.map((dateStr) => {
              const hasTraining = getExercisesForDate(dateStr).length > 0
              const hasMeals = allMeals.some((m) => m.date === dateStr)
              const isToday = dateStr === today
              return (
                <div
                  key={dateStr}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg py-1"
                >
                  <span
                    className={`text-[11px] font-medium uppercase ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {new Date(dateStr + "T12:00:00").toLocaleDateString(loc, { weekday: "short" }).charAt(0)}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    {hasTraining ? (
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2 w-2 text-primary-foreground" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} />
                    )}
                    {hasMeals ? (
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-chart-3">
                        <Check className="h-2 w-2 text-primary-foreground" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick log */}
      {onNavigate && (
        <section aria-label={t("dashboard.quickLog")}>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate("meals")}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/15">
                <UtensilsCrossed className="h-5 w-5 text-chart-3" />
              </div>
              <span className="font-semibold text-foreground">{t("dashboard.addMeal")}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("training")}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("dashboard.addExercise")}</span>
            </button>
          </div>
        </section>
      )}

      {/* Recent today */}
      {(todayMeals.length > 0 || todayExercises.length > 0) && (
        <section aria-label={t("dashboard.recentActivity")}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.recentActivity")}
          </h2>
          <div className="flex flex-col gap-2">
            {todayExercises.slice(0, 3).map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets}×{ex.reps} @ {ex.weight}
                    {t("unit.kg")}
                  </p>
                </div>
              </div>
            ))}
            {todayMeals.slice(0, 3).map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chart-3/15">
                  <Flame className="h-4 w-4 text-chart-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{meal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {meal.calories} {t("unit.cal")} · {meal.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
