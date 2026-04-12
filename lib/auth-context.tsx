"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

/** Clave en localStorage. Persiste en web y en PWA (mismo origen, mismo storage). */
const STORAGE_KEY = "rulo-auth"

export type AuthUser = {
  id: string
  phone: string
  name?: string
  subscription_active_until?: string | null
  current_plan?: string | null
  trial_used?: boolean
  mp_subscription_id?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (phone: string, password: string, name?: string) => Promise<{ ok: boolean; error?: string }>
  updateUser: (updates: Partial<AuthUser>) => void
  logout: () => void
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as AuthUser
    return data?.phone && data?.id ? data : null
  } catch {
    return null
  }
}

function saveUser(user: AuthUser | null) {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = loadStoredUser()
    setUser(stored)
    setIsLoading(false)

    if (stored?.id) {
      fetch(`/api/subscription-status?user_id=${encodeURIComponent(stored.id)}`)
        .then(async (res) => {
          if (!res.ok) return
          const data = await res.json()
          if (!data.success || !data.result) return
          const r = data.result
          const updates: Partial<AuthUser> = {}
          if (r.subscription_active_until !== undefined) updates.subscription_active_until = r.subscription_active_until
          if (r.current_plan !== undefined) updates.current_plan = r.current_plan
          if (Object.keys(updates).length > 0) {
            setUser((prev) => {
              if (!prev) return prev
              const updated = { ...prev, ...updates }
              saveUser(updated)
              return updated
            })
          }
        })
        .catch(() => {})
    }
  }, [])

  const login = useCallback(
    async (phone: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const normalized = phone.replace(/\s/g, "").replace(/^\+/, "")
      if (!normalized || normalized.length < 9) {
        return { ok: false, error: "Introduce un número de teléfono válido" }
      }
      if (!password || password.length < 4) {
        return { ok: false, error: "La contraseña debe tener al menos 4 caracteres" }
      }

      const body = {
        phone: phone.trim().startsWith("+") ? phone.trim() : `+${normalized}`,
        password,
      }
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        let data: {
          success?: boolean
          result?: { id: string; phone: string | null; name: string | null; subscription_active_until: string | null; current_plan: string | null; trial_used: boolean }
          errors?: { message: string }[]
        }
        try {
          data = text ? (JSON.parse(text) as typeof data) : {}
        } catch (parseErr) {
          console.error("[Rulo Auth] login parse error:", parseErr, "raw:", text)
          return {
            ok: false,
            error: "La API devolvió una respuesta no válida.",
          }
        }
        if (!res.ok || !data.success || !data.result) {
          const message = data.errors?.[0]?.message ?? "Teléfono o contraseña incorrectos"
          console.error("[Rulo Auth] login failed:", res.status, res.statusText, data)
          return { ok: false, error: message }
        }
        const r = data.result
        const newUser: AuthUser = {
          id: r.id,
          phone: r.phone ?? body.phone,
          name: r.name || undefined,
          subscription_active_until: r.subscription_active_until ?? undefined,
          current_plan: r.current_plan ?? undefined,
          trial_used: r.trial_used ?? false,
        }
        setUser(newUser)
        saveUser(newUser)
        return { ok: true }
      } catch (err) {
        console.error("[Rulo Auth] login error:", err)
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error de conexión.",
        }
      }
    },
    [],
  )

  const register = useCallback(
    async (phone: string, password: string, name?: string): Promise<{ ok: boolean; error?: string }> => {
      const normalized = phone.replace(/\s/g, "").replace(/^\+/, "")
      if (!normalized || normalized.length < 9) {
        return { ok: false, error: "Introduce un número de teléfono válido" }
      }
      if (!password || password.length < 4) {
        return { ok: false, error: "La contraseña debe tener al menos 4 caracteres" }
      }
      const body = {
        phone: phone.trim().startsWith("+") ? phone.trim() : `+${normalized}`,
        password,
        ...(name?.trim() ? { name: name.trim() } : {}),
      }
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        let data: { success?: boolean; errors?: { message: string }[] } = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          // ignore
        }
        if (!res.ok) {
          const raw = data.errors?.[0]?.message ?? ""
          const isUniqueError = raw.includes("UNIQUE") || raw.includes("constraint") || res.status === 409
          const message = isUniqueError
            ? "Ya existe una cuenta vinculada a ese número"
            : raw || "No se pudo crear la cuenta"
          return { ok: false, error: message }
        }
        return { ok: true }
      } catch (err) {
        console.error("[Rulo Auth] register error:", err)
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error de conexión.",
        }
      }
    },
    [],
  )

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      saveUser(updated)
      return updated
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    saveUser(null)
  }, [])

  const deleteAccount = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const currentUser = loadStoredUser()
    const userId = currentUser?.id

    if (!userId) {
      setUser(null)
      saveUser(null)
      return { ok: false, error: "No se encontro la cuenta actual" }
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
      const text = await res.text()
      let data: { success?: boolean; errors?: { message: string }[] } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        // ignore invalid json
      }

      if (!res.ok) {
        return {
          ok: false,
          error: data.errors?.[0]?.message ?? "No se pudo eliminar la cuenta",
        }
      }

      setUser(null)
      saveUser(null)
      return { ok: true }
    } catch (err) {
      console.error("[Rulo Auth] deleteAccount error:", err)
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Error de conexion.",
      }
    }
  }, [])

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    updateUser,
    logout,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
