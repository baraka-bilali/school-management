"use client"

import Link from "next/link"
import { Users, ChevronRight, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "@/components/parent/parent-context"
import StudentLoading from "@/components/student/student-loading"
import { getGreeting } from "@/lib/student-auth"

export default function ParentHomePage() {
  const { card, text, textMuted, shadow, border, linkAccent } = useTeacherTheme()
  const { parent: me, loading } = useParentMe()

  if (loading) return <StudentLoading variant="dashboard" />

  const children = me?.children || []

  return (
    <div className="space-y-5 lg:space-y-8">
      {me && (
        <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={cn("text-xl font-bold tracking-tight lg:text-3xl", text)}>
              {getGreeting()}, {me.firstName}
            </p>
            <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>
              {me.school || "Espace parents"}
            </p>
            <p className={cn("mt-1 hidden text-sm lg:block", textMuted)}>
              Suivez la scolarité et les messages de l&apos;école
            </p>
          </div>
          {me.year && (
            <div
              className={cn(
                "mt-3 hidden rounded-2xl border px-4 py-3 lg:mt-0 lg:block",
                card,
                border,
                shadow
              )}
            >
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>
                Année scolaire
              </p>
              <p className={cn("mt-0.5 text-sm font-semibold", text)}>{me.year}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={cn("text-base font-bold lg:text-lg", text)}>Mes enfants</h2>
            <Link href="/parent/children" className={cn("text-xs font-medium", linkAccent)}>
              Voir tout
            </Link>
          </div>

          {children.length > 0 ? (
            <div className="space-y-2">
              {children.map((child) => {
                const fullName = `${child.lastName} ${child.middleName || ""} ${child.firstName}`
                  .replace(/\s+/g, " ")
                  .trim()
                return (
                  <Link
                    key={child.id}
                    href={`/parent/children/${child.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40 lg:p-5",
                      card,
                      border,
                      shadow
                    )}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 lg:h-12 lg:w-12 lg:text-base">
                      {child.firstName?.charAt(0)?.toUpperCase() || "E"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate font-semibold", text)}>{fullName}</p>
                      <p className={cn("text-xs", textMuted)}>
                        {child.code}
                        {child.relationship ? ` · ${child.relationship}` : ""}
                      </p>
                    </div>
                    <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className={cn("rounded-2xl border p-6 text-center lg:p-8", card, border, shadow)}>
              <Users className={cn("mx-auto mb-2 h-8 w-8", textMuted)} />
              <p className={cn("text-sm", textMuted)}>Aucun enfant lié pour le moment.</p>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className={cn("text-base font-bold lg:text-lg", text)}>Accès rapide</h2>
          <Link
            href="/parent/messages"
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40 lg:p-5",
              card,
              border,
              shadow
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold", text)}>Communiqués</p>
              <p className={cn("text-xs", textMuted)}>Messages de l&apos;école</p>
            </div>
            <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
          </Link>
          <Link
            href="/parent/children"
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40 lg:p-5",
              card,
              border,
              shadow
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-semibold", text)}>Suivi scolaire</p>
              <p className={cn("text-xs", textMuted)}>Paiements et devoirs des enfants</p>
            </div>
            <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
          </Link>
        </section>
      </div>
    </div>
  )
}
