"use client"

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
  "aria-label": ariaLabel = "Année scolaire",
}: AcademicYearSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {allowAll && <option value={allValue}>{allLabel}</option>}
      {placeholder && <option value="">{placeholder}</option>}
      {years.map((y) => (
        <option key={y.id} value={y.id}>
          {formatAcademicYearOptionLabel(
            y.name,
            isAcademicYearCurrent(y.id, currentYearId, y)
          )}
        </option>
      ))}
    </select>
  )
}
