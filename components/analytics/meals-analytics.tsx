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

type DayStatus = "hit" | "over" | "under" | "none"

const WEEKDAY_KEYS = ["L", "M", "M", "J", "V", "S", "D"]
const WEEKDAY_KEYS_EN = ["M", "T", "W", "T", "F", "S", "S"]

export function MealsAnalytics({ meals, profile }: MealsAnalyticsProps) {
  const { t, locale } = useI18n()
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const calorieGoal = profile.calorieGoal || 2000

  // Group meals by date → total calories
  const mealsByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of meals) {
      map.set(m.date, (map.get(m.date) || 0) + m.calories)
    }
    return map
  }, [meals])

  // Calendar data for current month
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // getDay: 0=Sun, 1=Mon ... → shift to Mon=0
    const firstDayOfWeek = (getDay(monthStart) + 6) % 7

    const cells: { date: Date; dateStr: string; day: number; status: DayStatus }[] = []
    for (const day of days) {
      const y = day.getFullYear()
      const m = String(day.getMonth() + 1).padStart(2, "0")
      const d = String(day.getDate()).padStart(2, "0")
      const dateStr = `${y}-${m}-${d}`
      const cal = mealsByDate.get(dateStr)
      let status: DayStatus = "none"
      if (cal !== undefined) {
        const ratio = cal / calorieGoal
        if (ratio >= 0.9 && ratio <= 1.1) status = "hit"
        else if (ratio > 1.1) status = "over"
        else status = "under"
      }
      cells.push({ date: day, dateStr, day: day.getDate(), status })
    }

    return { cells, firstDayOfWeek }
  }, [currentMonth, mealsByDate, calorieGoal])

  // Summary counts
  const { hitDays, overDays, underDays } = useMemo(() => {
    let hit = 0, over = 0, under = 0
    for (const c of calendarData.cells) {
      if (c.status === "hit") hit++
      else if (c.status === "over") over++
      else if (c.status === "under") under++
    }
    return { hitDays: hit, overDays: over, underDays: under }
  }, [calendarData])

  const weekdayHeaders = locale === "es" ? WEEKDAY_KEYS : WEEKDAY_KEYS_EN

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: locale === "es" ? es : enUS })

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
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 pb-2">
            {weekdayHeaders.map((d, i) => (
              <div key={i} className="text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {calendarData.cells.map((cell) => {
              const isTodayCell = isToday(cell.date)
              const bgColor =
                cell.status === "hit"
                  ? "bg-emerald-500 text-white"
                  : cell.status === "over"
                    ? "bg-red-500 text-white"
                    : cell.status === "under"
                      ? "bg-amber-500 text-white"
                      : "bg-secondary text-muted-foreground"
              return (
                <div
                  key={cell.dateStr}
                  className={`aspect-square flex items-center justify-center rounded-full text-xs font-bold ${bgColor} ${
                    isTodayCell ? "ring-2 ring-foreground" : ""
                  }`}
                >
                  {cell.day}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Legend */}
      <section className="px-6 pt-3 animate-slide-up" style={{ animationDelay: "0.13s" }}>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">{t("analytics.goalHit")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">{t("analytics.goalOver")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">{t("analytics.goalUnder")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-xs text-muted-foreground">{t("analytics.noLog")}</span>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.16s" }}>
        <div className="bg-card rounded-[20px] p-5 card-shadow grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-2xl font-black tracking-tighter text-emerald-500" style={{ fontVariantNumeric: "tabular-nums" }}>
              {hitDays}
            </span>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider pt-0.5">
              {t("analytics.daysOnGoal")}
            </p>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-red-500" style={{ fontVariantNumeric: "tabular-nums" }}>
              {overDays}
            </span>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider pt-0.5">
              {t("analytics.goalOver")}
            </p>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter text-amber-500" style={{ fontVariantNumeric: "tabular-nums" }}>
              {underDays}
            </span>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider pt-0.5">
              {t("analytics.goalUnder")}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
