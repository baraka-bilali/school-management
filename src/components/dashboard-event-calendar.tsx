"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react"
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

export default function DashboardEventCalendar({
  events,
  theme,
  yearLabel,
}: {
  events: DashboardCalendarEvent[]
  theme: Theme
  yearLabel?: string | null
}) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const mutedBg = theme === "dark" ? "bg-gray-700/40" : "bg-gray-50"

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

  const selectedDayLabel = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  return (
    <div className="flex flex-col">
      {/* En-tête unique */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${textColor}`}>Calendrier scolaire</p>
          <p className={`truncate text-xs ${textSecondary}`}>
            {yearLabel ? `${yearLabel} · ` : ""}
            {events.length} événement{events.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className={`rounded-lg p-1.5 transition-colors ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className={`min-w-[7.5rem] text-center text-xs font-semibold capitalize ${textColor}`}>
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className={`rounded-lg p-1.5 transition-colors ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grille calendrier compacte */}
      <div className={`rounded-xl border ${borderColor} ${mutedBg} p-2`}>
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className={`py-1 text-center text-[10px] font-semibold uppercase ${textSecondary}`}
            >
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
                  "relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  !inCurrentMonth && "opacity-30",
                  isSelected && "bg-indigo-600 text-white shadow-sm",
                  !isSelected && isToday && (theme === "dark" ? "bg-indigo-500/25 text-indigo-300" : "bg-indigo-100 text-indigo-700"),
                  !isSelected && !isToday && inCurrentMonth && textColor,
                  !isSelected && !isToday && !inCurrentMonth && textSecondary,
                  !isSelected && !isToday && inCurrentMonth && (theme === "dark" ? "hover:bg-gray-600/50" : "hover:bg-white")
                )}
              >
                {day.getDate()}
                {hasEvent && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                      isSelected ? "bg-white" : "bg-indigo-500"
                    )}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pied compact — pas de flex-1, hauteur fixe */}
      <div className={`mt-3 min-h-[3.25rem] rounded-xl border ${borderColor} px-3 py-2`}>
        <p className={`mb-1 text-[11px] font-semibold capitalize ${textSecondary}`}>{selectedDayLabel}</p>
        {eventsForSelectedDay.length === 0 ? (
          <p className={`text-xs ${textSecondary}`}>Aucun événement</p>
        ) : (
          <ul className="space-y-1">
            {eventsForSelectedDay.slice(0, 2).map((event, i) => (
              <li key={`${event.date}-${i}`} className="flex items-center gap-2 min-w-0">
                {event.type === "communique" ? (
                  <Megaphone className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                )}
                <span className={`truncate text-xs font-medium ${textColor}`}>{event.label}</span>
              </li>
            ))}
            {eventsForSelectedDay.length > 2 && (
              <li className={`text-[11px] ${textSecondary}`}>
                +{eventsForSelectedDay.length - 2} autre{eventsForSelectedDay.length - 2 > 1 ? "s" : ""}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
