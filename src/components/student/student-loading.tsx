"use client"

import { useStudentTheme } from "./use-student-theme"

export default function StudentLoading({ label = "Chargement..." }: { label?: string }) {
  const { textMuted } = useStudentTheme()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-600" style={{ animationDelay: "0ms" }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-600" style={{ animationDelay: "150ms" }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-600" style={{ animationDelay: "300ms" }} />
      </div>
      <p className={`text-sm ${textMuted}`}>{label}</p>
    </div>
  )
}
