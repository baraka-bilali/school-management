"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardCalendarEvent {
  date: string
  label: string
  type: "year" | "communique"
}

type Theme = "light" | "dark"

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function formatDayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function DashboardEventCalendar({
  events,
  theme,
}: {
  events: DashboardCalendarEvent[]
  theme: Theme
}) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = (firstOfMonth.getDay() + 6) % 7
    const gridStart = new Date(year, month, 1 - startOffset)

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(gridStart)
      day.setDate(gridStart.getDate() + i)
      return day
    })
  }, [viewDate])

  const eventsForSelectedDay = useMemo(() => {
    const key = selectedDate.toDateString()
    return events.filter((e) => new Date(e.date).toDateString() === key)
  }, [events, selectedDate])

  const goToPreviousMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold capitalize ${textColor}`}>{monthLabel}</p>
          <p className={`text-xs ${textSecondary}`}>
            {events.length} événement{events.length > 1 ? "s" : ""} cette année
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className={`rounded-lg p-1.5 transition-colors ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className={`rounded-lg p-1.5 transition-colors ${theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className={`py-1 text-[10px] font-semibold uppercase tracking-wide ${textSecondary}`}>
            {label}
          </div>
        ))}
        {calendarDays.map((day) => {
          const inCurrentMonth = day.getMonth() === viewDate.getMonth()
          const isToday = sameDay(day, new Date())
          const isSelected = sameDay(day, selectedDate)
          const hasEvent = events.some((e) => sameDay(new Date(e.date), day))

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={cn(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                !inCurrentMonth && "opacity-35",
                isSelected && "bg-indigo-600 text-white shadow-md",
                !isSelected && isToday && (theme === "dark" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"),
                !isSelected && !isToday && inCurrentMonth && textColor,
                !isSelected && !isToday && !inCurrentMonth && textSecondary
              )}
            >
              {day.getDate()}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          )
        })}
      </div>

      <div className={`mt-4 flex-1 rounded-xl border ${borderColor} p-3`}>
        <p className={`mb-2 text-xs font-semibold capitalize ${textSecondary}`}>
          {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {eventsForSelectedDay.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-6 text-center ${textSecondary}`}>
            <CalendarDays className="mb-2 h-8 w-8 opacity-60" />
            <p className="text-xs">Aucun événement ce jour</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-28 overflow-y-auto">
            {eventsForSelectedDay.map((event, i) => (
              <div key={`${event.date}-${i}`} className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    event.type === "communique"
                      ? theme === "dark" ? "bg-purple-500/15" : "bg-purple-50"
                      : theme === "dark" ? "bg-indigo-500/15" : "bg-indigo-50"
                  )}
                >
                  {event.type === "communique" ? (
                    <Megaphone className="h-4 w-4 text-purple-500" />
                  ) : (
                    <CalendarDays className="h-4 w-4 text-indigo-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium ${textColor}`}>{event.label}</p>
                  <p className={`text-[11px] ${textSecondary}`}>{formatDayLabel(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
