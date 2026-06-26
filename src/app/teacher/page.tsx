"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  Megaphone,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"
import { getGreeting } from "@/lib/student-auth"

interface DashboardData {
  yearName: string | null
  classCount: number
  courseCount: number
  slots: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    className: string
    subjectName: string
    room: string | null
  }>
  tasks: Array<{
    id: number
    title: string
    dueAt: string
    createdAt: string
    class: { name: string }
    subject: { name: string; color: string | null } | null
  }>
  latestCommunique: { id: number; title: string; createdAt: string } | null
}

interface TeacherInfo {
  firstName: string
  year?: string
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

function formatDue(dueAt: string) {
  const d = new Date(dueAt)
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return "À l'instant"
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const weekDays = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() + 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [])

  const monthLabel = selectedDate.toLocaleDateString("fr-FR", { month: "long" })

  const daySlots = useMemo(() => {
    if (!dashboard?.slots) return []
    const jsDay = selectedDate.getDay()
    const dow = jsDay === 0 ? 7 : jsDay
    return dashboard.slots.filter((s) => s.dayOfWeek === dow)
  }, [dashboard?.slots, selectedDate])

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, dashRes] = await Promise.all([
          fetch("/api/teacher/me", { credentials: "include" }),
          fetch("/api/teacher/dashboard", { credentials: "include" }),
        ])
        if (meRes.ok) {
          const { teacher } = await meRes.json()
          setTeacherInfo({ firstName: teacher.firstName, year: teacher.year })
        }
        if (dashRes.ok) {
          setDashboard(await dashRes.json())
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <StudentLoading variant="dashboard" />

  const activeTasks = dashboard?.tasks.filter((t) => new Date(t.dueAt) >= new Date()) ?? []
  const overdueTasks = dashboard?.tasks.filter((t) => new Date(t.dueAt) < new Date()) ?? []

  return (
    <div className="space-y-5 lg:space-y-8">
      {teacherInfo && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={cn("text-xl font-bold tracking-tight lg:text-3xl", text)}>
              {getGreeting()}, {teacherInfo.firstName}
            </p>
            <p className={cn("mt-1 hidden text-sm lg:block", textMuted)}>
              Votre espace enseignant
            </p>
          </div>
          {(teacherInfo.year || dashboard?.yearName) && (
            <div className={cn("shrink-0 rounded-2xl border px-4 py-2.5 lg:px-5 lg:py-3 lg:text-right", card, border, shadow)}>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>Année scolaire</p>
              <p className={cn("mt-0.5 text-sm font-bold lg:text-lg", text)}>
                Session {teacherInfo.year || dashboard?.yearName}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Classes + Cours */}
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        <div className={cn("flex min-w-[9.5rem] shrink-0 flex-col items-center rounded-2xl border p-4 lg:min-w-0 lg:p-6", card, border, shadow)}>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 lg:mb-4 lg:h-16 lg:w-16">
            <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400 lg:h-8 lg:w-8" />
          </div>
          <p className="text-[10px] font-bold tracking-wide text-indigo-600 dark:text-indigo-400 lg:text-xs">MES CLASSES</p>
          <p className={cn("mt-1 text-2xl font-bold lg:text-4xl", text)}>{dashboard?.classCount ?? 0}</p>
          <p className={cn("mt-0.5 text-center text-[10px] lg:text-sm", textMuted)}>Classes affiliées</p>
        </div>

        <div className={cn("min-w-[9.5rem] shrink-0 rounded-2xl border p-4 text-center lg:min-w-0 lg:p-6", card, border, shadow)}>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 lg:mb-4 lg:h-16 lg:w-16">
            <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400 lg:h-8 lg:w-8" />
          </div>
          <p className="text-[10px] font-bold tracking-wide text-indigo-600 dark:text-indigo-400 lg:text-xs">MES COURS</p>
          <p className={cn("mt-1 text-2xl font-bold lg:text-4xl", text)}>{dashboard?.courseCount ?? 0}</p>
          <p className={cn("mt-0.5 text-[10px] lg:text-sm", textMuted)}>Matières assignées</p>
        </div>
      </div>

      {/* Calendrier */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Calendrier hebdomadaire</h2>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium capitalize",
              isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700 shadow-sm"
            )}
          >
            {monthLabel}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className={cn("rounded-2xl border p-3", card, border, shadow)}>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSunday = day.getDay() === 0
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === selectedDate.toDateString()
              const isHighlighted = !isSunday && (isToday || isSelected)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <span className={cn("text-[10px] font-medium", isSunday ? "text-red-500" : textMuted)}>
                    {DAY_LABELS[day.getDay()]}
                  </span>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isSunday
                        ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                        : isHighlighted
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : cn(text, "hover:bg-gray-100 dark:hover:bg-gray-800")
                    )}
                  >
                    {day.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
          {daySlots.length > 0 && (
            <div className={cn("mt-3 space-y-2 border-t pt-3", isDark ? "border-gray-800" : "border-gray-100")}>
              {daySlots.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className={cn("font-semibold truncate", text)}>{s.subjectName}</p>
                    <p className={cn("text-xs truncate", textMuted)}>{s.className}{s.room ? ` · ${s.room}` : ""}</p>
                  </div>
                  <span className={cn("shrink-0 text-xs font-medium tabular-nums", textMuted)}>
                    {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tâches */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Tâches assignées</h2>
          <Link href="/teacher/tasks" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Voir tout
          </Link>
        </div>
        {activeTasks.length === 0 && overdueTasks.length === 0 ? (
          <div className={cn("rounded-2xl border p-8 text-center", card, border, shadow)}>
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-indigo-500/50" />
            <p className={cn("text-sm font-medium", text)}>Aucune tâche pour le moment</p>
            <p className={cn("mt-1 text-xs", textMuted)}>Créez des devoirs depuis l&apos;onglet Tâches</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overdueTasks.slice(0, 2).map((t) => (
              <div key={t.id} className={cn("rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/30 dark:bg-red-500/5", shadow)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">EN RETARD</span>
                    <p className={cn("mt-1 font-semibold truncate", text)}>{t.title}</p>
                    <p className={cn("text-xs", textMuted)}>{t.class.name} · {formatDue(t.dueAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            {activeTasks.slice(0, 3).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push("/teacher/tasks")}
                className={cn("w-full rounded-2xl border p-4 text-left transition-transform active:scale-[0.99]", card, border, shadow)}
              >
                <p className={cn("font-semibold truncate", text)}>{t.title}</p>
                <p className={cn("mt-0.5 text-xs", textMuted)}>
                  {t.class.name}
                  {t.subject?.name ? ` · ${t.subject.name}` : ""} · Échéance {formatDue(t.dueAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Communiqué */}
      {dashboard?.latestCommunique && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={cn("text-base font-bold", text)}>Communiqués récents</h2>
            <Link href="/teacher/messages" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Voir tout
            </Link>
          </div>
          <Link
            href={`/teacher/communiques/${dashboard.latestCommunique.id}`}
            className={cn("flex items-center gap-3 rounded-2xl border p-4 transition-colors", card, border, shadow)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-semibold", text)}>{dashboard.latestCommunique.title}</p>
              <p className={cn("text-xs", textMuted)}>{timeAgo(dashboard.latestCommunique.createdAt)}</p>
            </div>
            <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
          </Link>
        </section>
      )}
    </div>
  )
}
