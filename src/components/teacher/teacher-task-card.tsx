"use client"

import { Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "./use-teacher-theme"

interface TeacherTaskCardProps {
  task: {
    id: number
    title: string
    dueAt: string
    class: { name: string }
    subject: { name: string; color: string | null } | null
  }
  overdue?: boolean
}

function formatDue(dueAt: string) {
  return new Date(dueAt).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TeacherTaskCard({ task, overdue }: TeacherTaskCardProps) {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        overdue ? "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5" : cn(card, border),
        shadow
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {overdue && (
            <span className="mb-1 inline-block rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              EN RETARD
            </span>
          )}
          <p className={cn("font-semibold truncate", text)}>{task.title}</p>
          <p className={cn("mt-0.5 flex items-center gap-1 text-xs", textMuted)}>
            <BookOpen className="h-3 w-3 shrink-0" />
            {task.class.name}
            {task.subject?.name ? ` · ${task.subject.name}` : ""}
          </p>
        </div>
      </div>
      <div className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium", overdue ? "text-red-600" : textMuted)}>
        <Clock className="h-3.5 w-3.5" />
        Échéance : {formatDue(task.dueAt)}
      </div>
    </div>
  )
}
