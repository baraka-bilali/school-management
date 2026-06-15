"use client"

import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"

export default function StudentSchedulePage() {
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()

  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", text)}>Horaire des cours</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>Consultez votre emploi du temps hebdomadaire</p>
      </div>

      <div
        className={cn(
          "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center",
          isDark ? "border-gray-700 bg-gray-900/50" : "border-indigo-100 bg-indigo-50/40"
        )}
      >
        <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-full", card, shadow)}>
          <Calendar className="h-6 w-6 text-indigo-400" />
        </div>
        <p className={cn("text-sm font-semibold", text)}>Fonctionnalité à venir</p>
        <p className={cn("mt-2 max-w-xs text-xs leading-relaxed", textMuted)}>
          Votre emploi du temps sera bientôt disponible ici avec les horaires de chaque cours.
        </p>
      </div>
    </div>
  )
}
