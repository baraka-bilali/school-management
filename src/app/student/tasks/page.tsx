"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Lightbulb, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"
import TaskCard from "@/components/student/task-card"

interface Task {
  id: number
  title: string
  question: string | null
  description: string | null
  dueAt: string
  createdAt: string
  subject: { name: string; color: string | null } | null
  teacher: { firstName: string; lastName: string }
}

export default function StudentTasksPage() {
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/student/tasks", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const onNewTask = () => fetchTasks()
    window.addEventListener("newTaskReceived", onNewTask)
    return () => window.removeEventListener("newTaskReceived", onNewTask)
  }, [])

  if (loading) return <StudentLoading variant="cards" />

  const activeTasks = tasks.filter((t) => new Date(t.dueAt) >= new Date())
  const pastTasks = tasks.filter((t) => new Date(t.dueAt) < new Date())

  return (
    <div className="space-y-5 lg:space-y-8">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Mes tâches</h1>
        <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>Devoirs et travaux à rendre</p>
      </div>

      {tasks.length === 0 ? (
        <>
          <div className={cn("rounded-2xl border p-10 text-center lg:mx-auto lg:max-w-2xl lg:p-16", card, border, shadow)}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/10 lg:h-20 lg:w-20">
              <ClipboardList className="h-8 w-8 text-indigo-600 dark:text-indigo-400 lg:h-10 lg:w-10" />
            </div>
            <p className={cn("text-lg font-semibold lg:text-xl", text)}>Aucune tâche</p>
            <p className={cn("mx-auto mt-2 max-w-md text-sm leading-relaxed lg:text-base", textMuted)}>
              Tout est à jour ! Vos enseignants publieront les devoirs ici dès qu&apos;ils seront disponibles.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Cahier de texte", "Calendrier", "Notes"].map((label) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium",
                    border,
                    isDark ? "bg-white/5 text-gray-300" : "bg-gray-50 text-gray-600"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            <div className={cn("rounded-2xl border p-5", card, border, shadow)}>
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className={cn("text-sm font-bold", text)}>Conseil d&apos;étude</h3>
              </div>
              <p className={cn("text-sm leading-relaxed", textMuted)}>
                Utilisez ce temps libre pour réviser vos leçons de mathématiques pour le contrôle de vendredi.
              </p>
            </div>
            <div className={cn("rounded-2xl border p-5", card, border, shadow)}>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <h3 className={cn("text-sm font-bold", text)}>Félicitations</h3>
              </div>
              <p className={cn("text-sm leading-relaxed", textMuted)}>
                Vous avez complété 100% de vos devoirs la semaine dernière. Continuez ainsi !
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {activeTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className={cn("text-sm font-semibold", textMuted)}>À rendre</h2>
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </section>
          )}
          {pastTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className={cn("text-sm font-semibold", textMuted)}>Échues</h2>
              {pastTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
