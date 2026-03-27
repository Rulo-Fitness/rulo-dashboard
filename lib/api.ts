import type { TrainingSession, Meal } from "./storage"

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
 * Agrupa logs de la API por fecha. date en la API es solo día (YYYY-MM-DD).
 */
function mapWorkoutLogsToSessions(logs: WorkoutLogFromApi[]): TrainingSession[] {
  const byDate = new Map<string, WorkoutLogFromApi[]>()
  for (const log of logs) {
    const dateStr = log.date ? log.date.slice(0, 10) : ""
    if (!dateStr) continue
    if (!byDate.has(dateStr)) byDate.set(dateStr, [])
    byDate.get(dateStr)!.push(log)
  }
  const sessions: TrainingSession[] = []
  for (const [dateStr, group] of byDate.entries()) {
    const sorted = [...group].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
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

/** Todos los workout logs del usuario en un rango de fechas. Sin límite de cantidad. */
export async function fetchWorkoutLogsByRange(
  userId: string,
  from: string,
  to: string
): Promise<TrainingSession[]> {
  try {
    const params = new URLSearchParams({ user_id: userId, from, to })
    const res = await fetch(`/api/workout-logs-by-range?${params}`).catch(() => null)
    if (!res) return []
    if (!res.ok) return []
    const data = (await res.json()) as { success?: boolean; result?: WorkoutLogFromApi[] }
    if (!data.success || !Array.isArray(data.result)) return []
    return mapWorkoutLogsToSessions(data.result)
  } catch (err) {
    console.error("[Rulo API] fetchWorkoutLogsByRange error:", err)
    return []
  }
}

export async function fetchWorkoutLogs(userId: string): Promise<TrainingSession[]> {
  try {
    const res = await fetch(`/api/workout-logs?search=${encodeURIComponent(userId)}&per_page=100`).catch(() => null)
    if (!res) return []
    if (!res.ok) return []
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
  try {
    const res = await fetch(`/api/workout-logs-by-date?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(dateStr)}`).catch(() => null)
    if (!res) return []
    if (!res.ok) return []
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

/** Crea un workout log en la API. date solo día (YYYY-MM-DD); si no se pasa, la API usa hoy en Argentina. */
export async function createWorkoutLog(
  userId: string,
  body: { date?: string; name?: string; sets?: number; reps?: number; weight?: number }
): Promise<WorkoutLogFromApi | null> {
  try {
    const res = await fetch("/api/workout-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        ...(body.date != null && body.date !== "" && { date: body.date }),
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
  try {
    const res = await fetch(`/api/workout-logs/${id}`, {
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
  try {
    const res = await fetch(`/api/workout-logs/${id}`, { method: "DELETE" })
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

// ─── Meals API ───

type MealFromApi = {
  id: string
  user_id: string
  date: string | null
  name: string | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
}

function mapApiMealsToMeals(apiMeals: MealFromApi[]): Meal[] {
  return apiMeals.map((m) => ({
    id: m.id,
    date: m.date ? m.date.slice(0, 10) : "",
    name: m.name ?? "",
    time: "",
    calories: m.calories ?? 0,
    protein: m.protein ?? 0,
    carbs: m.carbs ?? 0,
    fat: m.fat ?? 0,
  }))
}

/** Todas las meals del usuario en un rango de fechas. Sin límite de cantidad. */
export async function fetchMealsByRange(
  userId: string,
  from: string,
  to: string
): Promise<Meal[]> {
  try {
    const params = new URLSearchParams({ user_id: userId, from, to })
    const res = await fetch(`/api/meals-by-range?${params}`).catch(() => null)
    if (!res || !res.ok) return []
    const data = (await res.json()) as { success?: boolean; result?: MealFromApi[] }
    if (!data.success || !Array.isArray(data.result)) return []
    return mapApiMealsToMeals(data.result)
  } catch (err) {
    console.error("[Rulo API] fetchMealsByRange error:", err)
    return []
  }
}

export async function fetchMeals(userId: string): Promise<Meal[]> {
  try {
    const res = await fetch(`/api/meals?search=${encodeURIComponent(userId)}&per_page=100`).catch(() => null)
    if (!res || !res.ok) return []
    const data = (await res.json()) as { success?: boolean; result?: MealFromApi[] }
    if (!data.success || !Array.isArray(data.result)) return []
    return mapApiMealsToMeals(data.result)
  } catch (err) {
    console.error("[Rulo API] fetchMeals error:", err)
    return []
  }
}

export async function fetchMealsForDate(userId: string, dateStr: string): Promise<Meal[]> {
  try {
    const res = await fetch(`/api/meals-by-date?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(dateStr)}`).catch(() => null)
    if (!res || !res.ok) return []
    const data = (await res.json()) as { success?: boolean; result?: MealFromApi[] }
    if (!data.success || !Array.isArray(data.result)) return []
    return mapApiMealsToMeals(data.result)
  } catch (err) {
    console.error("[Rulo API] fetchMealsForDate error:", err)
    return []
  }
}

export async function createMeal(
  userId: string,
  body: { date?: string; name?: string; calories?: number; protein?: number; carbs?: number; fat?: number }
): Promise<MealFromApi | null> {
  try {
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        ...(body.date != null && body.date !== "" && { date: body.date }),
        name: body.name ?? "",
        calories: body.calories ?? 0,
        protein: body.protein ?? 0,
        carbs: body.carbs ?? 0,
        fat: body.fat ?? 0,
      }),
    })
    const data = (await res.json()) as { success?: boolean; result?: MealFromApi }
    if (!res.ok || !data.success || !data.result) return null
    return data.result
  } catch (err) {
    console.error("[Rulo API] createMeal error:", err)
    return null
  }
}

export async function updateMealApi(
  id: string,
  body: { name?: string; calories?: number; protein?: number; carbs?: number; fat?: number }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/meals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return false
    return true
  } catch (err) {
    console.error("[Rulo API] updateMeal error:", id, err)
    return false
  }
}

export async function deleteMealApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" })
    if (!res.ok) return false
    return true
  } catch (err) {
    console.error("[Rulo API] deleteMeal error:", id, err)
    return false
  }
}
