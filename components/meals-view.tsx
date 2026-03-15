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
import { Plus, Trash2, UtensilsCrossed, X, ChevronLeft, ChevronRight, Pencil, ArrowLeft } from "lucide-react"
import { CalorieRing } from "@/components/ui/calorie-ring"
import { MacroRingCard } from "@/components/ui/macro-ring-card"

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
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  const openForm = (meal: Meal | null = null) => {
    setEditingMeal(meal)
    setShowForm(true)
    onMealPanelChange?.(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingMeal(null)
    onMealPanelChange?.(false)
  }

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

  const profile = getProfile()
  const calGoal = profile.calorieGoal || 2000
  const protGoal = profile.proteinGoal || 150
  const carbsGoal = profile.carbsGoal || 250
  const fatGoal = profile.fatGoal || 65
  const isOver = totals.calories > calGoal

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("meals.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("meals.subtitle")}</p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("meals.logMeal")}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Full-screen form — slides from right */}
      <div
        className="fixed inset-0 z-50 bg-background transition-transform duration-300 ease-out"
        style={{
          transform: showForm ? "translateX(0)" : "translateX(100%)",
          pointerEvents: showForm ? "auto" : "none",
        }}
      >
        <div className="mx-auto flex h-full max-w-lg flex-col">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 border-b border-border">
            <button
              type="button"
              onClick={closeForm}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-secondary active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              {editingMeal ? t("meals.editMeal") : t("meals.logMeal")}
            </h2>
          </header>
          {/* Form body */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {showForm && (
              <MealForm
                initial={editingMeal ?? null}
                selectedDate={selectedDate}
                onSave={() => {
                  closeForm()
                  refresh()
                }}
                onCancel={closeForm}
                hideHeader
              />
            )}
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

      {/* Nutrition Summary — CalorieRing + MacroRingCards */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex justify-center pb-3">
          <CalorieRing
            current={totals.calories}
            goal={calGoal}
            size={140}
            label={isOver ? t("meals.over") : t("meals.remaining")}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MacroRingCard label={t("macro.protein")} current={totals.protein} goal={protGoal} color="#FF6B00" />
          <MacroRingCard label={t("macro.carbs")} current={totals.carbs} goal={carbsGoal} color="#F59E0B" />
          <MacroRingCard label={t("macro.fat")} current={totals.fat} goal={fatGoal} color="#8B5CF6" />
        </div>
      </div>

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
          <div key={meal.id} className="flex flex-col gap-2">
            <div
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              style={{ borderLeft: "3px solid #F59E0B" }}
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
                onClick={() => openForm(meal)}
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
      className="flex flex-col gap-4"
    >
        <input
          type="text"
          placeholder="Meal Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 w-full rounded-xl bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          required
          autoFocus
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
            className="h-12 w-full rounded-xl bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("macro.protein")}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              min="0"
              className="h-12 w-full rounded-xl bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("macro.carbs")}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              min="0"
              className="h-12 w-full rounded-xl bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("macro.fat")}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              min="0"
              className="h-12 w-full rounded-xl bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-colors active:scale-[0.99]"
        >
          {t("register.save")}
        </button>
    </form>
  )
}
