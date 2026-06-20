"use client"

import { cn } from "@/lib/utils"
import type { AnneeScolaire } from "@/lib/school-year-utils"

interface SelecteurAnneeScolaireProps {
  years: AnneeScolaire[]
  value: number | null
  onChange: (yearId: number) => void
  theme?: "light" | "dark"
  className?: string
}

/** Sélecteur d'année scolaire (sept → juin) */
export function SelecteurAnneeScolaire({
  years,
  value,
  onChange,
  theme = "light",
  className,
}: SelecteurAnneeScolaireProps) {
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "px-3 py-2 rounded-xl border text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
        inputBg,
        textColor,
        className
      )}
      aria-label="Année scolaire"
    >
      {years.map((y) => (
        <option key={y.id} value={y.id}>
          {y.label}
          {y.isCurrent ? " (en cours)" : ""}
        </option>
      ))}
    </select>
  )
}
