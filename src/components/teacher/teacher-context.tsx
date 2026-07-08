"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

export interface TeacherAssignment {
  id: number
  classId: number
  className: string
  subjectId: number
  subjectName: string
  subjectColor: string | null
  weeklyHours: number
}

export interface TeacherMe {
  id: number
  userId: number
  schoolId: number
  yearId: number | null
  lastName: string
  middleName: string | null
  firstName: string
  gender: string | null
  birthDate: string | null
  specialty: string | null
  phone: string | null
  hiredAt: string | null
  email: string | null
  school?: string
  schoolPhotoUrl: string | null
  year: string | null
  classCount: number
  courseCount: number
  classes: Array<{ id: number; name: string }>
  assignments: TeacherAssignment[]
}

interface TeacherContextValue {
  teacher: TeacherMe | null
  loading: boolean
  refresh: () => Promise<void>
}

const TeacherContext = createContext<TeacherContextValue | null>(null)

/**
 * Source unique du profil enseignant (`/api/teacher/me`).
 * Évite que le layout et chaque page refassent le même appel réseau.
 */
export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacher] = useState<TeacherMe | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/me", { credentials: "include" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (res.ok) {
        const data = await res.json()
        setTeacher(data.teacher)
      }
    } catch (e) {
      console.error("Erreur chargement profil enseignant:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <TeacherContext.Provider value={{ teacher, loading, refresh }}>
      {children}
    </TeacherContext.Provider>
  )
}

export function useTeacherMe(): TeacherContextValue {
  const ctx = useContext(TeacherContext)
  if (!ctx) {
    throw new Error("useTeacherMe doit être utilisé dans un TeacherProvider")
  }
  return ctx
}
