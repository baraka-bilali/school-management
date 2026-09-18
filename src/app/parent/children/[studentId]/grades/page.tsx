"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  Sparkles,
  CalendarDays,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

type YearItem = {
  yearId: number
  name: string
  isCurrent: boolean
  classId: number
  className: string
  section: string | null
  level: string | null
  enrollmentId: number
}

type StudentInfo = {
  id: number
  code: string
  fullName: string
  firstName: string
  lastName: string
  relationship: string | null
}

export default function ParentChildGradesYearsPage() {
  const params = useParams()
  const studentId = String(params.studentId)
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [years, setYears] = useState<YearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/parent/children/${studentId}/bulletins/years`, {
          credentials: "include",
        })
        if (res.status === 403 || res.status === 404) {
          throw new Error("Cet élève n’est pas lié à votre compte.")
        }
        if (!res.ok) throw new Error("Impossible de charger les années scolaires")
        const data = await res.json()
        if (!cancelled) {
          setStudent(data.student || null)
          setYears(data.years || [])
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentId])

  if (loading) return <StudentLoading variant="list" label="Chargement des années…" />

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 lg:pb-8">
      <div className="flex items-start gap-3">
        <Link
          href="/parent/children"
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
            border,
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
          )}
        >
          <ArrowLeft className={cn("h-4 w-4", textMuted)} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className={cn("text-xl font-bold tracking-tight sm:text-2xl", text)}>
            Notes & bulletins
          </h1>
          {student && (
            <p className={cn("mt-0.5 text-sm", textMuted)}>
              {student.fullName}
              {student.code ? ` · ${student.code}` : ""}
            </p>
          )}
          <p className={cn("mt-1 text-sm", textMuted)}>
            Sélectionnez une année scolaire pour consulter les résultats publiés.
          </p>
        </div>
      </div>

      <Link
        href={`/parent/children/${studentId}`}
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:border-indigo-500/40",
          card,
          border,
          shadow
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
          <CreditCard className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", text)}>Paiements & devoirs</p>
          <p className={cn("text-xs", textMuted)}>Frais scolaires et travaux</p>
        </div>
        <ChevronRight className={cn("h-4 w-4 shrink-0", textMuted)} />
      </Link>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && years.length === 0 && (
        <div className={cn("rounded-2xl border px-6 py-12 text-center", card, border, shadow)}>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
            <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className={cn("font-semibold", text)}>Aucune année scolaire</p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Les inscriptions de cet élève apparaîtront ici dès qu&apos;elles seront enregistrées.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {years.map((y) => (
          <Link
            key={y.yearId}
            href={`/parent/children/${studentId}/grades/${y.yearId}`}
            className={cn(
              "group flex items-center gap-4 rounded-2xl border p-4 transition-all",
              card,
              border,
              shadow,
              y.isCurrent
                ? "ring-2 ring-indigo-500/40 border-indigo-300 dark:border-indigo-500/40"
                : "hover:border-indigo-200 dark:hover:border-indigo-500/30"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                y.isCurrent
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : isDark
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-100 text-gray-600"
              )}
            >
              {y.isCurrent ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <CalendarDays className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("truncate text-base font-bold", text)}>{y.name}</h2>
                {y.isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    En cours
                  </span>
                )}
              </div>
              <p className={cn("mt-0.5 truncate text-sm", textMuted)}>
                {y.className}
                {y.section ? ` · ${y.section}` : ""}
              </p>
            </div>

            <ChevronRight
              className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5",
                textMuted
              )}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
