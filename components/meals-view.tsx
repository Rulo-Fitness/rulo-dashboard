"use client"

import { useEffect, useState } from "react"
import {
  getMeals,
  saveMeal,
  deleteMeal,
  getTodayString,
  getTodayMeals,
  type Meal,
} from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Plus, Trash2, UtensilsCrossed, X, Flame, Beef, Wheat, Droplets } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface MealsViewProps {
  onUpdate: () => void
}

export function MealsView({ onUpdate }: MealsViewProps) {
  const { t, locale } = useI18n()
  const [meals, setMeals] = useState<Meal[]>([])
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    setMeals(getMeals())
    setTodayMeals(getTodayMeals())
  }, [])

  const refresh = () => {
    setMeals(getMeals())
    setTodayMeals(getTodayMeals())
    onUpdate()
  }

  const handleDelete = (id: string) => {
    deleteMeal(id)
    refresh()
  }

  const todayTotals = {
    calories: todayMeals.reduce((sum, m) => sum + m.calories, 0),
    protein: todayMeals.reduce((sum, m) => sum + m.protein, 0),
    carbs: todayMeals.reduce((sum, m) => sum + m.carbs, 0),
    fat: todayMeals.reduce((sum, m) => sum + m.fat, 0),
  }

  const macroData = [
    { name: t("macro.protein"), value: todayTotals.protein, color: "var(--chart-1)" },
    { name: t("macro.carbs"), value: todayTotals.carbs, color: "var(--chart-4)" },
    { name: t("macro.fat"), value: todayTotals.fat, color: "var(--chart-3)" },
  ]

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

      {/* Today's Macro Summary */}
      {todayMeals.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("meals.todayTotals")}
          </h3>

          {/* Calories total */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayTotals.calories}</p>
              <p className="text-xs text-muted-foreground">{t("meals.totalCalories")}</p>
            </div>
          </div>

          {/* Macro bars */}
          <div className="mb-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={macroData} barCategoryGap="30%">
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis hide />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Macro detail row */}
          <div className="grid grid-cols-3 gap-3">
            <MacroDetail icon={Beef} label={t("macro.protein")} value={`${todayTotals.protein}${t("unit.g")}`} color="text-chart-1" />
            <MacroDetail icon={Wheat} label={t("macro.carbs")} value={`${todayTotals.carbs}${t("unit.g")}`} color="text-chart-4" />
            <MacroDetail icon={Droplets} label={t("macro.fat")} value={`${todayTotals.fat}${t("unit.g")}`} color="text-chart-3" />
          </div>
        </div>
      )}

      {showForm && (
        <MealForm
          onSave={() => {
            setShowForm(false)
            refresh()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {meals.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <UtensilsCrossed className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("meals.noMeals")}</p>
          <p className="text-xs text-muted-foreground/70">{t("meals.tapToLog")}</p>
        </div>
      )}

      {/* Meal list */}
      <div className="flex flex-col gap-2">
        {meals.map((meal) => (
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
              <p className="text-xs text-muted-foreground">
                {new Date(meal.date + "T00:00:00").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
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
              aria-label={`${t("training.deleteSession")} ${meal.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MacroDetail({
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
