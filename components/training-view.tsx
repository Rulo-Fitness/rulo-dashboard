"use client"

import { useEffect, useState } from "react"
import {
  getTrainingSessions,
  saveTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  getTodayString,
  type TrainingSession,
  type Exercise,
} from "@/lib/storage"
import { useI18n, type TranslationKey } from "@/lib/i18n"
import { Plus, Trash2, Dumbbell, X, ChevronDown, ChevronUp, Pencil } from "lucide-react"

const DAY_OPTIONS = [
  { value: "monday", labelKey: "training.dayMonday" as TranslationKey },
  { value: "tuesday", labelKey: "training.dayTuesday" as TranslationKey },
  { value: "wednesday", labelKey: "training.dayWednesday" as TranslationKey },
  { value: "thursday", labelKey: "training.dayThursday" as TranslationKey },
  { value: "friday", labelKey: "training.dayFriday" as TranslationKey },
  { value: "saturday", labelKey: "training.daySaturday" as TranslationKey },
  { value: "sunday", labelKey: "training.daySunday" as TranslationKey },
]

function getDayLabel(value: string, t: (k: TranslationKey) => string): string {
  const day = DAY_OPTIONS.find((d) => d.value === value)
  return day ? t(day.labelKey) : value
}

interface TrainingViewProps {
  onUpdate: () => void
}

export function TrainingView({ onUpdate }: TrainingViewProps) {
  const { t } = useI18n()
  const [trainings, setTrainings] = useState<TrainingSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTraining, setEditingTraining] = useState<TrainingSession | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setTrainings(getTrainingSessions())
  }, [])

  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)
  useEffect(() => {
    if (!hasAutoExpanded && trainings.length > 0) {
      setExpandedId(trainings[0].id)
      setHasAutoExpanded(true)
    }
  }, [trainings, hasAutoExpanded])

  const refresh = () => {
    setTrainings(getTrainingSessions())
    onUpdate()
  }

  const handleDelete = (id: string) => {
    deleteTrainingSession(id)
    if (expandedId === id) setExpandedId(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("training.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("training.subtitle")}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingTraining(null) }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("training.newTraining")}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {(showForm || editingTraining) && (
        <TrainingForm
          initialTraining={editingTraining}
          onSave={() => {
            setShowForm(false)
            setEditingTraining(null)
            refresh()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingTraining(null)
          }}
        />
      )}

      {trainings.length === 0 && !showForm && (
        <div className="flex h-[calc(100dvh-14rem)] flex-col items-center justify-center text-center">
          <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
            <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">{t("training.noTrainings")}</p>
            <p className="text-xs text-muted-foreground/70">{t("training.tapToLog")}</p>
          </div>
        </div>
      )}

      {trainings.length > 0 && (
        <div className="flex flex-col gap-2">
          {trainings.map((training) => {
            const isExpanded = expandedId === training.id

            return (
              <div
                key={training.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex w-full items-center gap-2 p-4">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : training.id)}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left transition-colors hover:bg-secondary/30 rounded-lg -m-1 p-1"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold capitalize text-foreground">{getDayLabel(training.name, t)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {training.exercises.length} {t("dashboard.exercises")}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingTraining(training); setShowForm(false) }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                    aria-label={t("training.editTraining")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(training.id) }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("training.deleteTraining")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="rounded-lg bg-secondary/40 p-3">
                      <div className="flex flex-col gap-1.5">
                        {training.exercises.map((ex) => (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2"
                          >
                            <span className="text-sm text-foreground">{ex.name}</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {ex.sets}x{ex.reps} @ {ex.weight}{t("unit.kg")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TrainingForm({
  initialTraining,
  onSave,
  onCancel,
}: {
  initialTraining?: TrainingSession | null
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const isEdit = Boolean(initialTraining?.id)
  const [name, setName] = useState(() => {
    if (initialTraining?.name && DAY_OPTIONS.some((d) => d.value === initialTraining.name)) {
      return initialTraining.name
    }
    return "monday"
  })
  const [exercises, setExercises] = useState<Exercise[]>(
    initialTraining?.exercises?.length
      ? initialTraining.exercises
      : [{ id: "", name: "", sets: 0, reps: 0, weight: 0 }]
  )

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        name: "",
        sets: 0,
        reps: 0,
        weight: 0,
      },
    ])
  }

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index))
    }
  }

  const updateExercise = (index: number, field: string, value: string | number) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const exercisesToSave = exercises
      .filter((ex) => ex.name.trim())
      .map((ex) =>
        ex.id
          ? ex
          : { ...ex, id: Date.now().toString(36) + Math.random().toString(36).substring(2) }
      )

    if (isEdit && initialTraining) {
      updateTrainingSession({
        id: initialTraining.id,
        name,
        date: initialTraining.date,
        exercises: exercisesToSave,
      })
    } else {
      saveTrainingSession({
        name,
        date: getTodayString(),
        exercises: exercisesToSave,
      })
    }
    onSave()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {isEdit ? t("training.editTraining") : t("training.newTraining")}
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
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("training.trainingName")}</label>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-input pl-3 pr-12 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day.value} value={day.value}>
                {t(day.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">{t("training.exercises")}</label>
            <button
              type="button"
              onClick={addExercise}
              className="text-xs font-medium text-primary"
            >
              {t("training.addExercise")}
            </button>
          </div>

          {exercises.map((ex, i) => (
            <div key={ex.id || `ex-${i}`} className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t("training.exerciseName")}
                  value={ex.name}
                  onChange={(e) => updateExercise(i, "name", e.target.value)}
                  className="h-9 flex-1 rounded-md border border-border bg-input px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    aria-label={t("profile.cancel")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.sets")}</label>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, "sets", Number(e.target.value))}
                    min="0"
                    className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.reps")}</label>
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, "reps", Number(e.target.value))}
                    min="0"
                    className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.weightKg")}</label>
                  <input
                    type="number"
                    value={ex.weight}
                    onChange={(e) => updateExercise(i, "weight", Number(e.target.value))}
                    min="0"
                    step="0.5"
                    className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {isEdit ? t("training.saveChanges") : t("training.saveTraining")}
        </button>
      </div>
    </form>
  )
}
