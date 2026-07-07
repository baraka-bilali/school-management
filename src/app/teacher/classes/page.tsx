"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { GraduationCap, Users, ChevronRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface ClassSubject {
  id: number
  name: string
  color: string | null
  weeklyHours: number
}

interface TeacherClass {
  id: number
  name: string
  level: string
  section: string
  letter: string
  studentCount: number
  subjects: ClassSubject[]
}

export default function TeacherClassesPage() {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [yearName, setYearName] = useState<string | null>(null)
  const [classes, setClasses] = useState<TeacherClass[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teacher/classes", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setYearName(data.yearName ?? null)
          setClasses(data.classes ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <StudentLoading variant="list" />

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={cn("text-xl font-bold lg:text-2xl", text)}>Mes classes</h1>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Classes où vous enseignez{yearName ? ` — ${yearName}` : ""}
          </p>
        </div>
        <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", card, border)}>
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          <span className={textMuted}>{classes.length} classe{classes.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
          <GraduationCap className={cn("mx-auto mb-3 h-12 w-12", textMuted)} />
          <p className={cn("font-medium", text)}>Aucune classe assignée</p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Contactez l&apos;administration pour vos affectations.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/teacher/classes/${cls.id}`}
              className={cn(
                "group rounded-2xl border p-4 transition-all hover:border-indigo-500/40 hover:shadow-md lg:p-5",
                card,
                border,
                shadow
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-base font-bold lg:text-lg", text)}>{cls.name}</p>
                  <p className={cn("mt-0.5 text-xs", textMuted)}>
                    {cls.level} · {cls.section}
                    {cls.letter ? ` · ${cls.letter}` : ""}
                  </p>
                </div>
                <ChevronRight className={cn("h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5", textMuted)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {cls.subjects.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${s.color || "#4f46e5"}22`,
                      color: s.color || "#4f46e5",
                    }}
                  >
                    <BookOpen className="h-3 w-3" />
                    {s.name}
                  </span>
                ))}
              </div>

              <div className={cn("mt-4 flex items-center gap-2 text-sm", textMuted)}>
                <Users className="h-4 w-4" />
                <span>
                  {cls.studentCount} élève{cls.studentCount !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
