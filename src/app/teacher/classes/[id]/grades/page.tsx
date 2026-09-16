"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"
import { TeacherPrimaryGradesBoard } from "@/components/teacher/teacher-primary-grades-board"
import { TeacherSecondaryGradesBoard } from "@/components/teacher/teacher-secondary-grades-board"

export default function TeacherGradesPage() {
  return (
    <Suspense fallback={<StudentLoading variant="list" />}>
      <TeacherGradesRouter />
    </Suspense>
  )
}

function TeacherGradesRouter() {
  const params = useParams()
  const searchParams = useSearchParams()
  const classId = params.id as string
  const assignmentId = Number(searchParams.get("assignmentId") || 0)
  const { card, text, textMuted, border } = useTeacherTheme()
  const [section, setSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/teacher/classes/${classId}`, {
          credentials: "include",
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Classe introuvable")
        setSection(data.class?.section ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [classId])

  if (loading) return <StudentLoading variant="list" />

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href={`/teacher/classes/${classId}`}
          className={cn("inline-flex items-center gap-2 text-sm", textMuted)}
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className={cn("rounded-2xl border p-8 text-center", card, border)}>
          <p className={text}>{error}</p>
        </div>
      </div>
    )
  }

  if (section === "Primaire") {
    const enrollmentId = Number(searchParams.get("enrollmentId") || 0) || null
    const openBulletin = searchParams.get("bulletin") === "1"
    return (
      <TeacherPrimaryGradesBoard
        classId={classId}
        initialEnrollmentId={openBulletin ? enrollmentId : null}
      />
    )
  }

  if (!assignmentId) {
    return (
      <div className={cn("rounded-2xl border p-8 text-center", card, border)}>
        <p className={text}>Sélectionnez un cours depuis la fiche classe.</p>
        <Link
          href={`/teacher/classes/${classId}`}
          className="mt-3 inline-block text-sm text-indigo-600"
        >
          Retour
        </Link>
      </div>
    )
  }

  return (
    <TeacherSecondaryGradesBoard
      classId={classId}
      assignmentId={assignmentId}
    />
  )
}
