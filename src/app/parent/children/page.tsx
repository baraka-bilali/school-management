"use client"

import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "@/components/parent/parent-context"
import StudentLoading from "@/components/student/student-loading"

export default function ParentChildrenPage() {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()
  const { parent: me, loading } = useParentMe()

  if (loading) return <StudentLoading variant="dashboard" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-xl font-bold tracking-tight", text)}>Mes enfants</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>Enfants liés à votre compte</p>
      </div>

      {me?.children && me.children.length > 0 ? (
        <div className="space-y-2">
          {me.children.map((child) => {
            const fullName = `${child.lastName} ${child.middleName || ""} ${child.firstName}`
              .replace(/\s+/g, " ")
              .trim()
            return (
              <div
                key={child.id}
                className={cn("flex items-center gap-3 rounded-2xl border p-4", card, border, shadow)}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {child.firstName?.charAt(0)?.toUpperCase() || "E"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-semibold", text)}>{fullName}</p>
                  <p className={cn("text-xs", textMuted)}>
                    {child.code}
                    {child.relationship ? ` · ${child.relationship}` : ""}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={cn("rounded-2xl border p-8 text-center", card, border, shadow)}>
          <Users className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
          <p className={cn("font-medium", text)}>Aucun enfant</p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Les élèves liés apparaîtront ici.
          </p>
        </div>
      )}
    </div>
  )
}
