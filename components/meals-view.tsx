"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import {
  getMeals,
  saveMeal,
  updateMeal,
  deleteMeal,
  getTodayString,
  getProfile,
  type Meal,
} from "@/lib/storage"
import { useI18n, type TranslationKey } from "@/lib/i18n"
import { Plus, Trash2, UtensilsCrossed, X, ChevronLeft, ChevronRight, Pencil } from "lucide-react"

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

interface MealsViewProps {
  onUpdate: () => void
  onMealPanelChange?: (open: boolean) => void
}

export function MealsView({ onUpdate, onMealPanelChange }: MealsViewProps) {
  const { t, locale } = useI18n()
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [showPanel, setShowPanel] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setPanelOpen = (open: boolean) => {
    setShowPanel(open)
    onMealPanelChange?.(open)
  }

  const closePanel = useCallback(() => {
    setIsClosing(true)
    closeTimeoutRef.current = setTimeout(() => {
      setShowPanel(false)
      setEditingMeal(null)
      setIsClosing(false)
      onMealPanelChange?.(false)
      closeTimeoutRef.current = null
    }, 300)
  }, [onMealPanelChange])

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
  }, [])

  useEffect(() => {
    setAllMeals(getMeals())
  }, [])

  const filteredMeals = useMemo(
    () => allMeals.filter((m) => m.date === selectedDate),
    [allMeals, selectedDate]
  )

  const refresh = () => {
    setAllMeals(getMeals())
    onUpdate()
  }

  const handleDelete = (id: string) => {
    deleteMeal(id)
    refresh()
  }

  const todayStr = getTodayString()
  const yesterdayStr = shiftDate(todayStr, -1)
  const isToday = selectedDate === todayStr
  const isYesterday = selectedDate === yesterdayStr
  const dateLabel = isToday
    ? t("date.today")
    : isYesterday
      ? t("date.yesterday")
      : new Date(selectedDate + "T00:00:00").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })

  const totals = {
    calories: filteredMeals.reduce((sum, m) => sum + m.calories, 0),
    protein: filteredMeals.reduce((sum, m) => sum + m.protein, 0),
    carbs: filteredMeals.reduce((sum, m) => sum + m.carbs, 0),
    fat: filteredMeals.reduce((sum, m) => sum + m.fat, 0),
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("meals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("meals.subtitle")}</p>
        </div>
        <button
          onClick={() => { setPanelOpen(true); setEditingMeal(null) }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("meals.logMeal")}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Panel deslizante desde abajo para agregar o editar comida */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: showPanel || isClosing ? "auto" : "none",
          visibility: showPanel || isClosing ? "visible" : "hidden",
        }}
        aria-hidden={!showPanel && !isClosing}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-300"
          style={{ opacity: showPanel && !isClosing ? 1 : 0 }}
          onClick={closePanel}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-lg flex-col rounded-t-3xl bg-card shadow-xl transition-transform duration-300 ease-out max-h-[85dvh]"
          style={{ transform: showPanel && !isClosing ? "translateY(0)" : "translateY(100%)" }}
        >
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-input" aria-hidden />
          </div>
          <header className="flex shrink-0 justify-center px-4 py-3">
            <h2 className="text-center text-lg font-semibold text-foreground">
              {editingMeal ? t("meals.editMeal") : t("meals.logMeal")}
            </h2>
          </header>
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-visible px-4 py-4 pb-8">
            <div className="w-full flex-1">
            <MealForm
              initial={editingMeal ?? null}
              selectedDate={selectedDate}
              onSave={() => {
                closePanel()
                refresh()
              }}
              onCancel={closePanel}
              hideHeader
            />
            </div>
          </div>
        </div>
      </div>

      {/* Selector de día */}
      <div className="-mx-4 px-4 py-2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-2 py-1.5">
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative cursor-pointer">
            <span className={`pointer-events-none block rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors select-none ${isToday || isYesterday ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"}`}>
              {dateLabel}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              aria-label={dateLabel}
              value={selectedDate}
              max={getTodayString()}
              onChange={(e) => {
                const v = e.target.value
                if (v && v <= getTodayString()) setSelectedDate(v)
              }}
              className="date-picker-input"
              tabIndex={-1}
            />
          </div>
          <button
            onClick={() => {
              const next = shiftDate(selectedDate, 1)
              if (next <= getTodayString()) setSelectedDate(next)
            }}
            disabled={selectedDate >= getTodayString()}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Nutrition Summary Card */}
      <NutritionSummary totals={totals} />

      {filteredMeals.length === 0 && !showPanel && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <UtensilsCrossed className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("meals.noMeals")}</p>
          <p className="text-xs text-muted-foreground/70">{t("meals.tapToLog")}</p>
        </div>
      )}

      {/* Meal list */}
      <div className="flex flex-col gap-2">
        {filteredMeals.map((meal) => (
          <div key={meal.id} className="flex flex-col gap-2">
            <div
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-3/15">
                <UtensilsCrossed className="h-5 w-5 text-chart-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{meal.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{meal.time}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {meal.calories} {t("unit.cal")}
                  </span>
                  <span className="rounded-md bg-chart-1/10 px-1.5 py-0.5 text-[10px] font-medium text-chart-1">
                    P {meal.protein}{t("unit.g")}
                  </span>
                  <span className="rounded-md bg-chart-4/10 px-1.5 py-0.5 text-[10px] font-medium text-chart-4">
                    C {meal.carbs}{t("unit.g")}
                  </span>
                  <span className="rounded-md bg-chart-3/10 px-1.5 py-0.5 text-[10px] font-medium text-chart-3">
                    F {meal.fat}{t("unit.g")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setPanelOpen(true); setEditingMeal(meal) }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/15 hover:text-primary"
                aria-label={t("meals.editMeal")}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(meal.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`${t("training.deleteTraining")} ${meal.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NutritionSummary({ totals }: { totals: { calories: number; protein: number; carbs: number; fat: number } }) {
  const { t } = useI18n()
  const profile = getProfile()
  const calGoal = profile.calorieGoal || 2000
  const protGoal = profile.proteinGoal || 150
  const carbsGoal = profile.carbsGoal || 250
  const fatGoal = profile.fatGoal || 65

  const calPercent = Math.min((totals.calories / calGoal) * 100, 105)
  const isOver = totals.calories > calGoal
  const diff = isOver ? totals.calories - calGoal : calGoal - totals.calories

  const arcR = 110
  const arcStroke = 14
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const startAngle = 170
  const endAngle = 370
  const totalAngle = endAngle - startAngle
  const arcLen = (totalAngle / 360) * 2 * Math.PI * arcR
  const arcOffset = arcLen * (1 - Math.min(calPercent / 100, 1))
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const startX = cx + arcR * Math.cos(toRad(startAngle))
  const startY = cy + arcR * Math.sin(toRad(startAngle))
  const endX = cx + arcR * Math.cos(toRad(endAngle))
  const endY = cy + arcR * Math.sin(toRad(endAngle))

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Arc gauge */}
      <div className="relative mx-auto w-full" style={{ maxWidth: size, aspectRatio: "1 / 0.75" }}>
        <svg viewBox={`0 0 ${size} ${size * 0.75}`} className="w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path
            d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 1 1 ${endX} ${endY}`}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={arcStroke}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 1 1 ${endX} ${endY}`}
            fill="none"
            stroke="url(#arc-gradient)"
            strokeWidth={arcStroke}
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={arcOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: "8%" }}>
          <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
            {totals.calories.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            / {calGoal.toLocaleString()} {t("unit.kcal")}
          </p>
        </div>
      </div>
      <p className="mt-1 mb-4 text-center text-[11px] font-medium" style={{ color: isOver ? "var(--destructive)" : "var(--primary)" }}>
        {diff.toLocaleString()} {t("unit.cal")} {isOver ? t("meals.over") : t("meals.remaining")}
      </p>

      {/* Macro progress bars */}
      <div className="grid grid-cols-3 gap-4">
        <MacroProgressBar
          label={t("macro.protein")}
          current={totals.protein}
          goal={protGoal}
        />
        <MacroProgressBar
          label={t("macro.carbs")}
          current={totals.carbs}
          goal={carbsGoal}
        />
        <MacroProgressBar
          label={t("macro.fat")}
          current={totals.fat}
          goal={fatGoal}
        />
      </div>
    </div>
  )
}

function MacroProgressBar({
  label,
  current,
  goal,
}: {
  label: string
  current: number
  goal: number
}) {
  const percent = Math.min((current / goal) * 100, 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <p className="text-sm font-bold text-foreground">
        {current} <span className="font-normal text-muted-foreground">/ {goal}</span>{" "}
        <span className="text-[10px] font-normal text-muted-foreground">g</span>
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function MealForm({
  initial,
  selectedDate,
  onSave,
  onCancel,
  hideHeader = false,
}: {
  initial?: Meal | null
  selectedDate: string
  onSave: () => void
  onCancel: () => void
  hideHeader?: boolean
}) {
  const { t } = useI18n()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(initial?.id)
  const [name, setName] = useState(initial?.name ?? "")

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const [calories, setCalories] = useState(initial?.calories?.toString() ?? "")
  const [protein, setProtein] = useState(initial?.protein?.toString() ?? "")
  const [carbs, setCarbs] = useState(initial?.carbs?.toString() ?? "")
  const [fat, setFat] = useState(initial?.fat?.toString() ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !calories) return

    const time = initial?.time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    if (isEdit && initial) {
      updateMeal({
        id: initial.id,
        name: name.trim(),
        date: selectedDate,
        time,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      })
    } else {
      saveMeal({
        name: name.trim(),
        date: selectedDate,
        time,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      })
    }
    onSave()
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      {!hideHeader && (
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {isEdit ? t("meals.editMeal") : t("meals.logMeal")}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label={t("profile.cancel")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      )}

        <input
          type="text"
          placeholder="Meal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-lg bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("macro.calories")}</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            min="0"
            className="h-11 w-full rounded-lg bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("macro.protein")}</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                className="h-9 w-full rounded-md bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("macro.carbs")}</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
                className="h-9 w-full rounded-md bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("macro.fat")}</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                min="0"
                className="h-9 w-full rounded-md bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 flex h-14 w-full items-center justify-center rounded-xl bg-primary px-5 py-5 text-base font-semibold text-primary-foreground transition-colors active:scale-[0.99]"
        >
          {t("register.save")}
        </button>
    </form>
  )
}

