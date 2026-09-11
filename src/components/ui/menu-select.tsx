"use client"

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
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

type ListCoords = {
  left: number
  width: number
  maxHeight: number
  /** CSS top when opening below; unused when placement is top. */
  top: number
  /** CSS bottom when opening above. */
  bottom: number
  placement: "top" | "bottom"
}

const LIST_GAP = 6
const VIEWPORT_PAD = 8
/** Prefer a tall list so long option sets stay usable (~28rem). */
const PREFERRED_MAX_H = 448
const MIN_LIST_H = 160

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
  const [coords, setCoords] = useState<ListCoords | null>(null)
  const [mounted, setMounted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const showClear = allowClear ?? Boolean(placeholder)

  const selected = options.find((o) => o.value === value) || null

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP - VIEWPORT_PAD
    const spaceAbove = rect.top - LIST_GAP - VIEWPORT_PAD
    const preferred = Math.min(PREFERRED_MAX_H, Math.floor(window.innerHeight * 0.72))

    // Open upward when the bottom side is clearly too short (e.g. last table rows).
    const placeBelow =
      spaceBelow >= Math.min(preferred, MIN_LIST_H) || spaceBelow >= spaceAbove

    const available = placeBelow ? spaceBelow : spaceAbove
    const maxHeight = Math.max(120, Math.min(preferred, available))

    setCoords({
      left: Math.max(VIEWPORT_PAD, Math.min(rect.left, window.innerWidth - rect.width - VIEWPORT_PAD)),
      width: rect.width,
      maxHeight,
      top: rect.bottom + LIST_GAP,
      bottom: window.innerHeight - rect.top + LIST_GAP,
      placement: placeBelow ? "bottom" : "top",
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    updatePosition()
  }, [open, updatePosition, options.length])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onReposition = () => updatePosition()

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onReposition)
    // Capture scroll from nested overflow containers (tables, cards).
    window.addEventListener("scroll", onReposition, true)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open, updatePosition])

  const listbox =
    open && coords && mounted
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className={cn(
              "menu-select-scroll fixed z-[220] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1.5 shadow-xl",
              "dark:border-gray-700 dark:bg-slate-900"
            )}
            style={{
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              ...(coords.placement === "bottom"
                ? { top: coords.top }
                : { bottom: coords.bottom }),
            }}
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
          </ul>,
          document.body
        )
      : null

  return (
    <div className={cn("block text-sm", className)} ref={rootRef}>
      {label ? <span className="text-gray-600 dark:text-gray-400">{label}</span> : null}
      <div className={cn("relative", label ? "mt-1" : undefined)}>
        <button
          ref={triggerRef}
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
        {listbox}
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
