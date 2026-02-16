"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import {
  getMeals,
  saveMeal,
  deleteMeal,
  getTodayString,
  getProfile,
  type Meal,
} from "@/lib/storage"
import { useI18n, type TranslationKey } from "@/lib/i18n"
import { Plus, Trash2, UtensilsCrossed, X, ChevronLeft, ChevronRight } from "lucide-react"

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

interface MealsViewProps {
  onUpdate: () => void
}

export function MealsView({ onUpdate }: MealsViewProps) {
  const { t, locale } = useI18n()
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [showForm, setShowForm] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

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

  const isToday = selectedDate === getTodayString()
  const dateLabel = isToday
    ? t("date.today")
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
          onClick={() => setShowForm(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("meals.logMeal")}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Date selector */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-2 py-1.5">
        <button
          onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="relative cursor-pointer" onClick={() => dateInputRef.current?.showPicker()}>
          <span className={`block rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors select-none ${isToday ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"}`}>
            {dateLabel}
          </span>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="date-picker-input"
            tabIndex={-1}
          />
        </div>
        <button
          onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Nutrition Summary Card */}
      <NutritionSummary totals={totals} />

      {showForm && (
        <MealForm
          onSave={() => {
            setShowForm(false)
            refresh()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {filteredMeals.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <UtensilsCrossed className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("meals.noMeals")}</p>
          <p className="text-xs text-muted-foreground/70">{t("meals.tapToLog")}</p>
        </div>
      )}

      {/* Meal list */}
      <div className="flex flex-col gap-2">
        {filteredMeals.map((meal) => (
          <div
            key={meal.id}
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
              onClick={() => handleDelete(meal.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              aria-label={`${t("training.deleteTraining")} ${meal.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
              <stop offset="0%" stopColor="#FF6B00" />
              <stop offset="100%" stopColor="#CC5500" />
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
            stroke={isOver ? "var(--destructive)" : "url(#arc-gradient)"}
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
          color="#FF6B00"
        />
        <MacroProgressBar
          label={t("macro.carbs")}
          current={totals.carbs}
          goal={carbsGoal}
          color="#22c55e"
        />
        <MacroProgressBar
          label={t("macro.fat")}
          current={totals.fat}
          goal={fatGoal}
          color="#eab308"
        />
      </div>
    </div>
  )
}

function MacroProgressBar({
  label,
  current,
  goal,
  color,
}: {
  label: string
  current: number
  goal: number
  color: string
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
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function MealForm({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState("")
  const [date, setDate] = useState(getTodayString())
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  )
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !calories) return

    saveMeal({
      name: name.trim(),
      date,
      time,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    })
    onSave()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t("meals.logMeal")}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label={t("profile.cancel")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder={t("meals.mealName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("macro.calories")}</label>
          <input
            type="number"
            placeholder="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            min="0"
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("meals.macrosGrams")}</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] text-chart-1">{t("macro.protein")}</label>
              <input
                type="number"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-chart-4">{t("macro.carbs")}</label>
              <input
                type="number"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
                className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-chart-3">{t("macro.fat")}</label>
              <input
                type="number"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                min="0"
                className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {t("meals.saveMeal")}
        </button>
      </div>
    </form>
  )
}

