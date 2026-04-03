"use client"

import { useEffect, useState } from "react"
import { normalizePlanName } from "@/lib/plans"

type CurrentPlanState = {
  planName: string | null
  isLoading: boolean
}

export function useCurrentPlan(userId?: string | null, currentPlan?: string | null): CurrentPlanState {
  const [planName, setPlanName] = useState<string | null>(normalizePlanName(currentPlan))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const normalizedCurrentPlan = normalizePlanName(currentPlan)
    if (normalizedCurrentPlan) {
      setPlanName(normalizedCurrentPlan)
      setIsLoading(false)
      return
    }

    if (!userId) {
      setPlanName(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch(`/api/payments/latest?user_id=${encodeURIComponent(userId)}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          success?: boolean
          result?: { plan?: string | null } | null
        }

        if (cancelled) return
        if (!res.ok || !data.success) {
          setPlanName(null)
          return
        }

        setPlanName(normalizePlanName(data.result?.plan))
      })
      .catch(() => {
        if (!cancelled) {
          setPlanName(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentPlan, userId])

  return { planName, isLoading }
}
