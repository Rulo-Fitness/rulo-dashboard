"use client"

import { useMemo, useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import { es, enUS } from "date-fns/locale"
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { Meal, UserProfile } from "@/lib/storage"

interface MealsAnalyticsProps {
  meals: Meal[]
  profile: UserProfile
}

const WEEKDAY_KEYS = ["L", "M", "M", "J", "V", "S", "D"]
const WEEKDAY_KEYS_EN = ["M", "T", "W", "T", "F", "S", "S"]

// TODO: remove hardcoded meals
const FAKE_MEALS: Meal[] = [
  // --- marzo 2026 ---
  { id: "f1",  date: "2026-03-01", name: "Avena con banana", time: "08:00", calories: 350, protein: 12, carbs: 55, fat: 8 },
  { id: "f2",  date: "2026-03-01", name: "Pollo con arroz",  time: "13:00", calories: 620, protein: 42, carbs: 65, fat: 14 },
  { id: "f3",  date: "2026-03-01", name: "Ensalada César",   time: "20:00", calories: 480, protein: 28, carbs: 20, fat: 30 },
  { id: "f4",  date: "2026-03-02", name: "Tostadas con palta", time: "09:00", calories: 400, protein: 10, carbs: 35, fat: 22 },
  { id: "f5",  date: "2026-03-02", name: "Pollo con arroz",  time: "13:00", calories: 620, protein: 42, carbs: 65, fat: 14 },
  { id: "f6",  date: "2026-03-02", name: "Pasta con carne",  time: "21:00", calories: 700, protein: 35, carbs: 80, fat: 20 },
  { id: "f7",  date: "2026-03-03", name: "Yogur con granola", time: "08:30", calories: 280, protein: 15, carbs: 40, fat: 6 },
  { id: "f8",  date: "2026-03-03", name: "Milanesa con puré", time: "13:00", calories: 750, protein: 38, carbs: 60, fat: 32 },
  { id: "f9",  date: "2026-03-05", name: "Avena con banana", time: "08:00", calories: 350, protein: 12, carbs: 55, fat: 8 },
  { id: "f10", date: "2026-03-05", name: "Pollo con arroz",  time: "13:00", calories: 620, protein: 42, carbs: 65, fat: 14 },
  { id: "f11", date: "2026-03-05", name: "Ensalada César",   time: "20:00", calories: 480, protein: 28, carbs: 20, fat: 30 },
  { id: "f12", date: "2026-03-05", name: "Proteína shake",   time: "16:00", calories: 200, protein: 30, carbs: 10, fat: 5 },
  { id: "f13", date: "2026-03-07", name: "Avena con banana", time: "08:00", calories: 350, protein: 12, carbs: 55, fat: 8 },
  { id: "f14", date: "2026-03-07", name: "Sushi",            time: "13:00", calories: 550, protein: 22, carbs: 70, fat: 12 },
  { id: "f15", date: "2026-03-08", name: "Tostadas con palta", time: "09:00", calories: 400, protein: 10, carbs: 35, fat: 22 },
  { id: "f16", date: "2026-03-08", name: "Hamburguesa",      time: "13:00", calories: 850, protein: 40, carbs: 55, fat: 45 },
  { id: "f17", date: "2026-03-08", name: "Pizza",            time: "21:00", calories: 900, protein: 30, carbs: 90, fat: 40 },
  { id: "f18", date: "2026-03-10", name: "Yogur con granola", time: "08:30", calories: 280, protein: 15, carbs: 40, fat: 6 },
  { id: "f19", date: "2026-03-10", name: "Pollo con arroz",  time: "13:00", calories: 620, protein: 42, carbs: 65, fat: 14 },
  { id: "f20", date: "2026-03-10", name: "Ensalada César",   time: "20:00", calories: 480, protein: 28, carbs: 20, fat: 30 },
  { id: "f21", date: "2026-03-12", name: "Avena con banana", time: "08:00", calories: 350, protein: 12, carbs: 55, fat: 8 },
  { id: "f22", date: "2026-03-12", name: "Pasta con carne",  time: "13:00", calories: 700, protein: 35, carbs: 80, fat: 20 },
  { id: "f23", date: "2026-03-14", name: "Proteína shake",   time: "07:00", calories: 200, protein: 30, carbs: 10, fat: 5 },
  { id: "f24", date: "2026-03-14", name: "Pollo con arroz",  time: "13:00", calories: 620, protein: 42, carbs: 65, fat: 14 },
  { id: "f25", date: "2026-03-14", name: "Ensalada César",   time: "20:00", calories: 480, protein: 28, carbs: 20, fat: 30 },
  { id: "f26", date: "2026-03-14", name: "Proteína shake",   time: "22:00", calories: 200, protein: 30, carbs: 10, fat: 5 },
  { id: "f27", date: "2026-03-15", name: "Milanesa con puré", time: "13:00", calories: 750, protein: 38, carbs: 60, fat: 32 },
  { id: "f28", date: "2026-03-16", name: "Tostadas con palta", time: "09:00", calories: 400, protein: 10, carbs: 35, fat: 22 },
  { id: "f29", date: "2026-03-17", name: "Avena con banana", time: "08:00", calories: 350, protein: 12, carbs: 55, fat: 8 },
  { id: "f30", date: "2026-03-17", name: "Pollo con arroz",  time: "13:00", calories: 620, protein: 42, carbs: 65, fat: 14 },
  { id: "f31", date: "2026-03-17", name: "Sushi",            time: "21:00", calories: 550, protein: 22, carbs: 70, fat: 12 },
  { id: "f32", date: "2026-03-18", name: "Hamburguesa",      time: "13:00", calories: 850, protein: 40, carbs: 55, fat: 45 },
  { id: "f33", date: "2026-03-18", name: "Pizza",            time: "21:00", calories: 900, protein: 30, carbs: 90, fat: 40 },
  { id: "f34", date: "2026-03-18", name: "Proteína shake",   time: "16:00", calories: 200, protein: 30, carbs: 10, fat: 5 },
  { id: "f35", date: "2026-03-19", name: "Yogur con granola", time: "08:30", calories: 280, protein: 15, carbs: 40, fat: 6 },
]

export function MealsAnalytics({ meals: _meals, profile }: MealsAnalyticsProps) {
  const meals = [..._meals, ...FAKE_MEALS] // TODO: remove
  const { t, locale } = useI18n()
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const calorieGoal = profile.calorieGoal || 2000
  const proteinGoal = profile.proteinGoal || 150
  const carbsGoal = profile.carbsGoal || 250
  const fatGoal = profile.fatGoal || 70

  // Group meals by date → totals
  const mealsByDate = useMemo(() => {
    const map = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>()
    for (const m of meals) {
      const existing = map.get(m.date) || { calories: 0, protein: 0, carbs: 0, fat: 0 }
      existing.calories += m.calories
      existing.protein += m.protein
      existing.carbs += m.carbs
      existing.fat += m.fat
      map.set(m.date, existing)
    }
    return map
  }, [meals])

  // Calendar data for current month
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const firstDayOfWeek = (getDay(monthStart) + 6) % 7

    const cells: { date: Date; dateStr: string; day: number; calories: number | undefined }[] = []
    for (const day of days) {
      const y = day.getFullYear()
      const m = String(day.getMonth() + 1).padStart(2, "0")
      const d = String(day.getDate()).padStart(2, "0")
      const dateStr = `${y}-${m}-${d}`
      const dayData = mealsByDate.get(dateStr)
      cells.push({ date: day, dateStr, day: day.getDate(), calories: dayData?.calories })
    }

    return { cells, firstDayOfWeek }
  }, [currentMonth, mealsByDate])

  // Average daily calories for current month (only days with data)
  const avgDaily = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const prefix = format(monthStart, "yyyy-MM")
    let total = 0
    let count = 0
    for (const [date, data] of mealsByDate) {
      if (date.startsWith(prefix)) {
        total += data.calories
        count++
      }
    }
    return count > 0 ? Math.round(total / count) : 0
  }, [currentMonth, mealsByDate])

  // Average macros for current month
  const avgMacros = useMemo(() => {
    const prefix = format(startOfMonth(currentMonth), "yyyy-MM")
    let totalP = 0, totalC = 0, totalF = 0, count = 0
    for (const [date, data] of mealsByDate) {
      if (date.startsWith(prefix)) {
        totalP += data.protein
        totalC += data.carbs
        totalF += data.fat
        count++
      }
    }
    if (count === 0) return { protein: 0, carbs: 0, fat: 0 }
    return {
      protein: Math.round(totalP / count),
      carbs: Math.round(totalC / count),
      fat: Math.round(totalF / count),
    }
  }, [currentMonth, mealsByDate])

  // Top 5 frequent meals
  const frequentMeals = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of meals) {
      const key = m.name.trim().toLowerCase()
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    // Get original name casing
    const nameMap = new Map<string, string>()
    for (const m of meals) {
      const key = m.name.trim().toLowerCase()
      if (key && !nameMap.has(key)) nameMap.set(key, m.name.trim())
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ name: nameMap.get(key) || key, count }))
  }, [meals])

  const weekdayHeaders = locale === "es" ? WEEKDAY_KEYS : WEEKDAY_KEYS_EN
  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: locale === "es" ? es : enUS })

  // Helper: soft foreground fade per cell, like training's area fill (max ~25%)
  function getCellStyle(calories: number | undefined): { backgroundColor?: string; color?: string } {
    if (calories === undefined) return {}
    const ratio = calories / calorieGoal
    // 5% → 25% foreground mix — subtle fade
    const pct = Math.round(Math.min(ratio, 1.2) * 20 + 3)
    return { backgroundColor: `color-mix(in oklch, var(--foreground) ${pct}%, transparent)`, color: "var(--foreground)" }
  }

  if (meals.length === 0) {
    return (
      <div className="px-6 pt-4 animate-slide-up">
        <div className="bg-card rounded-[32px] p-8 card-shadow text-center">
          <UtensilsCrossed size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">{t("analytics.noMealsData")}</p>
        </div>
      </div>
    )
  }

  const avgRatio = Math.min(avgDaily / calorieGoal, 1)
  const ofGoalText = t("analytics.ofGoal").replace("{goal}", String(calorieGoal))

  return (
    <div className="flex flex-col gap-0">
      {/* Month navigator */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-full active:bg-secondary transition-colors"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <span className="text-sm font-bold capitalize">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-full active:bg-secondary transition-colors"
          >
            <ChevronRight size={20} className="text-foreground" />
          </button>
        </div>
      </section>

      {/* Calendar grid */}
      <section className="px-6 pt-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="bg-card rounded-[32px] p-6 card-shadow">
          <div className="grid grid-cols-7 gap-1 pb-2">
            {weekdayHeaders.map((d, i) => (
              <div key={i} className="text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {calendarData.cells.map((cell) => {
              const isTodayCell = isToday(cell.date)
              const style = getCellStyle(cell.calories)
              const hasData = cell.calories !== undefined
              return (
                <div
                  key={cell.dateStr}
                  className={`aspect-square flex items-center justify-center rounded-full text-xs font-bold ${
                    !hasData ? "bg-secondary text-muted-foreground" : ""
                  } ${isTodayCell ? "ring-2 ring-foreground" : ""}`}
                  style={hasData ? style : undefined}
                >
                  {cell.day}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Daily Average */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="bg-card rounded-[32px] p-5 card-shadow">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
            {t("analytics.avgDaily")}
          </p>
          <div className="text-3xl font-black tracking-tighter" style={{ fontVariantNumeric: "tabular-nums" }}>
            {avgDaily}
            <span className="text-base font-bold text-muted-foreground ml-1">kcal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{ofGoalText}</p>
          <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-500"
              style={{ width: `${Math.round(avgRatio * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Monthly Macros */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="bg-card rounded-[32px] p-5 card-shadow">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
            {t("analytics.avgMacros")}
          </p>
          <div className="flex flex-col gap-3">
            {([
              { label: t("macro.protein"), avg: avgMacros.protein, goal: proteinGoal },
              { label: t("macro.carbs"), avg: avgMacros.carbs, goal: carbsGoal },
              { label: t("macro.fat"), avg: avgMacros.fat, goal: fatGoal },
            ] as const).map((macro) => {
              const pct = Math.min(macro.avg / macro.goal, 1)
              return (
                <div key={macro.label} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-16 shrink-0">{macro.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-500"
                      style={{ width: `${Math.round(pct * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-bold w-20 text-right shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {macro.avg}g / {macro.goal}g
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Frequent Meals */}
      {frequentMeals.length > 0 && (
        <section className="px-6 pt-4 pb-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="bg-card rounded-[32px] p-6 card-shadow">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
              {t("analytics.frequentMeals")}
            </p>
            <div className="space-y-0">
              {frequentMeals.map((meal, i) => (
                <div
                  key={meal.name}
                  className={`flex items-center justify-between py-2.5 ${i < frequentMeals.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs font-bold w-5">#{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{meal.name}</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {meal.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
