"use client"

import { useEffect, useState } from "react"
import {
  getTodayMeals,
  getTodaySessions,
  getWeekSessions,
  getWeekMeals,
  type Meal,
  type TrainingSession,
} from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Dumbbell, Flame, Beef, Wheat, Droplets, TrendingUp, Calendar } from "lucide-react"

interface DashboardViewProps {
  refreshKey: number
}

export function DashboardView({ refreshKey }: DashboardViewProps) {
  const { t, locale } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [todaySessions, setTodaySessions] = useState<TrainingSession[]>([])
  const [weekSessions, setWeekSessions] = useState<TrainingSession[]>([])
  const [weekMeals, setWeekMeals] = useState<Meal[]>([])
  const [greeting, setGreeting] = useState("")
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    setTodayMeals(getTodayMeals())
    setTodaySessions(getTodaySessions())
    setWeekSessions(getWeekSessions())
    setWeekMeals(getWeekMeals())

    const now = new Date()
    const hour = now.getHours()
    setGreeting(
      hour < 12
        ? t("greeting.morning")
        : hour < 18
          ? t("greeting.afternoon")
          : t("greeting.evening")
    )
    setDateStr(
      now.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    )
  }, [mounted, refreshKey, t, locale])

  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  const todayProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0)
  const todayCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0)
  const todayFat = todayMeals.reduce((sum, m) => sum + m.fat, 0)
  const todayExercises = todaySessions.reduce((sum, s) => sum + s.exercises.length, 0)

  const weekCalories = weekMeals.reduce((sum, m) => sum + m.calories, 0)
  const weekExercises = weekSessions.reduce((sum, s) => sum + s.exercises.length, 0)

  if (!mounted) {
    return (
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
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </div>

      {/* Today's Macros */}
      <section aria-label={t("dashboard.todayNutrition")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("dashboard.todayNutrition")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayCalories}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.caloriesToday")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MacroMini icon={Beef} label={t("macro.protein")} value={`${todayProtein}${t("unit.g")}`} color="text-chart-1" />
            <MacroMini icon={Wheat} label={t("macro.carbs")} value={`${todayCarbs}${t("unit.g")}`} color="text-chart-4" />
            <MacroMini icon={Droplets} label={t("macro.fat")} value={`${todayFat}${t("unit.g")}`} color="text-chart-3" />
          </div>
        </div>
      </section>

      {/* Today's Training */}
      <section aria-label={t("dashboard.todayTraining")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("dashboard.todayTraining")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Dumbbell}
            label={t("dashboard.sessions")}
            value={todaySessions.length.toString()}
            sub={`${todayExercises} ${t("dashboard.exercises")}`}
          />
          <StatCard
            icon={Dumbbell}
            label={t("dashboard.exercises")}
            value={todayExercises.toString()}
            sub={t("training.today")}
          />
        </div>
      </section>

      {/* Weekly Overview */}
      <section aria-label={t("dashboard.thisWeek")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("dashboard.thisWeek")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={TrendingUp}
            label={t("dashboard.workouts")}
            value={weekSessions.length.toString()}
            sub={`${weekExercises} ${t("dashboard.exercises")}`}
          />
          <StatCard
            icon={Calendar}
            label={t("dashboard.avgCalories")}
            value={weekMeals.length > 0 ? Math.round(weekCalories / 7).toString() : "0"}
            sub={t("dashboard.perDay")}
          />
        </div>
      </section>

      {/* Recent Activity */}
      {(todaySessions.length > 0 || todayMeals.length > 0) && (
        <section aria-label={t("dashboard.recentActivity")}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.recentActivity")}
          </h2>
          <div className="flex flex-col gap-2">
            {todaySessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.exercises.length} {t("dashboard.exercises")}
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
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{meal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {meal.calories} {t("unit.cal")} &middot; {meal.protein}{t("unit.g")} {t("macro.protein").toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {todaySessions.length === 0 && todayMeals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
          <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("dashboard.noActivity")}</p>
          <p className="text-xs text-muted-foreground/70">{t("dashboard.startAdding")}</p>
        </div>
      )}
    </div>
  )
}

function MacroMini({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-2.5">
      <Icon className={`h-4 w-4 ${color}`} />
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
