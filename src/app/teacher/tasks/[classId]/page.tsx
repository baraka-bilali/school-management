"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CircleCheckBig,
  Clock,
  ListTodo,
  Loader2,
  Plus,
  Sparkles,
  X,
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
  subject: { id: number; name: string; color: string | null } | null
}

interface ClassInfo {
  id: number
  name: string
  level: string
  section: string
  letter: string
  stream: string | null
}

interface Subject {
  id: number
  name: string
  color: string | null
  weeklyHours: number
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

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (createdDiff !== 0) return createdDiff
    return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime()
  })
}

function TaskBoardCard({
  task,
  variant,
  text,
  textMuted,
  border,
  isDark,
}: {
  task: Task
  variant: "todo" | "done"
  text: string
  textMuted: string
  border: string
  isDark: boolean
}) {
  const isTodo = variant === "todo"

  return (
    <article
      className={cn(
        "group relative rounded-2xl border p-4 transition-all duration-200",
        isTodo
          ? cn(border, isDark ? "bg-gray-950/60 hover:border-indigo-500/40" : "bg-white hover:border-indigo-300 hover:shadow-md")
          : "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40"
      )}
    >
      {/* Connector dot toward timeline */}
      <span
        className={cn(
          "absolute top-6 hidden h-2.5 w-2.5 rounded-full ring-4 xl:block",
          isTodo
            ? "-right-[calc(1.25rem+5px)] ring-indigo-500/20 bg-indigo-500"
            : "-left-[calc(1.25rem+5px)] ring-emerald-500/20 bg-emerald-500"
        )}
      />

      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
            isTodo ? "bg-indigo-600" : "bg-emerald-500"
          )}
        >
          {isTodo ? "À faire" : "Terminée"}
        </span>
        {task.subject?.name && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${task.subject.color || "#4f46e5"}22`,
              color: task.subject.color || "#4f46e5",
            }}
          >
            {task.subject.name}
          </span>
        )}
      </div>

      <h3 className={cn("text-sm font-semibold leading-snug", text)}>{task.title}</h3>
      {task.description && (
        <p className={cn("mt-1.5 line-clamp-3 text-xs leading-relaxed", textMuted)}>{task.description}</p>
      )}

      <div
        className={cn(
          "mt-3 flex items-center gap-1.5 text-[11px]",
          isTodo ? textMuted : "text-emerald-600 dark:text-emerald-400"
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>
          Créée le {formatDateTime(task.createdAt)}
          {isTodo ? ` · échéance ${formatDateTime(task.dueAt)}` : ` · échéance atteinte ${formatDateTime(task.dueAt)}`}
        </span>
      </div>
    </article>
  )
}

export default function TeacherClassTaskBoardPage() {
  const params = useParams()
  const classId = params.classId as string
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [now, setNow] = useState(() => Date.now())

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [minDueAt, setMinDueAt] = useState(getMinDueAtValue())
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueAt: "",
    subjectId: "",
  })

  const subjectsForClass = useMemo(
    () => subjects.map((s) => ({ subjectId: s.id, subjectName: s.name })),
    [subjects]
  )

  const fetchBoard = async () => {
    const res = await fetch(`/api/teacher/classes/${classId}`, { credentials: "include" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Impossible de charger le tableau")
    }
    const data = await res.json()
    setClassInfo(data.class)
    setSubjects(data.subjects || [])
    setTasks(data.tasks || [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        await fetchBoard()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement")
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

  useEffect(() => {
    setMinDueAt(getMinDueAtValue())
    const id = window.setInterval(() => setMinDueAt(getMinDueAtValue()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const todoTasks = useMemo(
    () => sortTasks(tasks.filter((t) => new Date(t.dueAt).getTime() >= now)),
    [tasks, now]
  )
  const doneTasks = useMemo(
    () => sortTasks(tasks.filter((t) => new Date(t.dueAt).getTime() < now)),
    [tasks, now]
  )

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
          classId: parseInt(classId, 10),
          subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setShowForm(false)
      setForm({ title: "", description: "", dueAt: "", subjectId: "" })
      await fetchBoard()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <StudentLoading variant="tasks" />

  if (error || !classInfo) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/tasks"
          className={cn("inline-flex items-center gap-2 text-sm font-medium", textMuted)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux tâches
        </Link>
        <div className={cn("rounded-2xl border p-8 text-center", card, border)}>
          <p className={text}>{error || "Tableau introuvable"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/teacher/tasks"
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
              border,
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
            )}
          >
            <ArrowLeft className={cn("h-4 w-4", text)} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Tableau de classe</p>
            </div>
            <h1 className={cn("mt-1 text-xl font-bold lg:text-2xl", text)}>{classInfo.name}</h1>
            <p className={cn("mt-0.5 text-sm", textMuted)}>
              {classInfo.level} · {classInfo.section}
              {classInfo.letter ? ` · ${classInfo.letter}` : ""}
              {classInfo.stream ? ` · ${classInfo.stream}` : ""}
            </p>
            {subjects.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
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
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("")
            setShowForm(true)
          }}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10">
              <ListTodo className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">À faire</p>
              <p className={cn("text-2xl font-bold", text)}>{todoTasks.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CircleCheckBig className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Terminées</p>
              <p className={cn("text-2xl font-bold", text)}>{doneTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline board */}
      <div className={cn("relative overflow-hidden rounded-3xl border", card, border, shadow)}>
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-emerald-500/[0.06]" />

        {/* Mobile: stacked with horizontal timeline */}
        <div className="relative p-4 lg:hidden">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-indigo-500" />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-600 text-[9px] font-bold text-white shadow-lg shadow-indigo-500/30">
              NOW
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-500 via-emerald-500/50 to-transparent" />
          </div>

          <section className="mb-8">
            <h2 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", text)}>
              <ListTodo className="h-4 w-4 text-indigo-500" />
              Tâches à faire
            </h2>
            <div className="space-y-3">
              {todoTasks.length > 0 ? (
                todoTasks.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    variant="todo"
                    text={text}
                    textMuted={textMuted}
                    border={border}
                    isDark={isDark}
                  />
                ))
              ) : (
                <div className={cn("rounded-2xl border border-dashed p-6 text-center text-sm", border, textMuted)}>
                  Aucune tâche en attente.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", text)}>
              <CircleCheckBig className="h-4 w-4 text-emerald-500" />
              Tâches terminées
            </h2>
            <div className="space-y-3">
              {doneTasks.length > 0 ? (
                doneTasks.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    variant="done"
                    text={text}
                    textMuted={textMuted}
                    border={border}
                    isDark={isDark}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-500/30 p-6 text-center text-sm text-emerald-600 dark:text-emerald-400">
                  Rien n&apos;est encore terminé.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Desktop: two columns with central vertical timeline */}
        <div className="relative hidden min-h-[420px] lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Left — À faire */}
          <div className="p-5 xl:p-6">
            <div className="mb-5 flex items-center justify-between pr-4">
              <div>
                <h2 className={cn("text-base font-bold", text)}>Tâches à faire</h2>
                <p className={cn("text-xs", textMuted)}>Visibles pour les élèves jusqu&apos;à l&apos;échéance</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10">
                <ListTodo className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="space-y-3 pr-5">
              {todoTasks.length > 0 ? (
                todoTasks.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    variant="todo"
                    text={text}
                    textMuted={textMuted}
                    border={border}
                    isDark={isDark}
                  />
                ))
              ) : (
                <div className={cn("rounded-2xl border border-dashed p-8 text-center text-sm", border, textMuted)}>
                  <ListTodo className="mx-auto mb-2 h-8 w-8 text-indigo-500/30" />
                  Aucune tâche en attente dans cette classe.
                </div>
              )}
            </div>
          </div>

          {/* Central timeline */}
          <div className="relative flex w-14 flex-col items-center py-6 xl:w-16">
            <div className="absolute inset-y-6 left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-indigo-500 via-violet-500 to-emerald-500" />
            <div className="relative z-10 mt-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-indigo-400 bg-indigo-600 text-[10px] font-bold tracking-wide text-white shadow-lg shadow-indigo-500/40">
              NOW
            </div>
            <div className="relative z-10 mt-auto mb-2 flex flex-col items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>

          {/* Right — Terminées */}
          <div className="border-l border-dashed border-emerald-500/20 p-5 xl:p-6">
            <div className="mb-5 flex items-center justify-between pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <CircleCheckBig className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-right">
                <h2 className={cn("text-base font-bold", text)}>Tâches terminées</h2>
                <p className={cn("text-xs", textMuted)}>Basculées automatiquement après échéance</p>
              </div>
            </div>
            <div className="space-y-3 pl-5">
              {doneTasks.length > 0 ? (
                doneTasks.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    variant="done"
                    text={text}
                    textMuted={textMuted}
                    border={border}
                    isDark={isDark}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-500/30 p-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
                  <CircleCheckBig className="mx-auto mb-2 h-8 w-8 text-emerald-500/30" />
                  Rien n&apos;est encore terminé.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create task modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className={cn("max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-xl", card, border)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn("text-lg font-bold", text)}>Nouvelle tâche — {classInfo.name}</h3>
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
              {subjectsForClass.length > 1 && (
                <div>
                  <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Matière</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-sm",
                      isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                    )}
                  >
                    <option value="">Par défaut</option>
                    {subjectsForClass.map((a) => (
                      <option key={a.subjectId} value={a.subjectId}>
                        {a.subjectName}
                      </option>
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
              <p className={cn("-mt-1 text-xs", textMuted)}>Date autorisée : maintenant ou dans le futur.</p>
              <div>
                <label className={cn("mb-1.5 block text-sm font-medium", textMuted)}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Consignes pour les élèves..."
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-sm",
                    isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                  )}
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
