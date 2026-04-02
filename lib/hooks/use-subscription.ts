"use client"

import { useAuth } from "@/lib/auth-context"

export function useSubscription() {
  const { user } = useAuth()

  const isActive = user?.subscription_active_until
    ? new Date(user.subscription_active_until) > new Date()
    : false

  return { isActive }
}
