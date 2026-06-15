"use client"

import { useEffect, useState } from "react"
import { ClipboardList } from "lucide-react"
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
  const { card, text, textMuted, shadow, border } = useStudentTheme()
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

  if (loading) return <StudentLoading />

  const activeTasks = tasks.filter((t) => new Date(t.dueAt) >= new Date())
  const pastTasks = tasks.filter((t) => new Date(t.dueAt) < new Date())

  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", text)}>Mes tâches</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>Devoirs et travaux à rendre</p>
      </div>

      {tasks.length === 0 ? (
        <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
          <ClipboardList className={cn("mx-auto mb-3 h-12 w-12", textMuted)} />
          <p className={cn("font-medium", text)}>Aucune tâche</p>
          <p className={cn("mt-1 text-sm", textMuted)}>Vos enseignants publieront les devoirs ici.</p>
        </div>
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
