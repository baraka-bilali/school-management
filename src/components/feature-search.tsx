"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ChevronRight, HelpCircle, Search, X } from "lucide-react"
import {
  FEATURE_SEARCH_CATEGORIES,
  filterFeatureSearchItems,
  getFeatureSearchItemsForRole,
  type FeatureSearchCategory,
  type FeatureSearchItem,
} from "@/lib/feature-search-catalog"

type Theme = "light" | "dark"

interface FeatureSearchProps {
  role?: string | null
  canEnrollStudents?: boolean
  theme?: Theme
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function FeatureSearch({
  role,
  canEnrollStudents = false,
  theme = "dark",
  open,
  onOpenChange,
}: FeatureSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FeatureSearchCategory>("all")
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const catalog = useMemo(
    () => getFeatureSearchItemsForRole(role, { canEnrollStudents }),
    [role, canEnrollStudents]
  )

  const availableCategories = useMemo(() => {
    const present = new Set(catalog.map((i) => i.category))
    return FEATURE_SEARCH_CATEGORIES.filter(
      (c) => c.id === "all" || present.has(c.id as Exclude<FeatureSearchCategory, "all">)
    )
  }, [catalog])

  const results = useMemo(
    () => filterFeatureSearchItems(catalog, query, category),
    [catalog, query, category]
  )

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const goTo = useCallback(
    (item: FeatureSearchItem) => {
      onOpenChange(false)
      router.push(item.href)
    },
    [onOpenChange, router]
  )

  useEffect(() => {
    if (!open) return
    setQuery("")
    setCategory("all")
    setActiveIndex(0)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      document.body.style.overflow = prevOverflow
      window.clearTimeout(id)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, category])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        close()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault()
        goTo(results[activeIndex])
      }
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [open, results, activeIndex, close, goTo])

  if (!mounted || !open) return null

  const isDark = theme === "dark"
  const panel = isDark ? "bg-[#16181d] border-gray-700" : "bg-white border-gray-200"
  const text = isDark ? "text-gray-100" : "text-gray-900"
  const muted = isDark ? "text-gray-400" : "text-gray-500"
  const rowHover = isDark ? "hover:bg-gray-800/80" : "hover:bg-gray-50"
  const rowActive = isDark ? "bg-gray-800" : "bg-indigo-50"
  const chipIdle = isDark
    ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
  const chipActive = isDark
    ? "bg-white text-gray-900 border-white"
    : "bg-gray-900 text-white border-gray-900"
  const inputBg = isDark
    ? "bg-gray-900/80 border-indigo-500/60"
    : "bg-gray-50 border-indigo-300"
  const listTitle = query.trim() ? "Résultats" : "Les plus utilisés"
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  const shortcutLabel = isMac ? "⌘ K" : "Ctrl K"

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-3 pt-[10vh] sm:pt-[12vh]"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={close}
        aria-hidden
      />

      <div
        ref={panelRef}
        className={`relative w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl ${panel}`}
        role="dialog"
        aria-modal="true"
        aria-label="Rechercher une fonctionnalité"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${inputBg}`}>
            <Search className={`h-4 w-4 shrink-0 ${muted}`} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une fonctionnalité…"
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${text} ${
                isDark ? "placeholder:text-gray-500" : "placeholder:text-gray-400"
              }`}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className={`rounded-md p-1 ${muted} hover:text-indigo-400`}
                aria-label="Effacer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <span
                className={`hidden sm:inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                  isDark ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-500"
                }`}
              >
                {shortcutLabel}
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {availableCategories.map((c) => {
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? chipActive : chipIdle
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={`border-t px-2 py-2 ${isDark ? "border-gray-800" : "border-gray-100"}`}>
          <p className={`px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide ${muted}`}>
            {listTitle}
          </p>
          <div className="max-h-[42vh] overflow-y-auto">
            {results.length === 0 ? (
              <div className={`px-3 py-10 text-center text-sm ${muted}`}>
                {catalog.length === 0
                  ? "Aucune fonctionnalité disponible pour votre rôle."
                  : query.trim()
                    ? `Aucune fonctionnalité trouvée pour « ${query} »`
                    : "Aucun résultat"}
              </div>
            ) : (
              <ul className="space-y-0.5">
                {results.map((item, index) => {
                  const Icon = item.icon
                  const active = index === activeIndex
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goTo(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          active ? rowActive : rowHover
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isDark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-semibold ${text}`}>
                            {item.title}
                            {item.comingSoon && (
                              <span className="ml-2 inline-flex rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                                Bientôt
                              </span>
                            )}
                          </span>
                          <span className={`block truncate text-xs ${muted}`}>{item.subtitle}</span>
                        </span>
                        <ChevronRight className={`h-4 w-4 shrink-0 ${muted}`} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-3 border-t px-4 py-3 ${
            isDark ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-gray-50"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              close()
              router.push(role === "ELEVE" ? "/student/settings" : "/admin/settings")
            }}
            className={`inline-flex items-center gap-1.5 text-xs ${muted} hover:text-indigo-400`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Besoin d&apos;aide ?
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              router.push(role === "ELEVE" ? "/student/communiques" : "/admin/subscription")
            }}
            className="rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            {role === "ELEVE" ? "Voir les communiqués" : "Gérer l'abonnement"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Global Ctrl/Cmd+K listener — call from Header. */
export function useFeatureSearchHotkey(onOpen: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k") return
      if (!(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      e.stopPropagation()
      onOpen()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [onOpen, enabled])
}
