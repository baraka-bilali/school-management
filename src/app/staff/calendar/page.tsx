"use client"

import { useEffect, useState, useMemo } from "react"
import { CalendarDays, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface CalendarEvent {
  date: string
  label: string
  type: "year" | "communique"
}

interface DashboardData {
  yearName: string | null
  yearStart: string | null
  yearEnd: string | null
  calendarEvents: CalendarEvent[]
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function StaffCalendarPage() {
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
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

  const monthLabel = selectedDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  const eventsForSelectedDay = useMemo(() => {
    if (!dashboard?.calendarEvents) return []
    const key = selectedDate.toDateString()
    return dashboard.calendarEvents.filter((e) => new Date(e.date).toDateString() === key)
  }, [dashboard?.calendarEvents, selectedDate])

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

  if (loading) return <StudentLoading variant="dashboard" />

  return (
    <div className="space-y-5 lg:space-y-8">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Calendrier</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>
          {dashboard?.yearName ? `Année ${dashboard.yearName}` : "Dates et événements de l'école"}
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold capitalize", text)}>{monthLabel}</h2>
        </div>
        <div className={cn("rounded-2xl border p-3", card, border, shadow)}>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isSunday = day.getDay() === 0
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = day.toDateString() === selectedDate.toDateString()
              const hasEvent = dashboard?.calendarEvents.some(
                (e) => new Date(e.date).toDateString() === day.toDateString()
              )
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <span className={cn("text-[10px] font-medium", textMuted)}>{DAY_LABELS[day.getDay()]}</span>
                  <span
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                      isSelected && !isSunday && "bg-indigo-600 text-white shadow-md",
                      isToday && !isSelected && !isSunday && (isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"),
                      !isSelected && !isToday && (isSunday ? "text-gray-400" : text)
                    )}
                  >
                    {day.getDate()}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-indigo-500" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section>
        <h2 className={cn("mb-3 text-base font-bold", text)}>
          {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        {eventsForSelectedDay.length === 0 ? (
          <div className={cn("rounded-2xl border p-8 text-center", card, border, shadow)}>
            <CalendarDays className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
            <p className={cn("text-sm", textMuted)}>Aucun événement ce jour</p>
          </div>
        ) : (
          <div className="space-y-2">
            {eventsForSelectedDay.map((event, i) => (
              <div key={i} className={cn("flex items-start gap-3 rounded-2xl border p-4", card, border, shadow)}>
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  event.type === "communique" ? "bg-purple-50 dark:bg-purple-500/10" : "bg-indigo-50 dark:bg-indigo-500/10"
                )}>
                  {event.type === "communique" ? (
                    <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <CalendarDays className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <p className={cn("font-semibold", text)}>{event.label}</p>
                  <p className={cn("text-xs", textMuted)}>{formatDay(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {(dashboard?.yearStart || dashboard?.yearEnd) && (
        <section>
          <h2 className={cn("mb-3 text-base font-bold", text)}>Année scolaire</h2>
          <div className={cn("space-y-2 rounded-2xl border p-4", card, border, shadow)}>
            {dashboard.yearStart && (
              <div className="flex justify-between gap-4 text-sm">
                <span className={textMuted}>Début</span>
                <span className={cn("font-medium", text)}>{formatDay(dashboard.yearStart)}</span>
              </div>
            )}
            {dashboard.yearEnd && (
              <div className="flex justify-between gap-4 text-sm">
                <span className={textMuted}>Fin</span>
                <span className={cn("font-medium", text)}>{formatDay(dashboard.yearEnd)}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
