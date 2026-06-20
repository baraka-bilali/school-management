"use client"

import { cn } from "@/lib/utils"
import type { MoisScolaire } from "@/lib/school-year-utils"

interface SelecteurMoisProps {
  months: MoisScolaire[]
  value: string
  onChange: (monthValue: string) => void
  theme?: "light" | "dark"
  className?: string
  disabled?: boolean
}

/** Mois de l'année scolaire active uniquement (sept → juin, max 10 entrées) */
export function SelecteurMois({
  months,
  value,
  onChange,
  theme = "light",
  className,
  disabled,
}: SelecteurMoisProps) {
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || months.length === 0}
      className={cn(
        "px-3 py-2 rounded-xl border text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50",
        inputBg,
        textColor,
        className
      )}
      aria-label="Mois scolaire"
    >
      <option value="">Tous les mois</option>
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  )
}
