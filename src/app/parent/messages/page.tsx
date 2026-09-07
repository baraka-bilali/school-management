"use client"

import { Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"

export default function ParentMessagesPage() {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()

  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-xl font-bold tracking-tight", text)}>Communiqués</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>Messages de l&apos;établissement</p>
      </div>

      <div className={cn("rounded-2xl border p-8 text-center", card, border, shadow)}>
        <Megaphone className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
        <p className={cn("font-medium", text)}>Bientôt disponible</p>
        <p className={cn("mt-1 text-sm", textMuted)}>
          Les communiqués destinés aux parents seront affichés ici.
        </p>
      </div>
    </div>
  )
}
