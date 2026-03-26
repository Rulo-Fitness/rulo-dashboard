"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchMeals } from "@/lib/api"
import { setMeals } from "@/lib/storage"

interface MealsSyncProps {
  onSynced?: () => void
}

export function MealsSync({ onSynced }: MealsSyncProps) {
  const { user } = useAuth()
  const lastSyncedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.id || lastSyncedUserId.current === user.id) return
    lastSyncedUserId.current = user.id
    let cancelled = false
    fetchMeals(user.id)
      .then((meals) => {
        if (cancelled) return
        if (meals.length > 0) setMeals(meals)
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
