"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { PeriodShortcut } from "@/lib/school-year-utils"

interface TreasuryPeriodShortcutsProps {
  active: PeriodShortcut
  onChange: (shortcut: PeriodShortcut) => void
  theme?: "light" | "dark"
}

const SHORTCUTS: { id: PeriodShortcut; label: string }[] = [
  { id: "this_month", label: "Ce mois-ci" },
  { id: "this_quarter", label: "Trimestre" },
  { id: "this_school_year", label: "Année" },
  { id: "custom", label: "Personnalisé" },
]

export function TreasuryPeriodShortcuts({
  active,
  onChange,
  theme = "light",
}: TreasuryPeriodShortcutsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SHORTCUTS.map((s) => (
        <Button
          key={s.id}
          type="button"
          variant={active === s.id ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(s.id)}
          className={cn(
            "rounded-xl text-xs font-medium",
            active === s.id
              ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
              : theme === "dark"
                ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          )}
        >
          {s.label}
        </Button>
      ))}
    </div>
  )
}
