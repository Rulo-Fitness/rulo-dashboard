"use client"

import { useEffect, useState, useRef } from "react"
import {
  getExercisesForDate,
  addExerciseToDate,
  updateExercise,
  deleteExercise,
  getTodayString,
  type Exercise,
} from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Plus, Trash2, Dumbbell, X, ChevronLeft, ChevronRight, Pencil, Check } from "lucide-react"

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

interface TrainingViewProps {
  onUpdate: () => void
}

export function TrainingView({ onUpdate }: TrainingViewProps) {
  const { t, locale } = useI18n()
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const loadExercises = () => {
    setExercises(getExercisesForDate(selectedDate))
  }

  useEffect(() => {
    loadExercises()
  }, [selectedDate])

  const refresh = () => {
    loadExercises()
    onUpdate()
  }

  const handleDelete = (exId: string) => {
    deleteExercise(exId)
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

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("training.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("training.subtitle")}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingExercise(null) }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("training.addExercise")}
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

      {/* Add form (only when adding new, at top) */}
      {showForm && !editingExercise && (
        <ExerciseForm
          initial={null}
          selectedDate={selectedDate}
          onSave={() => {
            setShowForm(false)
            refresh()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Empty state */}
      {exercises.length === 0 && !showForm && !editingExercise && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("training.noExercises")}</p>
          <p className="text-xs text-muted-foreground/70">{t("training.tapToAdd")}</p>
        </div>
      )}

      {/* Exercise list: edit form renders above the exercise being edited */}
      {exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-2">
              {editingExercise?.id === ex.id && (
                <ExerciseForm
                  initial={editingExercise}
                  selectedDate={selectedDate}
                  onSave={() => {
                    setEditingExercise(null)
                    refresh()
                  }}
                  onCancel={() => setEditingExercise(null)}
                />
              )}
              <div
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ex.name}</p>
                  <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                    <span>{ex.sets} {t("training.sets")}</span>
                    <span>{ex.reps} {t("training.reps")}</span>
                    <span>{ex.weight}{t("unit.kg")}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingExercise(ex); setShowForm(false) }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                  aria-label={t("training.editExercise")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(ex.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("training.deleteTraining")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExerciseForm({
  initial,
  selectedDate,
  onSave,
  onCancel,
}: {
  initial?: Exercise | null
  selectedDate: string
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(initial?.id)
  const [name, setName] = useState(initial?.name ?? "")
  const [sets, setSets] = useState(initial?.sets?.toString() ?? "")
  const [reps, setReps] = useState(initial?.reps?.toString() ?? "")
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "")

  useEffect(() => {
    if (isEdit && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [isEdit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (isEdit && initial) {
      updateExercise(selectedDate, {
        id: initial.id,
        name: name.trim(),
        sets: Number(sets) || 0,
        reps: Number(reps) || 0,
        weight: Number(weight) || 0,
      })
    } else {
      addExerciseToDate(selectedDate, {
        name: name.trim(),
        sets: Number(sets) || 0,
        reps: Number(reps) || 0,
        weight: Number(weight) || 0,
      })
    }
    onSave()
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {isEdit ? t("training.editExercise") : t("training.addExercise").replace(/^\+\s*/, "")}
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

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder={t("training.exerciseName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          required
          autoFocus
        />

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.sets")}</label>
            <input
              type="number"
              placeholder="0"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              min="0"
              className="h-10 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.reps")}</label>
            <input
              type="number"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min="0"
              className="h-10 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.weightKg")}</label>
            <input
              type="number"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0"
              step="0.5"
              className="h-10 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {isEdit ? t("training.saveChanges") : t("training.saveExercise")}
        </button>
      </div>
    </form>
  )
}
