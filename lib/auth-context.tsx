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

const API_URL = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL ?? "" : ""

export type AuthUser = {
  id: string
  phone: string
  name?: string
  email?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
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
    setUser(loadStoredUser())
    setIsLoading(false)
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
      if (!API_URL) {
        return {
          ok: false,
          error: "API no configurada. Añade NEXT_PUBLIC_API_URL en .env.local (ej. https://rulo-api.kommo-test.workers.dev)",
        }
      }

      const body = {
        phone: phone.trim().startsWith("+") ? phone.trim() : `+${normalized}`,
        password,
      }
      try {
        const url = `${API_URL.replace(/\/$/, "")}/auth/login`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        let data: {
          success?: boolean
          result?: { id: string; phone: string | null; email: string | null; name: string | null; surname: string | null }
          errors?: { message: string }[]
        }
        try {
          data = text ? (JSON.parse(text) as typeof data) : {}
        } catch {
          return {
            ok: false,
            error: "La API devolvió una respuesta no válida. Comprueba que NEXT_PUBLIC_API_URL sea la URL correcta de la API (ej. https://rulo-api.kommo-test.workers.dev).",
          }
        }
        if (!res.ok || !data.success || !data.result) {
          const message = data.errors?.[0]?.message ?? "Teléfono o contraseña incorrectos"
          return { ok: false, error: message }
        }
        const r = data.result
        const newUser: AuthUser = {
          id: r.id,
          phone: r.phone ?? body.phone,
          name: [r.name, r.surname].filter(Boolean).join(" ") || undefined,
          email: r.email ?? undefined,
        }
        setUser(newUser)
        saveUser(newUser)
        return { ok: true }
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error de conexión. Revisa la URL de la API.",
        }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setUser(null)
    saveUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    logout,
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
