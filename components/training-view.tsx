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
import { useSubscription } from "@/lib/hooks/use-subscription"
import { Plus, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { DeleteConfirmSheet, SwipeActionRow } from "@/components/swipe-action-row"

function BicepStatic({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1" />
      <path d="M15 14a5 5 0 0 0-7.584 2" />
      <path d="M9.964 6.825C8.019 7.977 9.5 13 8 15" />
    </svg>
  )
}

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
  const { isActive: subActive } = useSubscription()
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [openSwipeExerciseId, setOpenSwipeExerciseId] = useState<string | null>(null)
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
    setOpenSwipeExerciseId(null)
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
  const emptyTitle = isToday ? t("training.emptyTodayTitle") : t("training.emptyPastTitle")
  const emptySubtitle = isToday ? t("training.emptyTodaySubtitle") : t("training.emptyPastSubtitle")
  const pendingDeleteExercise = deletingExerciseId
    ? exercises.find((ex) => ex.id === deletingExerciseId) ?? null
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("training.title")}</h1>
        </div>
        <button
          onClick={() => openForm(null)}
          disabled={!subActive}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 ${!subActive ? "opacity-40 pointer-events-none" : ""}`}
          aria-label={t("training.addExercise")}
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

      {/* Área de contenido: carga, vacío o lista */}
      <div className="flex min-h-0 flex-1 flex-col">
        {user?.id && apiLoading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12">
            <p className="text-sm text-muted-foreground">Cargando entrenos…</p>
          </div>
        )}

        {!apiLoading && exercises.length === 0 && !showForm && (
          <div className="bg-card rounded-[32px] px-8 py-9 card-shadow text-center">
            <BicepStatic className="h-12 w-12 mx-auto mb-5 text-muted-foreground/25" />
            <p className="text-[17px] font-semibold tracking-tight text-foreground">{emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-[240px] text-sm leading-5 text-muted-foreground">
              {emptySubtitle}
            </p>
          </div>
        )}

        {!apiLoading && exercises.length > 0 && (
        <div className="bg-card rounded-[32px] overflow-hidden card-shadow">
          {exercises.map((ex, idx) => (
            <div key={ex.id}>
              {idx > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
              <SwipeActionRow
                isOpen={openSwipeExerciseId === ex.id}
                disabled={!subActive}
                editLabel={t("actions.edit")}
                deleteLabel={t("actions.delete")}
                onOpen={() => setOpenSwipeExerciseId(ex.id)}
                onClose={() => setOpenSwipeExerciseId(null)}
                onEdit={() => {
                  setOpenSwipeExerciseId(null)
                  openForm(ex)
                }}
                onDelete={() => {
                  setOpenSwipeExerciseId(null)
                  setDeletingExerciseId(ex.id)
                }}
              >
                <div className="px-5 py-4 min-h-[68px] flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-foreground shrink-0">
                    <BicepStatic className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="min-w-0 truncate text-[17px] font-medium leading-tight text-foreground">
                      {ex.name}
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
                      {ex.sets} {t("training.sets")} · {ex.reps} {t("training.reps")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-bold leading-5 text-background">
                    {ex.weight}{t("unit.kg")}
                  </span>
                </div>
              </SwipeActionRow>
            </div>
          ))}
        </div>
        )}
      </div>

      <DeleteConfirmSheet
        open={Boolean(pendingDeleteExercise)}
        title={t("training.deleteExerciseConfirm")}
        itemName={pendingDeleteExercise?.name ?? ""}
        cancelLabel={t("profile.cancel")}
        confirmLabel={t("actions.delete")}
        onCancel={() => setDeletingExerciseId(null)}
        onConfirm={() => {
          if (pendingDeleteExercise) void handleDeleteConfirm(pendingDeleteExercise.id)
        }}
      />

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

function parseDecimalInput(value: string) {
  const normalized = value.trim().replace(",", ".")
  if (!normalized) return 0
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseIntegerInput(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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
      sets: parseIntegerInput(sets),
      reps: parseIntegerInput(reps),
      weight: parseDecimalInput(weight),
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
          className="h-12 w-full rounded-2xl bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          required
          autoFocus
        />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("training.sets")}</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              min="0"
              className="h-12 w-full rounded-2xl bg-input px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("training.reps")}</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min="0"
              className="h-12 w-full rounded-2xl bg-input px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("training.weightKg")}</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-12 w-full rounded-2xl bg-input px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
