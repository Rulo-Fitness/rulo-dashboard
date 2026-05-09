"use client"

import { useEffect, useState, useMemo, useRef, type SVGProps } from "react"
import {
  getMeals,
  saveMeal,
  updateMeal,
  deleteMeal,
  getTodayString,
  getProfile,
  type Meal,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import { fetchMealsForDate, createMeal, updateMealApi, deleteMealApi } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { useSubscription } from "@/lib/hooks/use-subscription"
import { Plus, ChevronLeft, ChevronRight, ArrowLeft, Zap, Wheat } from "lucide-react"
import { DeleteConfirmSheet, SwipeActionRow } from "@/components/swipe-action-row"

function BananaStatic({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5" />
      <path d="M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8 0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11Z" />
    </svg>
  )
}

function AvocadoIcon({
  className,
  size = 13,
  strokeWidth = 2.5,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.2 3.2C8.8 3.2 6 6.7 6 11.1 6 16.8 9.3 21 12.2 21s6.2-4.2 6.2-9.9c0-4.4-2.8-7.9-6.2-7.9Z" />
      <path d="M12.2 9.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
    </svg>
  )
}

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
  const { user } = useAuth()
  const { isActive: subActive } = useSubscription()
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null)
  const [openSwipeMealId, setOpenSwipeMealId] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(false)

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
    if (!user?.id) {
      setAllMeals(getMeals().filter((m) => m.date === selectedDate))
      return
    }
    let cancelled = false
    setApiLoading(true)
    fetchMealsForDate(user.id, selectedDate)
      .then((meals) => {
        if (!cancelled) {
          setAllMeals(meals)
          setApiLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllMeals(getMeals().filter((m) => m.date === selectedDate))
          setApiLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [user?.id, selectedDate])

  const filteredMeals = useMemo(
    () => user?.id ? allMeals : allMeals.filter((m) => m.date === selectedDate),
    [allMeals, selectedDate, user?.id]
  )

  const refresh = (): Promise<void> => {
    if (user?.id) {
      setApiLoading(true)
      return fetchMealsForDate(user.id, selectedDate)
        .then((meals) => {
          setAllMeals(meals)
          onUpdate()
        })
        .catch(() => setAllMeals(getMeals().filter((m) => m.date === selectedDate)))
        .finally(() => setApiLoading(false))
    }
    setAllMeals(getMeals().filter((m) => m.date === selectedDate))
    onUpdate()
    return Promise.resolve()
  }

  const handleDeleteConfirm = async (id: string) => {
    setDeletingMealId(null)
    setOpenSwipeMealId(null)
    if (user?.id) {
      const previous = allMeals.filter((m) => m.id !== id)
      setAllMeals(previous)
      onUpdate()
      const ok = await deleteMealApi(id)
      if (!ok) {
        await refresh()
      }
    } else {
      deleteMeal(id)
      refresh()
    }
  }

  const todayStr = getTodayString()
  const yesterdayStr = shiftDate(todayStr, -1)
  const isToday = selectedDate === todayStr
  const isYesterday = selectedDate === yesterdayStr
  const emptyTitle = isToday ? t("meals.emptyTodayTitle") : t("meals.emptyPastTitle")
  const emptySubtitle = isToday ? t("meals.emptyTodaySubtitle") : t("meals.emptyPastSubtitle")
  const pendingDeleteMeal = deletingMealId
    ? filteredMeals.find((meal) => meal.id === deletingMealId) ?? null
    : null
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
          disabled={!subActive}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 ${!subActive ? "opacity-40 pointer-events-none" : ""}`}
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
          <header className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-3 border-b border-border">
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
                onSave={async (data) => {
                  if (user?.id) {
                    if (data.id) {
                      const ok = await updateMealApi(data.id, {
                        name: data.name,
                        calories: data.calories,
                        protein: data.protein,
                        carbs: data.carbs,
                        fat: data.fat,
                      })
                      if (ok) {
                        setAllMeals((prev) =>
                          prev.map((m) =>
                            m.id === data.id
                              ? { ...m, name: data.name, calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat }
                              : m
                          )
                        )
                        onUpdate()
                      }
                    } else {
                      const created = await createMeal(user.id, {
                        date: selectedDate,
                        name: data.name,
                        calories: data.calories,
                        protein: data.protein,
                        carbs: data.carbs,
                        fat: data.fat,
                      })
                      if (created) {
                        setAllMeals((prev) => [
                          ...prev,
                          {
                            id: created.id,
                            date: created.date?.slice(0, 10) ?? selectedDate,
                            name: created.name ?? "",
                            time: "",
                            calories: created.calories ?? 0,
                            protein: created.protein ?? 0,
                            carbs: created.carbs ?? 0,
                            fat: created.fat ?? 0,
                          },
                        ])
                        onUpdate()
                      }
                    }
                  } else {
                    const time = editingMeal?.time ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
                    if (data.id) {
                      updateMeal({ id: data.id, date: selectedDate, time, ...data })
                    } else {
                      saveMeal({ date: selectedDate, time, ...data })
                    }
                    setAllMeals(getMeals().filter((m) => m.date === selectedDate))
                    onUpdate()
                  }
                  closeForm()
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

      {/* Nutrition Summary — arc gauge + macros */}
      <div className="rounded-[32px] bg-card pt-1 px-5 pb-10 card-shadow">
        {/* Arc gauge */}
        <div className="relative -mt-8 mx-auto" style={{ width: "100%", maxWidth: "320px", height: "210px" }}>
          <svg viewBox="0 0 320 210" className="w-full h-full">
            <defs>
              <linearGradient id="arcFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--foreground)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path
              d="M 20 200 A 140 140 0 1 1 300 200"
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Filled arc with fade */}
            <path
              d="M 20 200 A 140 140 0 1 1 300 200"
              fill="none"
              stroke="url(#arcFade)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray="710"
              strokeDashoffset={710 - 710 * Math.min(totals.calories / calGoal, 1)}
              className="transition-all duration-700"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-x-0 top-[44%] flex flex-col items-center">
            <span className="text-5xl font-black tracking-tighter" style={{ fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {totals.calories}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
              kcal {isOver ? t("meals.over") : ""}
            </span>
            <span className="text-xs text-muted-foreground font-bold mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
              {isOver ? `+${totals.calories - calGoal}` : `${calGoal - totals.calories} ${t("meals.remaining")}`}
            </span>
          </div>
        </div>

        {/* Macros */}
        <div className="mt-6 pt-2">
          {/* Protein — full width */}
          <div className="mb-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-muted-foreground/50" strokeWidth={2.5} />
                <span className="text-[11px] font-semibold text-muted-foreground">{t("macro.protein")}</span>
              </div>
              <div style={{ fontVariantNumeric: "tabular-nums" }}>
                <span className="text-sm font-black tracking-tighter">{totals.protein}</span>
                <span className="text-[10px] text-muted-foreground font-bold ml-0.5">/ {protGoal}g</span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${Math.min(Math.round((totals.protein / protGoal) * 100), 100)}%` }} />
            </div>
          </div>
          {/* Carbs + Fat — side by side */}
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: t("macro.carbs"), current: totals.carbs, goal: carbsGoal, icon: Wheat },
              { label: t("macro.fat"), current: totals.fat, goal: fatGoal, icon: AvocadoIcon },
            ] as const).map((macro) => (
              <div key={macro.label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <macro.icon size={13} className="text-muted-foreground/50" strokeWidth={2.5} />
                    <span className="text-[11px] font-semibold text-muted-foreground">{macro.label}</span>
                  </div>
                  <div style={{ fontVariantNumeric: "tabular-nums" }}>
                    <span className="text-sm font-black tracking-tighter">{macro.current}</span>
                    <span className="text-[10px] text-muted-foreground font-bold ml-0.5">/ {macro.goal}g</span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${Math.min(Math.round((macro.current / macro.goal) * 100), 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filteredMeals.length === 0 && !showForm && (
        <div className="bg-card rounded-[32px] px-8 py-9 card-shadow text-center">
          <BananaStatic className="h-12 w-12 mx-auto mb-5 text-muted-foreground/25" />
          <p className="text-[17px] font-semibold tracking-tight text-foreground">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-[240px] text-sm leading-5 text-muted-foreground">
            {emptySubtitle}
          </p>
        </div>
      )}

      {/* Meal list */}
      {filteredMeals.length > 0 && (
        <div className="bg-card rounded-[32px] overflow-hidden card-shadow">
          {filteredMeals.map((meal, idx) => (
            <div key={meal.id}>
              {idx > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
              <SwipeActionRow
                isOpen={openSwipeMealId === meal.id}
                disabled={!subActive}
                editLabel={t("actions.edit")}
                deleteLabel={t("actions.delete")}
                onOpen={() => setOpenSwipeMealId(meal.id)}
                onClose={() => setOpenSwipeMealId(null)}
                onEdit={() => {
                  setOpenSwipeMealId(null)
                  openForm(meal)
                }}
                onDelete={() => {
                  setOpenSwipeMealId(null)
                  setDeletingMealId(meal.id)
                }}
              >
                <div className="px-5 py-4 min-h-[68px] flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-foreground shrink-0">
                    <BananaStatic className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="min-w-0 truncate text-[17px] font-medium leading-tight text-foreground">
                      {meal.name}
                    </h4>
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium leading-5 text-muted-foreground">
                      <span className="flex shrink-0 items-center gap-1.5" aria-label={`${t("macro.protein")} ${meal.protein}g`}>
                        <Zap size={13} strokeWidth={2.5} aria-hidden="true" />
                        {meal.protein}g
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5" aria-label={`${t("macro.carbs")} ${meal.carbs}g`}>
                        <Wheat size={13} strokeWidth={2.5} aria-hidden="true" />
                        {meal.carbs}g
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5" aria-label={`${t("macro.fat")} ${meal.fat}g`}>
                        <AvocadoIcon size={13} strokeWidth={2.5} aria-hidden="true" />
                        {meal.fat}g
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-bold leading-5 text-background">
                    {meal.calories} {t("unit.cal")}
                  </span>
                </div>
              </SwipeActionRow>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmSheet
        open={Boolean(pendingDeleteMeal)}
        title={t("meals.deleteMealConfirm")}
        itemName={pendingDeleteMeal?.name ?? ""}
        cancelLabel={t("profile.cancel")}
        confirmLabel={t("actions.delete")}
        onCancel={() => setDeletingMealId(null)}
        onConfirm={() => {
          if (pendingDeleteMeal) void handleDeleteConfirm(pendingDeleteMeal.id)
        }}
      />

    </div>
  )
}

type MealPayload = {
  id?: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
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
  onSave: (data: MealPayload) => void | Promise<void>
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
    const payload: MealPayload = {
      ...(isEdit && initial ? { id: initial.id } : {}),
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    }
    onSave(payload)
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
