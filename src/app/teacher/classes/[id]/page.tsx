"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Search, Users, BookOpen, ListTodo, CircleCheckBig, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface StudentRow {
  id: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  gender: string
  photoUrl: string | null
}

interface ClassDetail {
  class: {
    id: number
    name: string
    level: string
    section: string
    letter: string
    stream: string | null
  }
  subjects: Array<{ id: number; name: string; color: string | null; weeklyHours: number }>
  tasks: Array<{
    id: number
    title: string
    question: string | null
    description: string | null
    dueAt: string
    createdAt: string
    subject: { id: number; name: string; color: string | null } | null
  }>
  students: StudentRow[]
}

function studentLabel(s: StudentRow) {
  const parts = [s.lastName, s.middleName, s.firstName].filter(Boolean)
  return parts.join(" ")
}

function initials(s: StudentRow) {
  return `${s.firstName?.charAt(0) || ""}${s.lastName?.charAt(0) || ""}`.toUpperCase()
}

function formatDue(dueAt: string) {
  return new Date(dueAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TeacherClassDetailPage() {
  const params = useParams()
  const classId = params.id as string
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [search, setSearch] = useState("")
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const res = await fetch(`/api/teacher/classes/${classId}`, { credentials: "include" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || "Impossible de charger la classe")
          return
        }
        setDetail(await res.json())
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [classId])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    if (!detail?.students) return []
    const q = search.trim().toLowerCase()
    if (!q) return detail.students
    return detail.students.filter((s) => {
      const hay = `${s.code} ${s.lastName} ${s.middleName} ${s.firstName}`.toLowerCase()
      return hay.includes(q)
    })
  }, [detail?.students, search])

  if (loading) return <StudentLoading variant="list" />

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/classes"
          className={cn("inline-flex items-center gap-2 text-sm font-medium", textMuted)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux classes
        </Link>
        <div className={cn("rounded-2xl border p-8 text-center", card, border)}>
          <p className={text}>{error || "Classe introuvable"}</p>
        </div>
      </div>
    )
  }

  const { class: cls, subjects, tasks } = detail
  const todoTasks = tasks.filter((task) => new Date(task.dueAt).getTime() >= now)
  const doneTasks = tasks.filter((task) => new Date(task.dueAt).getTime() < now)

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/teacher/classes"
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
            border,
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
          )}
        >
          <ArrowLeft className={cn("h-4 w-4", text)} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className={cn("text-xl font-bold lg:text-2xl", text)}>{cls.name}</h1>
          <p className={cn("mt-0.5 text-sm", textMuted)}>
            {cls.level} · {cls.section}
            {cls.letter ? ` · ${cls.letter}` : ""}
            {cls.stream ? ` · ${cls.stream}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${s.color || "#4f46e5"}22`,
                  color: s.color || "#4f46e5",
                }}
              >
                <BookOpen className="h-3 w-3" />
                {s.name} · {s.weeklyHours}h/sem.
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={cn("rounded-3xl border p-4 lg:p-5", card, border, shadow)}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={cn("text-base font-bold", text)}>Tâches à faire</h2>
              <p className={cn("text-sm", textMuted)}>Du plus récent au plus ancien</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
              <ListTodo className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3">
            {todoTasks.length > 0 ? (
              todoTasks.map((task) => (
                <div key={task.id} className={cn("rounded-2xl border p-4", border, isDark ? "bg-gray-950/40" : "bg-gray-50/80")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          À faire
                        </span>
                        {task.subject?.name && (
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                            style={{
                              backgroundColor: `${task.subject.color || "#4f46e5"}22`,
                              color: task.subject.color || "#4f46e5",
                            }}
                          >
                            {task.subject.name}
                          </span>
                        )}
                      </div>
                      <p className={cn("text-sm font-semibold", text)}>{task.title}</p>
                      {task.description && (
                        <p className={cn("mt-1.5 line-clamp-3 text-xs", textMuted)}>{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className={cn("mt-3 flex items-center gap-1.5 text-xs", textMuted)}>
                    <Clock className="h-3.5 w-3.5" />
                    Échéance : {formatDue(task.dueAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className={cn("rounded-2xl border border-dashed p-5 text-center text-sm", border, textMuted)}>
                Aucune tâche en attente dans cette classe.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-4 lg:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={cn("text-base font-bold", text)}>Tâches terminées</h2>
              <p className={cn("text-sm", textMuted)}>Déplacées automatiquement après échéance</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CircleCheckBig className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3">
            {doneTasks.length > 0 ? (
              doneTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Terminée
                        </span>
                        {task.subject?.name && (
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                            style={{
                              backgroundColor: `${task.subject.color || "#4f46e5"}22`,
                              color: task.subject.color || "#4f46e5",
                            }}
                          >
                            {task.subject.name}
                          </span>
                        )}
                      </div>
                      <p className={cn("text-sm font-semibold", text)}>{task.title}</p>
                      {task.description && (
                        <p className={cn("mt-1.5 line-clamp-3 text-xs", textMuted)}>{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                    Échéance atteinte : {formatDue(task.dueAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-emerald-500/20 p-5 text-center text-sm text-emerald-600 dark:text-emerald-400">
                Rien n&apos;est encore terminé dans cette classe.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className={cn("rounded-2xl border p-4 lg:p-5", card, border, shadow)}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h2 className={cn("text-base font-bold", text)}>
              Élèves ({detail.students.length})
            </h2>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", textMuted)} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un élève..."
              className={cn(
                "w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30",
                border,
                isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
              )}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className={cn("py-8 text-center text-sm", textMuted)}>
            {search ? "Aucun élève ne correspond à votre recherche." : "Aucun élève inscrit dans cette classe."}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                      {initials(student)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-medium", text)}>{studentLabel(student)}</p>
                  <p className={cn("text-xs", textMuted)}>
                    Matricule {student.code} · {student.gender === "M" ? "Garçon" : "Fille"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
