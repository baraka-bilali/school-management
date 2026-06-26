"use client"

import { useEffect, useState, useMemo } from "react"
import { ClipboardList, Plus, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"
import TeacherTaskCard from "@/components/teacher/teacher-task-card"

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

export default function TeacherTasksPage() {
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classFilter, setClassFilter] = useState<number | "all">("all")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
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

  const fetchTasks = async (classId?: number) => {
    const params = classId ? `?classId=${classId}` : ""
    const res = await fetch(`/api/teacher/tasks${params}`, { credentials: "include" })
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
    if (loading) return
    void fetchTasks(classFilter === "all" ? undefined : classFilter)
  }, [classFilter, loading])

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
      await fetchTasks(classFilter === "all" ? undefined : classFilter)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <StudentLoading variant="tasks" />

  const now = new Date()
  const activeTasks = tasks.filter((t) => new Date(t.dueAt) >= now)
  const overdueTasks = tasks.filter((t) => new Date(t.dueAt) < now)

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Mes tâches</h1>
          <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>Devoirs assignés à vos classes</p>
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

      {classes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setClassFilter("all")}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              classFilter === "all"
                ? "bg-indigo-600 text-white"
                : cn(card, border, textMuted)
            )}
          >
            Toutes
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClassFilter(c.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                classFilter === c.id
                  ? "bg-indigo-600 text-white"
                  : cn(card, border, textMuted)
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className={cn("rounded-2xl border p-10 text-center lg:mx-auto lg:max-w-2xl", card, border, shadow)}>
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-indigo-500/50" />
          <p className={cn("text-lg font-semibold", text)}>Aucune tâche</p>
          <p className={cn("mx-auto mt-2 max-w-md text-sm", textMuted)}>
            Créez des devoirs pour vos élèves en appuyant sur « Nouvelle tâche ».
          </p>
        </div>
      ) : (
        <>
          {overdueTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className={cn("text-sm font-semibold text-red-600", textMuted)}>Échues — à corriger</h2>
              {overdueTasks.map((task) => (
                <TeacherTaskCard key={task.id} task={task} overdue />
              ))}
            </section>
          )}
          {activeTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className={cn("text-sm font-semibold", textMuted)}>En cours</h2>
              {activeTasks.map((task) => (
                <TeacherTaskCard key={task.id} task={task} />
              ))}
            </section>
          )}
        </>
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
                  className={cn("rounded-xl", isDark && "border-gray-700 bg-gray-800")}
                  required
                />
              </div>
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
