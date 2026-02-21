import type { TrainingSession } from "./storage"

const API_URL =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_RULO_API_URL : undefined) ?? ""

export function getApiUrl(): string {
  return API_URL.replace(/\/$/, "")
}

type WorkoutLogFromApi = {
  id: string
  user_id: string
  date: string | null
  name: string | null
  sets: number | null
  reps: number | null
  weight: number | null
}

/**
 * Agrupa logs de la API por fecha y los convierte al formato TrainingSession del dashboard.
 * En la API date viene como ISO datetime (ej. 2026-02-21T23:03:17.606Z); usamos .slice(0, 10) para el día.
 */
function mapWorkoutLogsToSessions(logs: WorkoutLogFromApi[]): TrainingSession[] {
  const byDate = new Map<string, WorkoutLogFromApi[]>()
  for (const log of logs) {
    const dateStr = log.date ? log.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
    if (!byDate.has(dateStr)) byDate.set(dateStr, [])
    byDate.get(dateStr)!.push(log)
  }
  const sessions: TrainingSession[] = []
  for (const [dateStr, group] of byDate.entries()) {
    const sorted = [...group].sort(
      (a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()
    )
    const first = sorted[0]
    sessions.push({
      id: first.id,
      date: dateStr,
      name: first.name ?? "workout",
      exercises: sorted.map((log) => ({
        id: log.id,
        name: log.name ?? "",
        sets: log.sets ?? 0,
        reps: log.reps ?? 0,
        weight: log.weight ?? 0,
      })),
    })
  }
  // Ordenar por fecha descendente (más reciente primero)
  sessions.sort((a, b) => (b.date > a.date ? 1 : -1))
  return sessions
}

export async function fetchWorkoutLogs(userId: string): Promise<TrainingSession[]> {
  const base = getApiUrl()
  if (!base) return []
  const url = `${base}/workout-logs?search=${encodeURIComponent(userId)}&per_page=500`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      console.error("[Rulo API] fetchWorkoutLogs failed:", res.status, res.statusText, text)
      return []
    }
    const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi[] }
    if (!data.success || !Array.isArray(data.result)) {
      console.error("[Rulo API] fetchWorkoutLogs invalid response:", data)
      return []
    }
    return mapWorkoutLogsToSessions(data.result)
  } catch (err) {
    console.error("[Rulo API] fetchWorkoutLogs error:", err)
    return []
  }
}

/** Ejercicios de la API para un usuario y una fecha (YYYY-MM-DD). Carga con esta fecha. */
export async function fetchWorkoutLogsForDate(
  userId: string,
  dateStr: string
): Promise<import("./storage").Exercise[]> {
  const base = getApiUrl()
  if (!base) return []
  const url = `${base}/workout-logs-by-date?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(dateStr)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      console.error("[Rulo API] fetchWorkoutLogsForDate failed:", res.status, res.statusText, text)
      return []
    }
    const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi[] }
    if (!data.success || !Array.isArray(data.result)) {
      console.error("[Rulo API] fetchWorkoutLogsForDate invalid response:", data)
      return []
    }
    return data.result.map((log) => ({
      id: log.id,
      name: log.name ?? "",
      sets: log.sets ?? 0,
      reps: log.reps ?? 0,
      weight: log.weight ?? 0,
    }))
  } catch (err) {
    console.error("[Rulo API] fetchWorkoutLogsForDate error:", err)
    return []
  }
}

/** Crea un workout log en la API. date en ISO (ej. 2026-02-21T23:03:17.606Z); si no se pasa, la API usa "now". */
export async function createWorkoutLog(
  userId: string,
  body: { date?: string; name?: string; sets?: number; reps?: number; weight?: number }
): Promise<WorkoutLogFromApi | null> {
  const base = getApiUrl()
  if (!base) return null
  try {
    const res = await fetch(`${base}/workout-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date: body.date ?? new Date().toISOString(),
        name: body.name ?? "",
        sets: body.sets ?? 0,
        reps: body.reps ?? 0,
        weight: body.weight ?? 0,
      }),
    })
    const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi }
    if (!res.ok) {
      console.error("[Rulo API] createWorkoutLog failed:", res.status, res.statusText, data)
      return null
    }
    if (!data.success || !data.result) {
      console.error("[Rulo API] createWorkoutLog invalid response:", data)
      return null
    }
    return data.result
  } catch (err) {
    console.error("[Rulo API] createWorkoutLog error:", err)
    return null
  }
}

/** Actualiza un workout log en la API. */
export async function updateWorkoutLog(
  id: string,
  body: { name?: string; sets?: number; reps?: number; weight?: number }
): Promise<boolean> {
  const base = getApiUrl()
  if (!base) return false
  try {
    const res = await fetch(`${base}/workout-logs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error("[Rulo API] updateWorkoutLog failed:", id, res.status, res.statusText, text)
      return false
    }
    return true
  } catch (err) {
    console.error("[Rulo API] updateWorkoutLog error:", id, err)
    return false
  }
}

/** Elimina un workout log en la API. */
export async function deleteWorkoutLog(id: string): Promise<boolean> {
  const base = getApiUrl()
  if (!base) return false
  try {
    const res = await fetch(`${base}/workout-logs/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const text = await res.text()
      console.error("[Rulo API] deleteWorkoutLog failed:", id, res.status, res.statusText, text)
      return false
    }
    return true
  } catch (err) {
    console.error("[Rulo API] deleteWorkoutLog error:", id, err)
    return false
  }
}
