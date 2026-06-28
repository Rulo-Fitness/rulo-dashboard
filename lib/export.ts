import type { TrainingSession } from "./storage"

/** Escapa un campo CSV: lo envuelve en comillas si contiene coma, comilla o salto de línea. */
function csvField(value: string | number): string {
  const str = String(value ?? "")
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Convierte las sesiones de entrenamiento a CSV.
 * Header: fecha,ejercicio,sets,reps,peso. Una fila por ejercicio por día, ordenado por fecha asc.
 */
export function sessionsToCsv(sessions: TrainingSession[]): string {
  const header = "fecha,ejercicio,sets,reps,peso"
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  const rows: string[] = []
  for (const session of sorted) {
    for (const ex of session.exercises) {
      rows.push(
        [
          csvField(session.date),
          csvField(ex.name),
          csvField(ex.sets),
          csvField(ex.reps),
          csvField(ex.weight),
        ].join(",")
      )
    }
  }
  return [header, ...rows].join("\n")
}

/** Dispara la descarga de un archivo CSV en el navegador. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Copia texto al portapapeles. Usa Clipboard API con fallback a execCommand (Safari/PWA). */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // cae al fallback
    }
  }
  if (typeof document === "undefined") return false
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
