import type { Exercise } from "./storage"

/** Ejercicios del día con el mismo nombre, agrupados en una sola entrada (cada serie es una variante). */
export type ExerciseGroup = {
  key: string
  displayName: string
  variants: Exercise[]
}

export function groupExercises(list: Exercise[]): ExerciseGroup[] {
  const map = new Map<string, ExerciseGroup>()
  for (const ex of list) {
    const key = ex.name.trim().toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.variants.push(ex)
    } else {
      map.set(key, { key, displayName: ex.name.trim() || ex.name, variants: [ex] })
    }
  }
  return Array.from(map.values())
}
