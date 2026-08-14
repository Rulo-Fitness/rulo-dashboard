"use client"

import { Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { BicepStatic } from "@/components/ui/bicep-static"
import type { ExerciseGroup } from "@/lib/exercise-groups"
import type { Exercise } from "@/lib/storage"

const MS_PER_DAY = 24 * 60 * 60 * 1000

interface TrainingMirrorCardProps {
  /** Grupos fantasma ya filtrados por el padre (sin los que ya se registraron hoy). */
  groups: ExerciseGroup[]
  /** Día del que salió la rutina (YYYY-MM-DD). */
  sourceDate: string
  /** Día que se está viendo (YYYY-MM-DD). */
  targetDate: string
  disabled?: boolean
  /** Claves de grupo con un alta en vuelo. */
  pendingKeys: Set<string>
  addAllPending: boolean
  onAccept: (group: ExerciseGroup) => void
  onEdit: (exercise: Exercise) => void
  onAcceptAll: () => void
}

/**
 * Rutina del mismo día de la semana anterior, mostrada como placeholder desteñido:
 * el check la registra tal cual y tocar la fila abre el formulario precargado.
 */
export function TrainingMirrorCard({
  groups,
  sourceDate,
  targetDate,
  disabled = false,
  pendingKeys,
  addAllPending,
  onAccept,
  onEdit,
  onAcceptAll,
}: TrainingMirrorCardProps) {
  const { t, locale } = useI18n()
  if (groups.length === 0) return null

  const intlLocale = locale === "es" ? "es-ES" : "en-US"
  const source = new Date(sourceDate + "T00:00:00")
  const daysAgo = Math.round(
    (new Date(targetDate + "T00:00:00").getTime() - source.getTime()) / MS_PER_DAY
  )
  const heading =
    daysAgo === 7
      ? t("training.mirrorLastWeek").replace("{day}", source.toLocaleDateString(intlLocale, { weekday: "long" }))
      : t("training.mirrorOlder").replace(
          "{date}",
          source.toLocaleDateString(intlLocale, { weekday: "short", month: "short", day: "numeric" })
        )

  const renderCheck = (group: ExerciseGroup) => {
    const pending = pendingKeys.has(group.key)
    return (
      <button
        type="button"
        disabled={disabled || pending || addAllPending}
        onClick={() => onAccept(group)}
        aria-label={t("training.mirrorAccept").replace("{name}", group.displayName)}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors active:scale-95 disabled:pointer-events-none ${
          pending
            ? "border-foreground bg-foreground text-background opacity-60"
            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        } ${disabled ? "opacity-40" : ""}`}
      >
        <Check className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </button>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-2.5 px-1">
        <p className="text-[13px] font-medium text-muted-foreground">{heading}</p>
        <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground/70">{t("training.mirrorHint")}</p>
      </div>

      <div className="overflow-hidden rounded-[32px] bg-card card-shadow">
        {groups.map((group, gIdx) => {
          const isSingle = group.variants.length === 1
          const prevGroup = gIdx > 0 ? groups[gIdx - 1] : null
          // Barra completa cuando hay una subsección (este grupo o el anterior); si no, línea indentada.
          const fullBar = !isSingle || (prevGroup ? prevGroup.variants.length > 1 : false)
          const separatorClass = fullBar ? "h-px bg-border" : "ml-[76px] mr-5 h-px bg-border"

          if (isSingle) {
            const ex = group.variants[0]
            return (
              <div key={group.key}>
                {gIdx > 0 && <div className={separatorClass} />}
                <div className="flex items-stretch">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onEdit(ex)}
                    className="flex min-h-[68px] min-w-0 flex-1 items-center gap-4 py-4 pl-5 text-left transition-colors active:bg-foreground/5 disabled:pointer-events-none"
                  >
                    <span className={`flex min-w-0 flex-1 items-center gap-4 ${disabled ? "opacity-30" : "opacity-55"}`}>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                        <BicepStatic className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block min-w-0 truncate text-[17px] font-medium leading-tight text-foreground">
                          {ex.name}
                        </span>
                        <span className="mt-1.5 block text-[13px] font-medium text-muted-foreground">
                          {ex.sets} {t("training.sets")} · {ex.reps} {t("training.reps")}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-bold leading-5 text-foreground">
                        {ex.weight}
                        {t("unit.kg")}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center pl-3 pr-5">{renderCheck(group)}</div>
                </div>
              </div>
            )
          }

          return (
            <div key={group.key}>
              {gIdx > 0 && <div className={separatorClass} />}
              <div className="flex items-stretch">
                <div
                  className={`flex min-w-0 flex-1 items-center gap-4 pt-4 pb-3 pl-5 ${disabled ? "opacity-30" : "opacity-55"}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                    <BicepStatic className="h-5 w-5" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-[17px] font-medium leading-tight text-foreground">
                    {group.displayName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center pt-1 pl-3 pr-5">{renderCheck(group)}</div>
              </div>
              {/* Div hundido pegado debajo — una fila por serie, tocable para editar */}
              <div className="overflow-hidden border-t border-border/60 bg-secondary/50">
                {group.variants.map((v, vIdx) => (
                  <div key={v.id}>
                    {vIdx > 0 && <div className="mx-5 h-px bg-border/40" />}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onEdit(v)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors active:bg-foreground/5 disabled:pointer-events-none ${
                        disabled ? "opacity-30" : "opacity-55"
                      }`}
                    >
                      <span className="min-w-0 flex-1 text-[13px] font-medium text-muted-foreground">
                        {v.sets} {t("training.sets").toLowerCase()} · {v.reps} {t("training.reps").toLowerCase()}
                      </span>
                      <span className="shrink-0 rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-bold leading-5 text-foreground">
                        {v.weight}
                        {t("unit.kg")}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {groups.length > 1 && (
          <>
            <div className="h-px bg-border" />
            <button
              type="button"
              disabled={disabled || addAllPending}
              onClick={onAcceptAll}
              className={`flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[15px] font-semibold text-foreground transition-colors active:bg-foreground/5 disabled:pointer-events-none ${
                addAllPending ? "opacity-50" : ""
              } ${disabled ? "opacity-40" : ""}`}
            >
              <Check className="h-4 w-4" strokeWidth={2.6} />
              {t("training.mirrorAddAll")}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
