"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  getExercisesForDate,
  addExerciseToDate,
  updateExercise,
  deleteExercise,
  getTodayString,
  type Exercise,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import { fetchWorkoutLogsForDate, createWorkoutLog, updateWorkoutLog, deleteWorkoutLog } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { Plus, Trash2, Dumbbell, ChevronLeft, ChevronRight, Pencil, Check, X, ArrowLeft } from "lucide-react"

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

interface TrainingViewProps {
  onUpdate: () => void
  onAddPanelChange?: (open: boolean) => void
}

export function TrainingView({ onUpdate, onAddPanelChange }: TrainingViewProps) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [addFormKey, setAddFormKey] = useState(0)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const openForm = (ex: Exercise | null = null) => {
    if (!ex) setAddFormKey((k) => k + 1)
    setEditingExercise(ex)
    setShowForm(true)
    onAddPanelChange?.(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingExercise(null)
    onAddPanelChange?.(false)
  }

  useEffect(() => {
    if (!user?.id) {
      setExercises(getExercisesForDate(selectedDate))
      return
    }
    let cancelled = false
    setApiLoading(true)
    fetchWorkoutLogsForDate(user.id, selectedDate)
      .then((list) => {
        if (!cancelled) {
          setExercises(list)
          setApiLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExercises(getExercisesForDate(selectedDate))
          setApiLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, selectedDate])

  const refresh = (): Promise<void> => {
    if (user?.id) {
      setApiLoading(true)
      return fetchWorkoutLogsForDate(user.id, selectedDate)
        .then((list) => {
          setExercises(list)
          onUpdate()
        })
        .catch(() => setExercises(getExercisesForDate(selectedDate)))
        .finally(() => setApiLoading(false))
    }
    setExercises(getExercisesForDate(selectedDate))
    onUpdate()
    return Promise.resolve()
  }

  const handleDeleteConfirm = async (exId: string) => {
    setDeletingExerciseId(null)
    if (user?.id) {
      const previous = exercises.filter((e) => e.id !== exId)
      setExercises(previous)
      onUpdate()
      const ok = await deleteWorkoutLog(exId)
      if (!ok) {
        await refresh()
      }
    } else {
      deleteExercise(exId)
      refresh()
    }
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("training.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("training.subtitle")}</p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
          aria-label={t("training.addExercise")}
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
              {editingExercise ? t("training.editExercise") : t("training.addExercise").replace(/^\+\s*/, "")}
            </h2>
          </header>
          {/* Form body */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {showForm && (
              <ExerciseForm
                key={editingExercise ? editingExercise.id : `new-${addFormKey}`}
                initial={editingExercise}
                selectedDate={selectedDate}
                onSave={async (data) => {
                  if (user?.id) {
                    let ok = false
                    if (data.id) {
                      ok = await updateWorkoutLog(data.id, {
                        name: data.name,
                        sets: data.sets,
                        reps: data.reps,
                        weight: data.weight,
                      })
                      if (ok) {
                        setExercises((prev) =>
                          prev.map((ex) =>
                            ex.id === data.id
                              ? { id: data.id!, name: data.name, sets: data.sets, reps: data.reps, weight: data.weight }
                              : ex
                          )
                        )
                        onUpdate()
                      }
                    } else {
                      const created = await createWorkoutLog(user.id, {
                        date: selectedDate,
                        name: data.name,
                        sets: data.sets,
                        reps: data.reps,
                        weight: data.weight,
                      })
                      if (created) {
                        setExercises((prev) => [
                          ...prev,
                          {
                            id: created.id,
                            name: created.name ?? "",
                            sets: created.sets ?? 0,
                            reps: created.reps ?? 0,
                            weight: created.weight ?? 0,
                          },
                        ])
                        onUpdate()
                        ok = true
                      }
                    }
                    if (ok) closeForm()
                  } else {
                    if (data.id) {
                      updateExercise(selectedDate, { ...data, id: data.id })
                    } else {
                      addExerciseToDate(selectedDate, data)
                    }
                    refresh()
                    closeForm()
                  }
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
        <div className="flex items-center justify-between rounded-xl bg-card px-2 py-1.5">
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

      {/* Training summary card */}
      {!apiLoading && exercises.length > 0 && (() => {
        const totalVolume = exercises.reduce((sum, ex) => sum + ex.sets * ex.reps * ex.weight, 0)
        return (
          <div className="rounded-[16px] bg-card overflow-hidden card-warm">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#3B82F6]">
                <Dumbbell className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="flex flex-1 gap-6">
                <div>
                  <p className="text-[18px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{exercises.length}</p>
                  <p className="text-[11px] text-muted-foreground">{t("dashboard.totalExercises")}</p>
                </div>
                {totalVolume > 0 && (
                  <div>
                    <p className="text-[18px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{totalVolume.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">{t("unit.kg")} {t("dashboard.todayVolume")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Área de contenido: carga, vacío o lista */}
      <div className="flex min-h-0 flex-1 flex-col">
        {user?.id && apiLoading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12">
            <p className="text-sm text-muted-foreground">Cargando entrenos…</p>
          </div>
        )}

        {!apiLoading && exercises.length === 0 && !showForm && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">{t("training.noExercises")}</p>
            <p className="text-xs text-muted-foreground/70">{t("training.tapToAdd")}</p>
          </div>
        )}

        {!apiLoading && exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-2">
              <div
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                style={{ borderLeft: "3px solid #3B82F6" }}
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
                {deletingExerciseId === ex.id ? (
                  <>
                    <button
                      onClick={() => handleDeleteConfirm(ex.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-green-600 transition-colors hover:bg-green-500/15 dark:text-green-400"
                      aria-label={t("profile.confirmDelete")}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingExerciseId(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
                      aria-label={t("profile.cancel")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openForm(ex)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                      aria-label={t("training.editExercise")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingExerciseId(ex.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("training.deleteTraining")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}

export type ExercisePayload = {
  id?: string
  name: string
  sets: number
  reps: number
  weight: number
}

function ExerciseForm({
  initial,
  selectedDate,
  onSave,
  onCancel,
  hideHeader = false,
}: {
  initial?: Exercise | null
  selectedDate: string
  onSave: (data: ExercisePayload) => void | Promise<void>
  onCancel: () => void
  hideHeader?: boolean
}) {
  const { t } = useI18n()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(initial?.id)
  const [name, setName] = useState(initial?.name ?? "")
  const [sets, setSets] = useState(initial?.sets?.toString() ?? "")
  const [reps, setReps] = useState(initial?.reps?.toString() ?? "")
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? "")

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "")
      setSets(initial.sets?.toString() ?? "")
      setReps(initial.reps?.toString() ?? "")
      setWeight(initial.weight?.toString() ?? "")
    } else {
      setName("")
      setSets("")
      setReps("")
      setWeight("")
    }
  }, [initial?.id, initial?.name, initial?.sets, initial?.reps, initial?.weight])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload: ExercisePayload = {
      ...(isEdit && initial ? { id: initial.id } : {}),
      name: name.trim(),
      sets: Number(sets) || 0,
      reps: Number(reps) || 0,
      weight: Number(weight) || 0,
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
          placeholder={t("training.exerciseName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 w-full rounded-xl bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          required
          autoFocus
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("training.sets")}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              min="0"
              className="h-12 w-full rounded-xl bg-input px-2 text-center text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("training.reps")}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min="0"
              className="h-12 w-full rounded-xl bg-input px-2 text-center text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("training.weightKg")}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0"
              step="0.5"
              className="h-12 w-full rounded-xl bg-input px-2 text-center text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
