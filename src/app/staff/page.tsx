"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Wallet, Megaphone, Calendar, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useStaffMe } from "@/components/staff/staff-context"
import StudentLoading from "@/components/student/student-loading"
import { getGreeting } from "@/lib/student-auth"

interface DashboardData {
  yearName: string | null
  yearStart: string | null
  yearEnd: string | null
  latestCommunique: { id: number; title: string; createdAt: string } | null
}

export default function StaffDashboardPage() {
  const { card, text, textMuted, shadow, border } = useTeacherTheme()
  const { staff: me } = useStaffMe()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/staff/dashboard", { credentials: "include" })
        if (res.ok) setDashboard(await res.json())
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const yearLabel = me?.year || dashboard?.yearName

  if (loading) return <StudentLoading variant="dashboard" />

  return (
    <div className="space-y-5 lg:space-y-8">
      {me && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={cn("text-xl font-bold tracking-tight lg:text-3xl", text)}>
              {getGreeting()}, {me.firstName}
            </p>
            <p className={cn("mt-1 text-sm lg:block", textMuted)}>
              {me.roleLabel} · Espace personnel
            </p>
          </div>
          {yearLabel && (
            <div className={cn("shrink-0 rounded-2xl border px-4 py-2.5 lg:text-right", card, border, shadow)}>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>Année scolaire</p>
              <p className={cn("mt-0.5 text-sm font-bold lg:text-lg", text)}>Session {yearLabel}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/staff/calendar"
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40",
            card,
            border,
            shadow
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", text)}>Calendrier</p>
            <p className={cn("text-xs", textMuted)}>Dates importantes</p>
          </div>
          <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
        </Link>

        <Link
          href="/staff/wallet"
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40",
            card,
            border,
            shadow
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-500/10">
            <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", text)}>Portefeuille</p>
            <p className={cn("text-xs", textMuted)}>Paiements salaires</p>
          </div>
          <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
        </Link>

        <Link
          href="/staff/messages"
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-indigo-500/40 sm:col-span-3 lg:col-span-1",
            card,
            border,
            shadow
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/10">
            <Megaphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", text)}>Communiqués</p>
            <p className={cn("text-xs", textMuted)}>Messages de l&apos;école</p>
          </div>
          <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
        </Link>
      </div>

      {dashboard?.latestCommunique && (
        <section>
          <h2 className={cn("mb-3 text-base font-bold", text)}>Dernier communiqué</h2>
          <Link
            href={`/staff/communiques/${dashboard.latestCommunique.id}`}
            className={cn("block rounded-2xl border p-4 transition-colors hover:border-indigo-500/40", card, border, shadow)}
          >
            <p className={cn("font-semibold", text)}>{dashboard.latestCommunique.title}</p>
            <p className={cn("mt-1 text-xs", textMuted)}>
              {new Date(dashboard.latestCommunique.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </Link>
        </section>
      )}
    </div>
  )
}
