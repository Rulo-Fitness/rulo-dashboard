"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchWorkoutLogs } from "@/lib/api"
import { setTrainingSessions } from "@/lib/storage"

interface TrainingSyncProps {
  /** Se llama tras sincronizar los entrenos desde la API para refrescar la UI. */
  onSynced?: () => void
}

/**
 * Al montar con usuario logueado, trae los workout-logs de la API y los escribe en localStorage
 * para que el dashboard y la pestaña Entrenos muestren los datos de la API.
 */
export function TrainingSync({ onSynced }: TrainingSyncProps) {
  const { user } = useAuth()
  const lastSyncedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.id || lastSyncedUserId.current === user.id) return
    lastSyncedUserId.current = user.id
    let cancelled = false
    fetchWorkoutLogs(user.id)
      .then((sessions) => {
        if (cancelled) return
        if (sessions.length > 0) setTrainingSessions(sessions)
        onSynced?.()
      })
      .catch(() => {
        if (!cancelled) onSynced?.()
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, onSynced])

  return null
}
