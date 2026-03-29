"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { useI18n } from "@/lib/i18n"
import type { TrainingSession } from "@/lib/storage"
import { TrendingUp, BarChart3, Flame, Calendar, Trophy, ChevronDown } from "lucide-react"

interface TrainingAnalyticsProps {
  sessions: TrainingSession[]
  onOpenRecap: () => void
  recapMorphEnabled?: boolean
}

type Range = "1M" | "3M" | "all"

const recapTransition = {
  type: "spring",
  stiffness: 230,
  damping: 28,
  mass: 1,
} as const

function getRangeDate(range: Range): string | null {
  if (range === "all") return null
  const d = new Date()
  d.setMonth(d.getMonth() - (range === "1M" ? 1 : 3))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getWeekDays(): string[] {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    const y = dd.getFullYear()
    const m = String(dd.getMonth() + 1).padStart(2, "0")
    const d = String(dd.getDate()).padStart(2, "0")
    days.push(`${y}-${m}-${d}`)
  }
  return days
}

const weekChartConfig = {
  volume: { label: "Volume", color: "var(--foreground)" },
} satisfies ChartConfig

const freqChartConfig = {
  days: { label: "Days", color: "var(--foreground)" },
} satisfies ChartConfig

const chartConfig = {
  weight: {
    label: "Weight",
    color: "var(--foreground)",
  },
} satisfies ChartConfig

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function TrainingAnalytics({ sessions, onOpenRecap, recapMorphEnabled = true }: TrainingAnalyticsProps) {
  const { t } = useI18n()
  const [range, setRange] = useState<Range>("3M")
  const [selectedExercise, setSelectedExercise] = useState<string>("")

  // Extract unique exercise names (case-insensitive grouping, most frequent casing)
  const exerciseNames = useMemo(() => {
    const nameMap = new Map<string, Map<string, number>>()
    for (const s of sessions) {
      for (const ex of s.exercises) {
        const key = ex.name.toLowerCase()
        if (!nameMap.has(key)) nameMap.set(key, new Map())
        const casings = nameMap.get(key)!
        casings.set(ex.name, (casings.get(ex.name) || 0) + 1)
      }
    }
    const result: { key: string; display: string; count: number }[] = []
    for (const [key, casings] of nameMap) {
      let bestCasing = ""
      let bestCount = 0
      let totalCount = 0
      for (const [casing, count] of casings) {
        totalCount += count
        if (count > bestCount) {
          bestCount = count
          bestCasing = casing
        }
      }
      result.push({ key, display: bestCasing, count: totalCount })
    }
    result.sort((a, b) => b.count - a.count)
    return result
  }, [sessions])

  // Set default exercise
  const activeExercise = selectedExercise || exerciseNames[0]?.key || ""

  const displayName = exerciseNames.find((e) => e.key === activeExercise)?.display || activeExercise

  // Filter sessions by range and compute max weight per session
  const chartData = useMemo(() => {
    const rangeDate = getRangeDate(range)
    const points: { date: string; dateLabel: string; weight: number }[] = []

    // Sort sessions by date ascending
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

    for (const s of sorted) {
      if (rangeDate && s.date < rangeDate) continue
      const matching = s.exercises.filter((ex) => ex.name.toLowerCase() === activeExercise)
      if (matching.length === 0) continue
      const maxWeight = Math.max(...matching.map((ex) => ex.weight))
      const [, m, d] = s.date.split("-")
      points.push({
        date: s.date,
        dateLabel: `${parseInt(d)}/${parseInt(m)}`,
        weight: maxWeight,
      })
    }
    return points
  }, [sessions, activeExercise, range])

  // Stats
  const pr = useMemo(() => {
    if (!activeExercise) return 0
    let max = 0
    for (const s of sessions) {
      for (const ex of s.exercises) {
        if (ex.name.toLowerCase() === activeExercise && ex.weight > max) {
          max = ex.weight
        }
      }
    }
    return max
  }, [sessions, activeExercise])

  const sessionCount = chartData.length

  const dayLabelKeys = [
    "training.mon", "training.tue", "training.wed",
    "training.thu", "training.fri", "training.sat", "training.sun",
  ] as const

  const weekVolume = useMemo(() => {
    const weekDays = getWeekDays()
    const dateSet = new Set(weekDays)
    const volumeByDate: Record<string, number> = {}
    for (const date of weekDays) volumeByDate[date] = 0
    for (const s of sessions) {
      if (dateSet.has(s.date)) {
        for (const ex of s.exercises) {
          volumeByDate[s.date] += ex.sets * ex.reps * ex.weight
        }
      }
    }
    return weekDays.map((date, i) => ({
      day: t(dayLabelKeys[i]),
      volume: volumeByDate[date],
    }))
  }, [sessions, t])

  const weekTotal = weekVolume.reduce((sum, d) => sum + d.volume, 0)

  // Streak: consecutive weeks (from current) with at least 1 session
  const streak = useMemo(() => {
    if (sessions.length === 0) return 0
    const now = new Date()
    let currentMonday = getMondayOfWeek(now)
    let count = 0
    const sessionDates = new Set(sessions.map((s) => s.date))
    for (let w = 0; w < 200; w++) {
      const weekDays: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentMonday)
        d.setDate(currentMonday.getDate() + i)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        weekDays.push(`${y}-${m}-${day}`)
      }
      const hasSession = weekDays.some((d) => sessionDates.has(d))
      if (hasSession) {
        count++
      } else {
        break
      }
      currentMonday.setDate(currentMonday.getDate() - 7)
    }
    return count
  }, [sessions])

  // Frequency this week: unique days with sessions
  const freqThisWeek = useMemo(() => {
    const weekDays = new Set(getWeekDays())
    const daysWithSession = new Set<string>()
    for (const s of sessions) {
      if (weekDays.has(s.date)) daysWithSession.add(s.date)
    }
    return daysWithSession.size
  }, [sessions])

  // Weekly frequency: last 8 weeks
  const weeklyFrequency = useMemo(() => {
    const now = new Date()
    const sessionDates = new Set(sessions.map((s) => s.date))
    const weeks: { label: string; days: number }[] = []
    for (let w = 7; w >= 0; w--) {
      const monday = getMondayOfWeek(now)
      monday.setDate(monday.getDate() - w * 7)
      const uniqueDays = new Set<string>()
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        const dateStr = `${y}-${m}-${day}`
        if (sessionDates.has(dateStr)) uniqueDays.add(dateStr)
      }
      weeks.push({ label: `${t("analytics.weekLabel")}${8 - w}`, days: uniqueDays.size })
    }
    return weeks
  }, [sessions, t])

  // Top exercises by total volume
  const topExercises = useMemo(() => {
    const volumeMap = new Map<string, number>()
    for (const s of sessions) {
      for (const ex of s.exercises) {
        const key = ex.name.toLowerCase()
        volumeMap.set(key, (volumeMap.get(key) || 0) + ex.sets * ex.reps * ex.weight)
      }
    }
    const entries = [...volumeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    return entries.map(([key, volume]) => ({
      key,
      display: exerciseNames.find((e) => e.key === key)?.display || key,
      volume,
    }))
  }, [sessions, exerciseNames])

  const hasData = sessions.length > 0

  return (
    <div className="flex flex-col gap-0">
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <button
          type="button"
          onClick={onOpenRecap}
          className="group relative w-full overflow-hidden rounded-[30px] border border-white/5 p-5 text-left shadow-[0_18px_40px_rgba(15,23,42,0.24)] transition-transform active:scale-[0.99]"
        >
          {recapMorphEnabled ? (
            <>
              <motion.div
                layoutId="training-recap-shell"
                transition={recapTransition}
                className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937_0%,#0f172a_42%,#111827_100%)]"
              />
              <motion.div
                layoutId="training-recap-glow"
                transition={recapTransition}
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)] opacity-80"
                aria-hidden
              />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937_0%,#0f172a_42%,#111827_100%)]" />
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)] opacity-80"
                aria-hidden
              />
            </>
          )}
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                {t("analytics.recapMockEyebrow")}
              </span>
              <h2 className="mt-4 text-[24px] font-black leading-[1] tracking-[-0.04em] text-white">
                {t("analytics.recapMockCta")}
              </h2>
              <p className="mt-2 max-w-[240px] text-sm leading-5 text-white/70">
                {t("analytics.recapMockCtaHint")}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition-transform duration-300 group-hover:scale-105">
              <Trophy className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>
        </button>
      </section>

      {/* Chart card with controls */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.07s" }}>
        <div className="bg-card rounded-[32px] p-5 card-shadow">
          {hasData && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                {(["1M", "3M", "all"] as Range[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                      range === r
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {r === "1M" ? t("analytics.1month") : r === "3M" ? t("analytics.3months") : t("analytics.allTime")}
                  </button>
                ))}
              </div>
              <div className="relative">
                <select
                  value={activeExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="rounded-full bg-secondary pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground outline-none appearance-none max-w-[165px] truncate"
                >
                  {exerciseNames.map((ex) => (
                    <option key={ex.key} value={ex.key}>
                      {ex.display}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} strokeWidth={3} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {!hasData ? (
            <div className="py-10 text-center">
              <BarChart3 size={36} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">{t("analytics.startTraining")}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="py-10 text-center">
              <BarChart3 size={36} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">{t("analytics.noData")}</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 4, left: -20 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, dy: 14 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)", dx: -10 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(v: number) => `${v} kg`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as (typeof chartData)[0]
                    return (
                      <div className="rounded-xl bg-background border border-border/50 px-3 py-2 shadow-xl text-xs">
                        <p className="font-semibold">{p.date}</p>
                        <p className="text-muted-foreground">{p.weight} kg</p>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--foreground)"
                  strokeWidth={2.5}
                  fill="url(#weightGradient)"
                  dot={{ r: 4, fill: "var(--foreground)" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </section>

      {/* PR + Sessions row */}
      <section className="grid grid-cols-2 gap-3 px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.13s" }}>
        <div className="bg-card rounded-[20px] p-5 card-shadow text-center">
          <TrendingUp size={20} className="mx-auto mb-2 text-emerald-500" />
          <span className="text-2xl font-black tracking-tighter" style={{ fontVariantNumeric: "tabular-nums" }}>
            {pr} <span className="text-sm font-bold text-muted-foreground">kg</span>
          </span>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pt-1">
            {t("analytics.personalRecord")}
          </p>
        </div>
        <div className="bg-card rounded-[20px] p-5 card-shadow text-center">
          <BarChart3 size={20} className="mx-auto mb-2 text-blue-500" />
          <span className="text-2xl font-black tracking-tighter" style={{ fontVariantNumeric: "tabular-nums" }}>
            {sessionCount}
          </span>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pt-1">
            {t("analytics.sessions")}
          </p>
        </div>
      </section>

      {/* Top exercises */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <div className="bg-card rounded-[32px] p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
              {t("analytics.topExercises")}
            </p>
          </div>
          {topExercises.length > 0 ? (
            <div className="space-y-0">
              {topExercises.map((ex, i) => (
                <div
                  key={ex.key}
                  className={`flex items-center justify-between py-2.5 ${i < topExercises.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs font-bold w-5">#{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{ex.display}</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {ex.volume.toLocaleString()} kg
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-2">{t("analytics.noData")}</p>
          )}
        </div>
      </section>

      {/* Weekly frequency chart */}
      <section className="px-6 pt-4 animate-slide-up" style={{ animationDelay: "0.17s" }}>
        <div className="bg-card rounded-[32px] p-6 card-shadow">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
            {t("analytics.weeklyFrequency")}
          </p>
          <ChartContainer config={freqChartConfig} className="h-[120px] w-full">
            <BarChart data={weeklyFrequency} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis domain={[0, 7]} hide />
              <Bar
                dataKey="days"
                fill="var(--foreground)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </section>
    </div>
  )
}
