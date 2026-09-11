"use client"

import { MenuSelect } from "@/components/ui/menu-select"
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
  return (
    <MenuSelect
      aria-label="Mois scolaire"
      value={value}
      onChange={onChange}
      options={months.map((m) => ({ value: m.value, label: m.label }))}
      placeholder="Tous les mois"
      allowClear
      disabled={disabled || months.length === 0}
      triggerClassName={cn(
        "min-w-[180px] text-sm",
        theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : undefined,
        className
      )}
    />
  )
}
