"use client"

import Link from "next/link"
import { Users, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "@/components/parent/parent-context"
import StudentLoading from "@/components/student/student-loading"
import { getGreeting } from "@/lib/student-auth"

export default function ParentHomePage() {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()
  const { parent: me, loading } = useParentMe()

  if (loading) return <StudentLoading variant="dashboard" />

  return (
    <div className="space-y-5">
      {me && (
        <div>
          <p className={cn("text-xl font-bold tracking-tight", text)}>
            {getGreeting()}, {me.firstName}
          </p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            {me.school || "Espace parents"}
          </p>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Mes enfants</h2>
          <Link href="/parent/children" className={cn("text-xs font-medium text-indigo-600", textMuted)}>
            Voir tout
          </Link>
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
          <div className={cn("rounded-2xl border p-6 text-center", card, border, shadow)}>
            <Users className={cn("mx-auto mb-2 h-8 w-8", textMuted)} />
            <p className={cn("text-sm", textMuted)}>Aucun enfant lié pour le moment.</p>
          </div>
        )}
      </section>

      <Link
        href="/parent/messages"
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40",
          card,
          border,
          shadow
        )}
      >
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold", text)}>Communiqués</p>
          <p className={cn("text-xs", textMuted)}>Messages de l&apos;école</p>
        </div>
        <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
      </Link>
    </div>
  )
}
