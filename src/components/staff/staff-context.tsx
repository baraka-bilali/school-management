"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

export interface StaffMe {
  userId: number
  schoolId: number
  yearId: number | null
  lastName: string
  middleName: string | null
  firstName: string
  phone: string | null
  email: string | null
  role: string
  roleLabel: string
  school?: string
  schoolPhotoUrl: string | null
  year: string | null
}

interface StaffContextValue {
  staff: StaffMe | null
  loading: boolean
  refresh: () => Promise<void>
}

const StaffContext = createContext<StaffContextValue | null>(null)

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<StaffMe | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/me", { credentials: "include" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff)
      }
    } catch (e) {
      console.error("Erreur chargement profil personnel:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <StaffContext.Provider value={{ staff, loading, refresh }}>
      {children}
    </StaffContext.Provider>
  )
}

export function useStaffMe(): StaffContextValue {
  const ctx = useContext(StaffContext)
  if (!ctx) {
    throw new Error("useStaffMe doit être utilisé dans un StaffProvider")
  }
  return ctx
}
