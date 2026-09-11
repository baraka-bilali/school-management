"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type MenuSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type MenuSelectProps = {
  /** Visible field label. Omit or pass empty string for compact filter rows. */
  label?: string
  value: string
  options: MenuSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  /** Show a clear/placeholder row at the top (default: true when placeholder is set). */
  allowClear?: boolean
  className?: string
  /** Extra classes on the trigger button (filters, dark theme, etc.). */
  triggerClassName?: string
  disabled?: boolean
  "aria-label"?: string
}

/**
 * Custom listbox with radio-style “pastille” selection.
 * Used across admin filters and forms instead of native &lt;select&gt;.
 */
export function MenuSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Choisir…",
  allowClear,
  className,
  triggerClassName,
  disabled = false,
  "aria-label": ariaLabel,
}: MenuSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const showClear = allowClear ?? Boolean(placeholder)

  const selected = options.find((o) => o.value === value) || null

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div className={cn("block text-sm", className)} ref={rootRef}>
      {label ? <span className="text-gray-600 dark:text-gray-400">{label}</span> : null}
      <div className={cn("relative", label ? "mt-1" : undefined)}>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel || label || placeholder}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
            "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
            disabled && "cursor-not-allowed opacity-60",
            triggerClassName
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[15px] leading-snug",
              selected ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-400"
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gray-500 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-gray-700 dark:bg-slate-900"
          >
            {showClear && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px] text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800"
                  onClick={() => {
                    onChange("")
                    setOpen(false)
                  }}
                >
                  <span className="min-w-0 flex-1">{placeholder}</span>
                  <RadioDot active={!value} />
                </button>
              </li>
            )}
            {options.map((opt) => {
              const active = opt.value === value
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={opt.disabled}
                    className={cn(
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px] transition-colors",
                      opt.disabled && "cursor-not-allowed opacity-50",
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
                        : "text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-slate-800"
                    )}
                    onClick={() => {
                      if (opt.disabled) return
                      onChange(opt.value)
                      setOpen(false)
                    }}
                  >
                    <span className="min-w-0 flex-1 leading-snug">{opt.label}</span>
                    <RadioDot active={active} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "h-5 w-5 shrink-0 rounded-full border-2",
        active
          ? "border-indigo-500 bg-indigo-500 shadow-[inset_0_0_0_3px_white] dark:shadow-[inset_0_0_0_3px_rgb(15,23,42)]"
          : "border-gray-300 dark:border-gray-500"
      )}
      aria-hidden
    />
  )
}
