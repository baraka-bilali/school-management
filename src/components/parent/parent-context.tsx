"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

export interface ParentChild {
  id: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  gender: string
  photoUrl: string | null
  relationship: string | null
}

export interface ParentMe {
  id: number
  userId: number
  schoolId: number
  yearId: number | null
  lastName: string
  middleName: string | null
  firstName: string
  phone: string | null
  email: string | null
  school?: string
  schoolPhotoUrl: string | null
  year: string | null
  children: ParentChild[]
}

interface ParentContextValue {
  parent: ParentMe | null
  loading: boolean
  refresh: () => Promise<void>
}

const ParentContext = createContext<ParentContextValue | null>(null)

export function ParentProvider({ children }: { children: React.ReactNode }) {
  const [parent, setParent] = useState<ParentMe | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/me", { credentials: "include" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (res.ok) {
        const data = await res.json()
        setParent(data.parent)
      }
    } catch (e) {
      console.error("Erreur chargement profil parent:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <ParentContext.Provider value={{ parent, loading, refresh }}>
      {children}
    </ParentContext.Provider>
  )
}

export function useParentMe(): ParentContextValue {
  const ctx = useContext(ParentContext)
  if (!ctx) {
    throw new Error("useParentMe doit être utilisé dans un ParentProvider")
  }
  return ctx
}
