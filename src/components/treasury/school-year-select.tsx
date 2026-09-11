"use client"

import { MenuSelect } from "@/components/ui/menu-select"
import { cn } from "@/lib/utils"
import type { AnneeScolaire } from "@/lib/school-year-utils"
import { formatAcademicYearOptionLabel, isAcademicYearCurrent } from "@/lib/school-year-utils"

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
  return (
    <MenuSelect
      aria-label="Année scolaire"
      value={value == null ? "" : String(value)}
      onChange={(v) => {
        if (!v) return
        onChange(Number(v))
      }}
      options={years.map((y) => ({
        value: String(y.id),
        label: formatAcademicYearOptionLabel(y.label, isAcademicYearCurrent(y.id, undefined, y)),
      }))}
      placeholder="Choisir une année…"
      allowClear={false}
      triggerClassName={cn(
        "min-w-[180px] text-sm",
        theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : undefined,
        className
      )}
    />
  )
}
