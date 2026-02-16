"use client"

import { useEffect, useState } from "react"
import {
  getTrainingSessions,
  saveTrainingSession,
  deleteTrainingSession,
  getTodayString,
  type TrainingSession,
  type Exercise,
} from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Plus, Trash2, Dumbbell, X, ChevronDown, ChevronUp } from "lucide-react"

interface TrainingViewProps {
  onUpdate: () => void
}

export function TrainingView({ onUpdate }: TrainingViewProps) {
  const { t, locale } = useI18n()
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setSessions(getTrainingSessions())
  }, [])

  const refresh = () => {
    setSessions(getTrainingSessions())
    onUpdate()
  }

  const handleDelete = (id: string) => {
    deleteTrainingSession(id)
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
          onClick={() => setShowForm(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("training.newSession")}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {showForm && (
        <TrainingForm
          onSave={() => {
            setShowForm(false)
            refresh()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {sessions.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("training.noSessions")}</p>
          <p className="text-xs text-muted-foreground/70">{t("training.tapToLog")}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sessions.map((session) => {
          const isExpanded = expandedId === session.id
          return (
            <div
              key={session.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
                aria-expanded={isExpanded}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.date + "T00:00:00").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    &middot; {session.duration}{t("unit.min")} &middot; {session.exercises.length} {t("dashboard.exercises")}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="flex flex-col gap-2">
                    {session.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                      >
                        <span className="text-sm text-foreground">{ex.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {ex.sets}x{ex.reps} @ {ex.weight}{t("unit.kg")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-destructive transition-colors hover:text-destructive/80"
                    aria-label={`${t("training.deleteSession")} ${session.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("training.deleteSession")}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrainingForm({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState("")
  const [date, setDate] = useState(getTodayString())
  const [duration, setDuration] = useState("")
  const [exercises, setExercises] = useState<Omit<Exercise, "id">[]>([
    { name: "", sets: 3, reps: 10, weight: 0 },
  ])

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10, weight: 0 }])
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
    if (!name.trim() || !duration) return

    saveTrainingSession({
      name: name.trim(),
      date,
      duration: Number(duration),
      exercises: exercises
        .filter((ex) => ex.name.trim())
        .map((ex) => ({
          ...ex,
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        })),
    })
    onSave()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/30 bg-card p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t("training.newSession")}</h3>
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
          placeholder={t("training.sessionName")}
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
            type="number"
            placeholder={t("training.durationMin")}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
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
            <div key={i} className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3">
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
                    min="1"
                    className="h-9 w-full rounded-md border border-border bg-input px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">{t("training.reps")}</label>
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, "reps", Number(e.target.value))}
                    min="1"
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
          {t("training.saveSession")}
        </button>
      </div>
    </form>
  )
}
