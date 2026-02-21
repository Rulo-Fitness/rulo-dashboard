import type { TrainingSession } from "./storage"

const API_URL =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ?? ""

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
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi[] }
  if (!data.success || !Array.isArray(data.result)) return []
  return mapWorkoutLogsToSessions(data.result)
}

/** Ejercicios de la API para un usuario y una fecha (YYYY-MM-DD). Carga con esta fecha. */
export async function fetchWorkoutLogsForDate(
  userId: string,
  dateStr: string
): Promise<import("./storage").Exercise[]> {
  const base = getApiUrl()
  if (!base) return []
  const url = `${base}/workout-logs-by-date?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(dateStr)}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi[] }
  if (!data.success || !Array.isArray(data.result)) return []
  return data.result.map((log) => ({
    id: log.id,
    name: log.name ?? "",
    sets: log.sets ?? 0,
    reps: log.reps ?? 0,
    weight: log.weight ?? 0,
  }))
}

/** Crea un workout log en la API. date en ISO (ej. 2026-02-21T23:03:17.606Z); si no se pasa, la API usa "now". */
export async function createWorkoutLog(
  userId: string,
  body: { date?: string; name?: string; sets?: number; reps?: number; weight?: number }
): Promise<WorkoutLogFromApi | null> {
  const base = getApiUrl()
  if (!base) return null
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
  if (!res.ok) return null
  const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi }
  return data.success && data.result ? data.result : null
}

/** Actualiza un workout log en la API. */
export async function updateWorkoutLog(
  id: string,
  body: { name?: string; sets?: number; reps?: number; weight?: number }
): Promise<boolean> {
  const base = getApiUrl()
  if (!base) return false
  const res = await fetch(`${base}/workout-logs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res.ok
}

/** Elimina un workout log en la API. */
export async function deleteWorkoutLog(id: string): Promise<boolean> {
  const base = getApiUrl()
  if (!base) return false
  const res = await fetch(`${base}/workout-logs/${id}`, { method: "DELETE" })
  return res.ok
}
