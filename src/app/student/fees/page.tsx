"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Wallet, ChevronRight, Sparkles, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"

type YearItem = {
  yearId: number
  name: string
  isCurrent: boolean
  classId: number
  className: string
  section: string | null
  level: string | null
  enrollmentId: number
}

export default function StudentFeesYearsPage() {
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()
  const [years, setYears] = useState<YearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/student/fees/years", { credentials: "include" })
        if (!res.ok) throw new Error("Impossible de charger les années scolaires")
        const data = await res.json()
        if (!cancelled) setYears(data.years || [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <StudentLoading variant="fees" />

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-24 lg:pb-8">
      <header className="space-y-1">
        <h1 className={cn("text-2xl font-bold tracking-tight", text)}>Frais scolaires</h1>
        <p className={cn("text-sm", textMuted)}>
          Sélectionnez une année scolaire pour consulter les frais et paiements.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && years.length === 0 && (
        <div className={cn("rounded-2xl border px-6 py-12 text-center", card, border, shadow)}>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
            <Wallet className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className={cn("font-semibold", text)}>Aucune année scolaire</p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Vos inscriptions apparaîtront ici dès qu&apos;elles seront enregistrées.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {years.map((y) => (
          <Link
            key={y.yearId}
            href={`/student/fees/${y.yearId}`}
            className={cn(
              "group flex items-center gap-4 rounded-2xl border p-4 transition-all",
              card,
              border,
              shadow,
              y.isCurrent
                ? "ring-2 ring-indigo-500/40 border-indigo-300 dark:border-indigo-500/40"
                : "hover:border-indigo-200 dark:hover:border-indigo-500/30"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                y.isCurrent
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : isDark
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-100 text-gray-600"
              )}
            >
              {y.isCurrent ? <Sparkles className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("truncate text-base font-bold", text)}>{y.name}</h2>
                {y.isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    En cours
                  </span>
                )}
              </div>
              <p className={cn("mt-0.5 truncate text-sm", textMuted)}>
                {y.className}
                {y.section ? ` · ${y.section}` : ""}
              </p>
            </div>

            <ChevronRight
              className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5",
                textMuted
              )}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
