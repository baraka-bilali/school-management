"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

export interface StudentMe {
  id: number
  schoolId: number | null
  classId: number | null
  yearId: number | null
  lastName: string
  middleName: string | null
  firstName: string
  code: string
  gender: string | null
  birthDate: string | null
  birthPlace: string | null
  nationality: string | null
  address: string | null
  parentName1: string | null
  parentPhone1: string | null
  parentJob1: string | null
  parentEmail1: string | null
  parentName2: string | null
  parentPhone2: string | null
  parentJob2: string | null
  parentEmail2: string | null
  bloodGroup: string | null
  allergies: string | null
  medicalNotes: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  profileCompleted: boolean
  photoUrl: string | null
  email: string | null
  temporaryPassword: boolean
  school?: string
  schoolPhotoUrl: string | null
  isPremium: boolean
  class?: string
  year?: string
}

interface StudentContextValue {
  student: StudentMe | null
  loading: boolean
  refresh: () => Promise<void>
}

const StudentContext = createContext<StudentContextValue | null>(null)

/**
 * Source unique du profil élève (`/api/student/me`).
 * Évite que le layout et chaque page refassent le même appel réseau.
 */
export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentMe | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/student/me", { credentials: "include" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (res.ok) {
        const data = await res.json()
        setStudent(data.student)
      }
    } catch (e) {
      console.error("Erreur chargement profil élève:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <StudentContext.Provider value={{ student, loading, refresh }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudentMe(): StudentContextValue {
  const ctx = useContext(StudentContext)
  if (!ctx) {
    throw new Error("useStudentMe doit être utilisé dans un StudentProvider")
  }
  return ctx
}
