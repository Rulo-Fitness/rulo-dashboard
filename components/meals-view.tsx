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
    <div className="flex flex-col gap-4 px-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("meals.title")}</h1>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("meals.logMeal")}
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
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
      <div className="-mx-6 px-6 py-2">
        <div className="flex items-center justify-between rounded-[32px] bg-card px-3 py-2 card-shadow">
          <button
            onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="relative cursor-pointer">
            <span className={`pointer-events-none block rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors select-none ${isToday || isYesterday ? "bg-secondary text-foreground font-bold" : "text-foreground hover:bg-secondary"}`}>
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
      <div className="rounded-[32px] bg-card p-6 card-shadow">
        <div className="flex justify-center pb-3">
          <CalorieRing
            current={totals.calories}
            goal={calGoal}
            size={140}
            label={isOver ? t("meals.over") : t("meals.remaining")}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MacroRingCard label={t("macro.protein")} current={totals.protein} goal={protGoal} color="#10B981" />
          <MacroRingCard label={t("macro.carbs")} current={totals.carbs} goal={carbsGoal} color="#F59E0B" />
          <MacroRingCard label={t("macro.fat")} current={totals.fat} goal={fatGoal} color="#8B5CF6" />
        </div>
      </div>

      {filteredMeals.length === 0 && !showForm && (
        <div className="bg-card rounded-[32px] p-8 card-shadow text-center">
          <UtensilsCrossed size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-foreground font-medium">{t("meals.noMeals")}</p>
          <p className="text-muted-foreground text-sm mt-1">{t("meals.tapToLog")}</p>
        </div>
      )}

      {/* Meal list */}
      {filteredMeals.length > 0 && (
        <div className="bg-card rounded-[32px] overflow-hidden card-shadow">
          {filteredMeals.map((meal, idx) => (
            <div key={meal.id}>
              {idx > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
              <div className="px-5 py-3 min-h-[56px] flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-foreground shrink-0">
                  <UtensilsCrossed className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] text-foreground truncate">{meal.name}</h4>
                  <p className="text-muted-foreground text-xs font-medium">
                    {meal.time} · {meal.calories} {t("unit.cal")} · P{meal.protein} C{meal.carbs} F{meal.fat}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openForm(meal)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                    aria-label={t("meals.editMeal")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`${t("training.deleteTraining")} ${meal.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
          className="h-12 w-full rounded-2xl bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
            className="h-12 w-full rounded-2xl bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
              className="h-12 w-full rounded-2xl bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
              className="h-12 w-full rounded-2xl bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
              className="h-12 w-full rounded-2xl bg-input px-2 text-center text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-foreground text-base font-bold text-background transition-colors active:scale-[0.99]"
        >
          {t("register.save")}
        </button>
    </form>
  )
}
