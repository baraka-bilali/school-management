"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ClipboardList,
  Plus,
  Loader2,
  X,
  Sparkles,
  ChevronRight,
  BookOpen,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface Task {
  id: number
  title: string
  question: string | null
  description: string | null
  dueAt: string
  createdAt: string
  class: { id: number; name: string }
  subject: { id: number; name: string; color: string | null } | null
}

interface Assignment {
  classId: number
  className: string
  subjectId: number
  subjectName: string
}

function getMinDueAtValue() {
  const now = new Date()
  now.setSeconds(0, 0)
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TeacherTasksPage() {
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [minDueAt, setMinDueAt] = useState(getMinDueAtValue())
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    classId: "",
    subjectId: "",
  })

  const classes = useMemo(() => {
    const map = new Map<number, string>()
    for (const a of assignments) map.set(a.classId, a.className)
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [assignments])

  const subjectsForClass = useMemo(() => {
    if (!form.classId) return []
    return assignments.filter((a) => a.classId === parseInt(form.classId))
  }, [assignments, form.classId])

  const fetchTasks = async () => {
    const res = await fetch("/api/teacher/tasks", { credentials: "include" })
    if (res.ok) {
      const data = await res.json()
      setTasks(data.tasks || [])
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/teacher/me", { credentials: "include" })
        if (meRes.ok) {
          const { teacher } = await meRes.json()
          setAssignments(teacher.assignments || [])
        }
        await fetchTasks()
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    setMinDueAt(getMinDueAtValue())
    const id = window.setInterval(() => setMinDueAt(getMinDueAtValue()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const openCreateForClass = (classId: number) => {
    setForm((prev) => ({ ...prev, classId: String(classId), subjectId: "" }))
    setFormError("")
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/teacher/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          dueAt: form.dueAt,
          classId: parseInt(form.classId),
          subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setShowForm(false)
      setForm({ title: "", description: "", dueAt: "", classId: "", subjectId: "" })
      await fetchTasks()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <StudentLoading variant="tasks" />

  const classBoards = classes.map((cls) => {
    const classTasks = tasks.filter((task) => task.class.id === cls.id)
    const now = Date.now()
    const todoCount = classTasks.filter((task) => new Date(task.dueAt).getTime() >= now).length
    const doneCount = classTasks.length - todoCount

    return {
      ...cls,
      todoCount,
      doneCount,
      latestTask: classTasks[0] || null,
      subjects: Array.from(
        new Set(
          assignments
            .filter((assignment) => assignment.classId === cls.id)
            .map((assignment) => assignment.subjectName)
        )
      ),
    }
  })

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Gestion des tâches</h1>
          <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>
            Choisissez une classe pour entrer dans son espace de travail avec les colonnes « À faire » et « Terminées ».
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle tâche</span>
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <p className={cn("text-xs font-bold uppercase tracking-wide text-indigo-500")}>Classes</p>
          <p className={cn("mt-2 text-3xl font-bold", text)}>{classBoards.length}</p>
          <p className={cn("text-sm", textMuted)}>espaces de tâches</p>
        </div>
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <p className={cn("text-xs font-bold uppercase tracking-wide text-amber-500")}>À faire</p>
          <p className={cn("mt-2 text-3xl font-bold", text)}>
            {classBoards.reduce((sum, cls) => sum + cls.todoCount, 0)}
          </p>
          <p className={cn("text-sm", textMuted)}>tâches visibles côté élèves</p>
        </div>
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <p className={cn("text-xs font-bold uppercase tracking-wide text-emerald-500")}>Terminées</p>
          <p className={cn("mt-2 text-3xl font-bold", text)}>
            {classBoards.reduce((sum, cls) => sum + cls.doneCount, 0)}
          </p>
          <p className={cn("text-sm", textMuted)}>basculées après échéance</p>
        </div>
      </div>

      {classBoards.length === 0 ? (
        <div className={cn("rounded-2xl border p-10 text-center lg:mx-auto lg:max-w-2xl", card, border, shadow)}>
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-indigo-500/50" />
          <p className={cn("text-lg font-semibold", text)}>Aucune classe disponible</p>
          <p className={cn("mx-auto mt-2 max-w-md text-sm", textMuted)}>
            Dès qu&apos;une classe vous est assignée, vous pourrez créer et piloter ses tâches depuis cet espace.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classBoards.map((cls) => (
            <div key={cls.id} className={cn("group rounded-3xl border p-4", card, border, shadow)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("truncate text-base font-bold", text)}>{cls.name}</p>
                      <p className={cn("truncate text-xs", textMuted)}>
                        {cls.subjects.length > 0 ? cls.subjects.join(" · ") : "Aucune matière liée"}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateForClass(cls.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-transform hover:scale-105"
                  title={`Créer une tâche pour ${cls.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className={cn("rounded-2xl border px-3 py-3", border, isDark ? "bg-gray-950/50" : "bg-gray-50")}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-500">À faire</p>
                  <p className={cn("mt-1 text-xl font-bold", text)}>{cls.todoCount}</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Terminées</p>
                  <p className={cn("mt-1 text-xl font-bold", text)}>{cls.doneCount}</p>
                </div>
              </div>

              <div className="mt-4">
                {cls.latestTask ? (
                  <div className={cn("rounded-2xl border px-3 py-3", border, isDark ? "bg-gray-950/30" : "bg-gray-50/80")}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">Dernière tâche</p>
                    <p className={cn("mt-1 truncate text-sm font-semibold", text)}>{cls.latestTask.title}</p>
                    <p className={cn("mt-1 text-xs", textMuted)}>
                      Créée le {formatDateTime(cls.latestTask.createdAt)} · échéance {formatDateTime(cls.latestTask.dueAt)}
                    </p>
                  </div>
                ) : (
                  <div className={cn("rounded-2xl border border-dashed px-3 py-4 text-center text-sm", border, textMuted)}>
                    Aucune tâche pour cette classe.
                  </div>
                )}
              </div>

              <Link
                href={`/teacher/tasks/${cls.id}`}
                className={cn(
                  "mt-4 inline-flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
                  border,
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-50",
                  text
                )}
              >
                <span>Ouvrir le tableau de la classe</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setShowForm(false)}>
          <div
            className={cn("max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-xl", card, border)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn("text-lg font-bold", text)}>Nouvelle tâche</h3>
              <button type="button" onClick={() => setShowForm(false)} className={textMuted}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Titre *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Exercices page 42"
                  className={cn("rounded-xl", isDark && "border-gray-700 bg-gray-800")}
                  required
                />
              </div>
              <div>
                <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Classe *</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })}
                  className={cn("w-full rounded-xl border px-3 py-2.5 text-sm", isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white")}
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {subjectsForClass.length > 1 && (
                <div>
                  <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Matière</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className={cn("w-full rounded-xl border px-3 py-2.5 text-sm", isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white")}
                  >
                    <option value="">Par défaut</option>
                    {subjectsForClass.map((a) => (
                      <option key={a.subjectId} value={a.subjectId}>{a.subjectName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Date et heure limite *</label>
                <Input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                  min={minDueAt}
                  className={cn("rounded-xl", isDark && "border-gray-700 bg-gray-800")}
                  required
                />
              </div>
              <p className={cn("-mt-1 text-xs", textMuted)}>
                Date autorisée : maintenant ou dans le futur.
              </p>
              <div>
                <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Consignes pour les élèves..."
                  className={cn("w-full rounded-xl border px-3 py-2 text-sm", isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white")}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {submitting ? "Création..." : "Créer la tâche"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
