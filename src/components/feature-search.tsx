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
  const listRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [present, setPresent] = useState(false)
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FeatureSearchCategory>("all")
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setPresent(true)
      setQuery("")
      setCategory("all")
      setActiveIndex(0)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true))
      })
      const focusId = window.setTimeout(() => inputRef.current?.focus(), 120)
      return () => {
        window.cancelAnimationFrame(raf)
        window.clearTimeout(focusId)
        document.body.style.overflow = prevOverflow
      }
    }

    setVisible(false)
    const t = window.setTimeout(() => setPresent(false), 220)
    return () => window.clearTimeout(t)
  }, [open])

  const catalog = useMemo(
    () => getFeatureSearchItemsForRole(role, { canEnrollStudents }),
    [role, canEnrollStudents]
  )

  const availableCategories = useMemo(() => {
    const presentCats = new Set(catalog.map((i) => i.category))
    return FEATURE_SEARCH_CATEGORIES.filter(
      (c) => c.id === "all" || presentCats.has(c.id as Exclude<FeatureSearchCategory, "all">)
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
    setActiveIndex(0)
    listRef.current?.scrollTo({ top: 0 })
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

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open])

  if (!mounted || !present) return null

  const isDark = theme === "dark"
  const panel = isDark ? "bg-[#16181d] border-gray-700" : "bg-white border-gray-200"
  const text = isDark ? "text-gray-100" : "text-gray-900"
  const muted = isDark ? "text-gray-400" : "text-gray-500"
  const rowHover = isDark ? "hover:bg-gray-800/80" : "hover:bg-gray-50"
  const rowActive = isDark ? "bg-indigo-500/15 ring-1 ring-indigo-500/30" : "bg-indigo-50 ring-1 ring-indigo-200"
  const chipIdle = isDark
    ? "bg-gray-800/90 text-gray-300 border-gray-700 hover:bg-gray-700"
    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
  const chipActive = isDark
    ? "bg-white text-gray-900 border-white shadow-sm"
    : "bg-gray-900 text-white border-gray-900 shadow-sm"
  const inputBg = isDark
    ? "bg-gray-900/80 border-indigo-500/50 focus-within:border-indigo-400"
    : "bg-gray-50 border-indigo-300 focus-within:border-indigo-500"
  const listTitle = query.trim()
    ? `${results.length} résultat${results.length > 1 ? "s" : ""}`
    : category === "all"
      ? "Les plus utilisés"
      : availableCategories.find((c) => c.id === category)?.label || "Résultats"
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  const shortcutLabel = isMac ? "⌘ K" : "Ctrl K"

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex justify-center transition-colors duration-200 ${
        visible ? "bg-black/60" : "bg-black/0"
      } items-end sm:items-start px-0 sm:px-4 md:px-6 pt-0 sm:pt-[6vh] md:pt-[8vh] pb-0 sm:pb-6`}
      role="presentation"
    >
      <button
        type="button"
        className={`absolute inset-0 transition-opacity duration-200 ${
          visible ? "opacity-100 backdrop-blur-[3px]" : "opacity-0"
        }`}
        aria-label="Fermer la recherche"
        onClick={close}
      />

      <div
        className={`relative flex w-full flex-col overflow-hidden border shadow-2xl transition-all ease-out
          h-[92dvh] max-h-[92dvh] rounded-t-2xl
          sm:h-auto sm:max-h-[min(820px,86vh)] sm:rounded-2xl
          sm:max-w-3xl md:max-w-4xl lg:max-w-5xl
          ${panel}
          ${visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-6 sm:translate-y-3 opacity-0 scale-[0.98]"}
        `}
        style={{ transitionDuration: "220ms" }}
        role="dialog"
        aria-modal="true"
        aria-label="Rechercher une fonctionnalité"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <span className={`h-1 w-10 rounded-full ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
        </div>

        <div className="shrink-0 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <div>
              <p className={`text-sm font-semibold sm:text-base ${text}`}>Recherche</p>
              <p className={`text-xs ${muted}`}>Accédez rapidement à toutes les fonctionnalités</p>
            </div>
            <button
              type="button"
              onClick={close}
              className={`rounded-lg p-2 transition-colors ${muted} ${
                isDark ? "hover:bg-gray-800 hover:text-white" : "hover:bg-gray-100 hover:text-gray-900"
              }`}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 sm:py-3.5 ${inputBg}`}>
            <Search className={`h-5 w-5 shrink-0 ${muted}`} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une fonctionnalité…"
              className={`min-w-0 flex-1 bg-transparent text-[15px] sm:text-base outline-none ${text} ${
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

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
            {availableCategories.map((c) => {
              const active = category === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-[13px] ${
                    active ? chipActive : chipIdle
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={`flex min-h-0 flex-1 flex-col border-t ${isDark ? "border-gray-800" : "border-gray-100"}`}>
          <p className={`shrink-0 px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide sm:px-5 ${muted}`}>
            {listTitle}
          </p>
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 sm:px-3">
            {results.length === 0 ? (
              <div className={`px-3 py-14 text-center text-sm ${muted}`}>
                {catalog.length === 0
                  ? "Aucune fonctionnalité disponible pour votre rôle."
                  : query.trim()
                    ? `Aucune fonctionnalité trouvée pour « ${query} »`
                    : "Aucun résultat"}
              </div>
            ) : (
              <ul className="space-y-1">
                {results.map((item, index) => {
                  const Icon = item.icon
                  const active = index === activeIndex
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        data-search-index={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goTo(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors sm:gap-3.5 sm:px-3.5 sm:py-3.5 ${
                          active ? rowActive : rowHover
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                            isDark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-semibold sm:text-[15px] ${text}`}>
                            {item.title}
                            {item.comingSoon && (
                              <span className="ml-2 inline-flex rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                                Bientôt
                              </span>
                            )}
                          </span>
                          <span className={`mt-0.5 block truncate text-xs sm:text-[13px] ${muted}`}>
                            {item.subtitle}
                          </span>
                        </span>
                        <ChevronRight className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${muted}`} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className={`flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-3.5 ${
            isDark ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-gray-50"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              close()
              router.push(role === "ELEVE" ? "/student/settings" : "/admin/settings")
            }}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm ${muted} hover:text-indigo-400`}
          >
            <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Besoin d&apos;aide ?
          </button>
          <button
            type="button"
            onClick={() => {
              close()
              router.push(role === "ELEVE" ? "/student/communiques" : "/admin/subscription")
            }}
            className="rounded-full bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 sm:px-4 sm:text-sm"
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
