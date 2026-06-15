"use client"

import { useEffect, useState } from "react"
import { ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import { getTaskTimeProgress, isTaskOverdue } from "@/lib/student-auth"

interface TaskCardProps {
  task: {
    id: number
    title: string
    question?: string | null
    description?: string | null
    dueAt: string
    createdAt: string
    subject?: { name: string; color?: string | null } | null
    teacher?: { firstName: string; lastName: string }
  }
  compact?: boolean
}

export default function TaskCard({ task, compact = false }: TaskCardProps) {
  const { card, text, textMuted, shadow, border } = useStudentTheme()
  const [progress, setProgress] = useState(() => getTaskTimeProgress(task.createdAt, task.dueAt))
  const overdue = isTaskOverdue(task.dueAt)

  useEffect(() => {
    const tick = () => setProgress(getTaskTimeProgress(task.createdAt, task.dueAt))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [task.createdAt, task.dueAt])

  const dueLabel = new Date(task.dueAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
      <div className={cn("border-l-4 p-4", overdue ? "border-red-500" : "border-indigo-500")}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className={cn("text-sm font-semibold leading-snug", text)}>{task.title}</p>
              {task.subject?.name && (
                <p className={cn("mt-0.5 text-xs", textMuted)}>{task.subject.name}</p>
              )}
              {!compact && task.question && (
                <p className={cn("mt-2 text-xs leading-relaxed", textMuted)}>{task.question}</p>
              )}
            </div>
          </div>
          <span className={cn("shrink-0 text-[11px] font-medium", overdue ? "text-red-500" : textMuted)}>
            {dueLabel}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", overdue ? "bg-red-500" : "bg-indigo-600")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={cn("mt-2 text-[10px]", overdue ? "font-medium text-red-500" : textMuted)}>
          {overdue ? "Délai dépassé" : `Temps écoulé : ${progress}%`}
        </p>
      </div>
    </div>
  )
}
