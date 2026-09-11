"use client"

import { MenuSelect } from "@/components/ui/menu-select"
import { cn } from "@/lib/utils"
import {
  formatAcademicYearOptionLabel,
  isAcademicYearCurrent,
} from "@/lib/school-year-utils"

export type AcademicYearOption = {
  id: number
  name: string
  isCurrent?: boolean
  current?: boolean
}

interface AcademicYearSelectProps {
  years: AcademicYearOption[]
  value: string | number
  onChange: (value: string) => void
  currentYearId?: number | null
  className?: string
  allowAll?: boolean
  allValue?: string
  allLabel?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  "aria-label"?: string
}

export function AcademicYearSelect({
  years,
  value,
  onChange,
  currentYearId,
  className,
  allowAll,
  allValue = "all",
  allLabel = "Toutes les années",
  placeholder,
  disabled,
  label,
  "aria-label": ariaLabel = "Année scolaire",
}: AcademicYearSelectProps) {
  const options = [
    ...(allowAll ? [{ value: allValue, label: allLabel }] : []),
    ...years.map((y) => ({
      value: String(y.id),
      label: formatAcademicYearOptionLabel(
        y.name,
        isAcademicYearCurrent(y.id, currentYearId, y)
      ),
    })),
  ]

  const stringValue = value === "" || value == null ? "" : String(value)

  return (
    <MenuSelect
      label={label}
      aria-label={ariaLabel}
      value={stringValue}
      onChange={onChange}
      options={options}
      placeholder={placeholder || (allowAll ? allLabel : "Choisir une année…")}
      allowClear={Boolean(placeholder) && !allowAll}
      disabled={disabled}
      triggerClassName={cn(className)}
    />
  )
}
