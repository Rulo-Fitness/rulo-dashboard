"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import {
  getExercisesForDate,
  addExerciseToDate,
  updateExercise,
  deleteExercise,
  getTodayString,
  toLocalDateString,
  type Exercise,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import {
  fetchWorkoutLogsForDate,
  fetchWorkoutLogsByRange,
  createWorkoutLog,
  updateWorkoutLog,
  deleteWorkoutLog,
} from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { useSubscription } from "@/lib/hooks/use-subscription"
import { Plus, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { DeleteConfirmSheet, SwipeActionRow } from "@/components/swipe-action-row"
import { BicepStatic } from "@/components/ui/bicep-static"
import { groupExercises, type ExerciseGroup } from "@/lib/exercise-groups"
import { TrainingMirrorCard } from "@/components/training-mirror-card"

/** Días hacia atrás donde buscamos el mismo día de la semana, del más reciente al más viejo. */
const MIRROR_OFFSETS = [-7, -14, -21, -28]

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return toLocalDateString(d)
}

/** Rutina espejo desde localStorage: primer día candidato (del más reciente al más viejo) con ejercicios. */
function findLocalMirror(dateStr: string): { sourceDate: string; exercises: Exercise[] } | null {
  for (const offset of MIRROR_OFFSETS) {
    const sourceDate = shiftDate(dateStr, offset)
    const exercises = getExercisesForDate(sourceDate)
    if (exercises.length > 0) return { sourceDate, exercises }
  }
  return null
}

type SwipeTarget =
  | { type: "single"; id: string }
  | { type: "variant"; id: string }
  | { type: "header"; key: string }

function swipeTargetEquals(a: SwipeTarget | null, b: SwipeTarget): boolean {
  if (!a || a.type !== b.type) return false
  if (b.type === "header") return a.type === "header" && a.key === b.key
  return (a.type === "single" || a.type === "variant") && a.id === (b as { id: string }).id
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
  const [renamingGroup, setRenamingGroup] = useState<ExerciseGroup | null>(null)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<ExerciseGroup | null>(null)
  const [openSwipe, setOpenSwipe] = useState<SwipeTarget | null>(null)
  const [detailGroupKey, setDetailGroupKey] = useState<string | null>(null)
  const [addFormKey, setAddFormKey] = useState(0)
  // Rutina del mismo día de la semana anterior, ofrecida como placeholder cada vez que el día queda vacío.
  const [mirror, setMirror] = useState<{ sourceDate: string; exercises: Exercise[] } | null>(null)
  const [mirrorPendingKeys, setMirrorPendingKeys] = useState<Set<string>>(new Set())
  const [mirrorAddAllPending, setMirrorAddAllPending] = useState(false)
  const [mirrorDraft, setMirrorDraft] = useState<Exercise | null>(null)
  // Fantasmas guardados con otro nombre desde el formulario: se ocultan hasta que el día vuelva a vaciarse.
  const [consumedMirrorIds, setConsumedMirrorIds] = useState<Set<string>>(new Set())
  // Día cuyo listado real ya está cargado — hasta entonces no se sabe si está vacío.
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const mirrorLookupRef = useRef<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const groups = useMemo(() => groupExercises(exercises), [exercises])
  const detailGroup = detailGroupKey ? groups.find((g) => g.key === detailGroupKey) ?? null : null

  // Los fantasmas de un ejercicio que ya está registrado hoy no se muestran (evita duplicarlo).
  const mirrorGroups = useMemo(() => {
    if (!mirror) return []
    const realNames = new Set(groups.map((g) => g.key))
    return groupExercises(mirror.exercises.filter((ex) => !consumedMirrorIds.has(ex.id))).filter(
      (g) => !realNames.has(g.key)
    )
  }, [mirror, groups, consumedMirrorIds])

  // Close the detail screen once its group no longer exists (e.g. all sets deleted).
  useEffect(() => {
    if (detailGroupKey && !groups.some((g) => g.key === detailGroupKey)) {
      setDetailGroupKey(null)
    }
  }, [detailGroupKey, groups])

  const openForm = (ex: Exercise | null = null) => {
    if (!ex) setAddFormKey((k) => k + 1)
    setEditingExercise(ex)
    setRenamingGroup(null)
    setMirrorDraft(null)
    setShowForm(true)
  }

  const openRenameGroup = (group: ExerciseGroup) => {
    setRenamingGroup(group)
    setEditingExercise(null)
    setMirrorDraft(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingExercise(null)
    setRenamingGroup(null)
    setMirrorDraft(null)
  }

  // Hide the bottom nav whenever any full-screen panel (form or group detail) is open.
  useEffect(() => {
    onAddPanelChange?.(showForm || detailGroupKey !== null)
  }, [showForm, detailGroupKey, onAddPanelChange])

  useEffect(() => {
    // Al cambiar de día se descarta el espejo anterior y se vuelve a habilitar la búsqueda.
    setMirror(null)
    setMirrorPendingKeys(new Set())
    setMirrorAddAllPending(false)
    setConsumedMirrorIds(new Set())
    setLoadedDate(null)
    mirrorLookupRef.current = null

    if (!user?.id) {
      setExercises(getExercisesForDate(selectedDate))
      setLoadedDate(selectedDate)
      return
    }
    let cancelled = false
    setApiLoading(true)
    fetchWorkoutLogsForDate(user.id, selectedDate)
      .then((list) => {
        if (!cancelled) {
          setExercises(list)
          setLoadedDate(selectedDate)
          setApiLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExercises(getExercisesForDate(selectedDate))
          setLoadedDate(selectedDate)
          setApiLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, selectedDate])

  // Cada vez que el día queda vacío (al abrirlo o tras borrar todo) se ofrece la rutina espejo completa.
  useEffect(() => {
    if (loadedDate !== selectedDate || exercises.length > 0) return
    // Día vacío ⇒ todos los fantasmas vuelven a estar disponibles.
    setConsumedMirrorIds((prev) => (prev.size === 0 ? prev : new Set()))
    // La rutina de origen se busca una sola vez por día; después se reusa la que ya está en memoria.
    if (mirrorLookupRef.current === selectedDate) return
    mirrorLookupRef.current = selectedDate

    if (!user?.id) {
      setMirror(findLocalMirror(selectedDate))
      return
    }
    let cancelled = false
    // Un solo request cubre los cuatro candidatos (-7, -14, -21, -28).
    fetchWorkoutLogsByRange(
      user.id,
      shiftDate(selectedDate, MIRROR_OFFSETS[MIRROR_OFFSETS.length - 1]),
      shiftDate(selectedDate, MIRROR_OFFSETS[0])
    )
      .then((sessions) => {
        if (cancelled) return
        const candidates = new Set(MIRROR_OFFSETS.map((offset) => shiftDate(selectedDate, offset)))
        // fetchWorkoutLogsByRange devuelve las sesiones de más reciente a más vieja.
        const match = sessions.find((s) => candidates.has(s.date) && s.exercises.length > 0)
        if (match) setMirror({ sourceDate: match.date, exercises: match.exercises })
      })
      .catch(() => {
        // Sin espejo disponible: queda el estado vacío de siempre.
      })
    return () => {
      cancelled = true
    }
  }, [loadedDate, selectedDate, exercises.length, user?.id])

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

  /**
   * Registra variantes del espejo en el día actual. Los ids del espejo son de la semana pasada:
   * siempre se crean filas nuevas, nunca se actualizan las viejas.
   */
  const acceptMirrorVariants = async (variants: Exercise[]): Promise<void> => {
    if (variants.length === 0) return
    if (user?.id) {
      const results = await Promise.all(
        variants.map((v) =>
          createWorkoutLog(user.id, {
            date: selectedDate,
            name: v.name,
            sets: v.sets,
            reps: v.reps,
            weight: v.weight,
          })
        )
      )
      const created = results.filter((r) => r !== null)
      if (created.length > 0) {
        setExercises((prev) => [
          ...prev,
          ...created.map((row) => ({
            id: row.id,
            name: row.name ?? "",
            sets: row.sets ?? 0,
            reps: row.reps ?? 0,
            weight: row.weight ?? 0,
          })),
        ])
        onUpdate()
      }
      // Los fantasmas aceptados desaparecen solos: ya existe un ejercicio con ese nombre en el día.
      if (results.some((r) => r === null)) await refresh()
      return
    }
    for (const v of variants) {
      addExerciseToDate(selectedDate, { name: v.name, sets: v.sets, reps: v.reps, weight: v.weight })
    }
    await refresh()
  }

  const handleAcceptMirrorGroup = async (group: ExerciseGroup) => {
    setMirrorPendingKeys((prev) => new Set(prev).add(group.key))
    try {
      await acceptMirrorVariants(group.variants)
    } finally {
      setMirrorPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(group.key)
        return next
      })
    }
  }

  const handleAcceptMirrorAll = async () => {
    setMirrorAddAllPending(true)
    try {
      await acceptMirrorVariants(mirrorGroups.flatMap((g) => g.variants))
    } finally {
      setMirrorAddAllPending(false)
    }
  }

  /** Oculta un fantasma guardado con otro nombre (el filtro por nombre no alcanza para taparlo). */
  const consumeMirrorId = (id: string) => {
    setConsumedMirrorIds((prev) => new Set(prev).add(id))
  }

  /** Abre el formulario precargado con una fila del espejo (sin id ⇒ el submit crea una fila nueva). */
  const openMirrorDraft = (ex: Exercise) => {
    setEditingExercise(null)
    setRenamingGroup(null)
    setMirrorDraft(ex)
    setShowForm(true)
  }

  const handleDeleteConfirm = async (exId: string) => {
    setDeletingExerciseId(null)
    setOpenSwipe(null)
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

  const handleDeleteGroupConfirm = async (group: ExerciseGroup) => {
    setPendingDeleteGroup(null)
    setOpenSwipe(null)
    setDetailGroupKey(null)
    const ids = group.variants.map((v) => v.id)
    if (user?.id) {
      const previous = exercises.filter((e) => !ids.includes(e.id))
      setExercises(previous)
      onUpdate()
      const results = await Promise.all(ids.map((id) => deleteWorkoutLog(id)))
      if (results.some((ok) => !ok)) {
        await refresh()
      }
    } else {
      for (const id of ids) deleteExercise(id)
      refresh()
    }
  }

  const handleRenameGroup = async (group: ExerciseGroup, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === group.displayName) {
      closeForm()
      return
    }
    // The group key is derived from the name, so keep the open detail screen in sync.
    if (detailGroupKey === group.key) setDetailGroupKey(trimmed.toLowerCase())
    if (user?.id) {
      const variantIds = new Set(group.variants.map((v) => v.id))
      setExercises((prev) =>
        prev.map((ex) => (variantIds.has(ex.id) ? { ...ex, name: trimmed } : ex))
      )
      onUpdate()
      closeForm()
      const results = await Promise.all(
        group.variants.map((v) =>
          updateWorkoutLog(v.id, { name: trimmed, sets: v.sets, reps: v.reps, weight: v.weight })
        )
      )
      if (results.some((ok) => !ok)) {
        await refresh()
      }
    } else {
      for (const v of group.variants) {
        updateExercise(selectedDate, { ...v, name: trimmed })
      }
      closeForm()
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

  // El borrador del espejo va sin id: el formulario lo trata como alta, no como edición.
  const formMode: "add" | "edit" | "rename" = renamingGroup
    ? "rename"
    : editingExercise
      ? "edit"
      : "add"
  const formInitial: Exercise | null = renamingGroup
    ? { id: renamingGroup.key, name: renamingGroup.displayName, sets: 0, reps: 0, weight: 0 }
    : editingExercise ?? (mirrorDraft ? { ...mirrorDraft, id: "" } : null)
  const formKey = renamingGroup
    ? `rename-${renamingGroup.key}`
    : editingExercise
      ? editingExercise.id
      : mirrorDraft
        ? `mirror-${mirrorDraft.id}`
        : `new-${addFormKey}`
  const formTitle =
    formMode === "rename"
      ? t("training.renameExercise")
      : formMode === "edit"
        ? t("training.editExercise")
        : t("training.addExercise").replace(/^\+\s*/, "")

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
            <h2 className="text-lg font-semibold text-foreground">{formTitle}</h2>
          </header>
          {/* Form body */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {showForm && (
              <ExerciseForm
                key={formKey}
                mode={formMode === "rename" ? "rename" : "full"}
                initial={formInitial}
                selectedDate={selectedDate}
                onSave={async (data) => {
                  if (renamingGroup) {
                    await handleRenameGroup(renamingGroup, data.name)
                    return
                  }
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
                    if (ok) {
                      if (mirrorDraft) consumeMirrorId(mirrorDraft.id)
                      closeForm()
                    }
                  } else {
                    if (data.id) {
                      updateExercise(selectedDate, { ...data, id: data.id })
                    } else {
                      addExerciseToDate(selectedDate, data)
                    }
                    if (mirrorDraft) consumeMirrorId(mirrorDraft.id)
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

      {/* Detalle del grupo — pantalla para gestionar cada serie */}
      <div
        className="fixed inset-0 z-40 bg-background transition-transform duration-300 ease-out"
        style={{
          transform: detailGroup ? "translateX(0)" : "translateX(100%)",
          pointerEvents: detailGroup ? "auto" : "none",
        }}
      >
        <div className="mx-auto flex h-full max-w-lg flex-col">
          <header className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-3 border-b border-border">
            <button
              type="button"
              onClick={() => {
                setOpenSwipe(null)
                setDetailGroupKey(null)
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground hover:bg-secondary active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="flex-1 min-w-0 truncate text-lg font-semibold text-foreground">
              {detailGroup?.displayName}
            </h2>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {detailGroup && (
              <div className="bg-card rounded-[28px] overflow-hidden card-shadow">
                {detailGroup.variants.map((v, vIdx) => {
                  const vTarget: SwipeTarget = { type: "variant", id: v.id }
                  return (
                    <div key={v.id}>
                      {vIdx > 0 && <div className="ml-5 mr-5 h-px bg-border" />}
                      <SwipeActionRow
                        isOpen={swipeTargetEquals(openSwipe, vTarget)}
                        disabled={!subActive}
                        editLabel={t("actions.edit")}
                        deleteLabel={t("actions.delete")}
                        onOpen={() => setOpenSwipe(vTarget)}
                        onClose={() => setOpenSwipe(null)}
                        onEdit={() => {
                          setOpenSwipe(null)
                          openForm(v)
                        }}
                        onDelete={() => {
                          setOpenSwipe(null)
                          setDeletingExerciseId(v.id)
                        }}
                      >
                        <div className="px-5 py-4 min-h-[60px] flex items-center gap-4">
                          <p className="flex-1 min-w-0 text-[13px] font-medium text-muted-foreground">
                            {v.sets} {t("training.sets").toLowerCase()} · {v.reps} {t("training.reps").toLowerCase()}
                          </p>
                          <span className="shrink-0 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-bold leading-5 text-background">
                            {v.weight}{t("unit.kg")}
                          </span>
                        </div>
                      </SwipeActionRow>
                    </div>
                  )
                })}
              </div>
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

        {!apiLoading && exercises.length === 0 && mirrorGroups.length === 0 && !showForm && (
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
          {groups.map((group, gIdx) => {
            const isSingle = group.variants.length === 1
            // Barra completa cuando hay una subsección (este grupo o el anterior); si no, línea indentada.
            const prevGroup = gIdx > 0 ? groups[gIdx - 1] : null
            const fullBar = !isSingle || (prevGroup ? prevGroup.variants.length > 1 : false)
            const separatorClass = fullBar ? "h-px bg-border" : "ml-[76px] mr-5 h-px bg-border"
            // Redondear los extremos del card en la capa con transform (evita el sangrado de 1px en la esquina).
            const isFirst = gIdx === 0
            const isLast = gIdx === groups.length - 1
            if (isSingle) {
              const ex = group.variants[0]
              const target: SwipeTarget = { type: "single", id: ex.id }
              return (
                <div key={group.key}>
                  {gIdx > 0 && <div className={separatorClass} />}
                  <SwipeActionRow
                    className={`${isFirst ? "rounded-t-[32px]" : ""} ${isLast ? "rounded-b-[32px]" : ""}`}
                    isOpen={swipeTargetEquals(openSwipe, target)}
                    disabled={!subActive}
                    editLabel={t("actions.edit")}
                    deleteLabel={t("actions.delete")}
                    onOpen={() => setOpenSwipe(target)}
                    onClose={() => setOpenSwipe(null)}
                    onEdit={() => {
                      setOpenSwipe(null)
                      openForm(ex)
                    }}
                    onDelete={() => {
                      setOpenSwipe(null)
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
              )
            }

            const headerTarget: SwipeTarget = { type: "header", key: group.key }
            return (
              <div key={group.key}>
                {gIdx > 0 && <div className={separatorClass} />}
                {/* Pill principal — la única con slide: Editar, Eliminar, Ver */}
                <SwipeActionRow
                  className={isFirst ? "rounded-t-[32px]" : ""}
                  mode="actions-view"
                  isOpen={swipeTargetEquals(openSwipe, headerTarget)}
                  disabled={!subActive}
                  editLabel={t("actions.edit")}
                  deleteLabel={t("actions.delete")}
                  viewLabel={t("actions.view")}
                  onOpen={() => setOpenSwipe(headerTarget)}
                  onClose={() => setOpenSwipe(null)}
                  onEdit={() => {
                    setOpenSwipe(null)
                    openRenameGroup(group)
                  }}
                  onDelete={() => {
                    setOpenSwipe(null)
                    setPendingDeleteGroup(group)
                  }}
                  onView={() => {
                    setOpenSwipe(null)
                    setDetailGroupKey(group.key)
                  }}
                >
                  <div className="px-5 pt-4 pb-3 flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center text-foreground shrink-0">
                      <BicepStatic className="h-5 w-5" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[17px] font-medium leading-tight text-foreground">
                      {group.displayName}
                    </p>
                  </div>
                </SwipeActionRow>
                {/* Div hundido pegado debajo — solo lectura, sin slide */}
                <div className={`overflow-hidden border-t border-border/60 bg-secondary/50 ${isLast ? "rounded-b-[32px]" : ""}`}>
                  {group.variants.map((v, vIdx) => (
                    <div key={v.id}>
                      {vIdx > 0 && <div className="mx-5 h-px bg-border/40" />}
                      <button
                        type="button"
                        disabled={!subActive}
                        onClick={() => openForm(v)}
                        className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors active:bg-foreground/5 disabled:opacity-40"
                      >
                        <span className="flex-1 min-w-0 text-[13px] font-medium text-muted-foreground">
                          {v.sets} {t("training.sets").toLowerCase()} · {v.reps} {t("training.reps").toLowerCase()}
                        </span>
                        <span className="shrink-0 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-bold leading-5 text-background">
                          {v.weight}{t("unit.kg")}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        )}

        {/* Rutina del mismo día de la semana anterior — placeholder, aún sin guardar */}
        {!apiLoading && mirror && mirrorGroups.length > 0 && !showForm && (
          <div className={exercises.length > 0 ? "mt-4" : ""}>
            <TrainingMirrorCard
              groups={mirrorGroups}
              sourceDate={mirror.sourceDate}
              targetDate={selectedDate}
              disabled={!subActive}
              pendingKeys={mirrorPendingKeys}
              addAllPending={mirrorAddAllPending}
              onAccept={(group) => void handleAcceptMirrorGroup(group)}
              onAcceptAll={() => void handleAcceptMirrorAll()}
              onEdit={openMirrorDraft}
            />
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

      <DeleteConfirmSheet
        open={Boolean(pendingDeleteGroup)}
        title={t("training.deleteGroupConfirm")}
        itemName={pendingDeleteGroup?.displayName ?? ""}
        cancelLabel={t("profile.cancel")}
        confirmLabel={t("actions.delete")}
        onCancel={() => setPendingDeleteGroup(null)}
        onConfirm={() => {
          if (pendingDeleteGroup) void handleDeleteGroupConfirm(pendingDeleteGroup)
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
  mode = "full",
}: {
  initial?: Exercise | null
  selectedDate: string
  onSave: (data: ExercisePayload) => void | Promise<void>
  onCancel: () => void
  hideHeader?: boolean
  mode?: "full" | "rename"
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
    if (mode === "rename") {
      onSave({ name: name.trim(), sets: 0, reps: 0, weight: 0 })
      return
    }
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

        {mode === "full" && (
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
        )}

        <button
          type="submit"
          className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-foreground text-base font-bold text-background transition-colors active:scale-[0.99]"
        >
          {t("register.save")}
        </button>
    </form>
  )
}
