"use client"

import { useState, useEffect, useCallback } from "react"
import { Megaphone, Clock, ChevronRight, Loader2, Check, CheckCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface Communique {
  id: number
  title: string
  content: string
  createdAt: string
  isRead: boolean
  createdBy: { name: string; nom?: string; prenom?: string }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getMonthYear(dateStr: string) {
  const d = new Date(dateStr)
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function ParentMessagesPage() {
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchCommuniques = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/parent/communiques?page=${pageNum}&limit=15`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        if (append) setCommuniques((prev) => [...prev, ...data.communiques])
        else setCommuniques(data.communiques)
        setPage(pageNum)
        setHasMore(data.hasMore)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void fetchCommuniques(1, false)
  }, [fetchCommuniques])

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch("/api/parent/communiques/read-all", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setCommuniques((prev) => prev.map((c) => ({ ...c, isRead: true })))
        window.dispatchEvent(new Event("parentCommuniqueRead"))
      }
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = communiques.filter((c) => !c.isRead).length

  const grouped = communiques.reduce(
    (acc, c) => {
      const key = getMonthYear(c.createdAt)
      if (!acc[key]) acc[key] = []
      acc[key].push(c)
      return acc
    },
    {} as Record<string, Communique[]>
  )

  if (loading) return <StudentLoading variant="communiques" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("text-xl font-bold tracking-tight", text)}>Communiqués</h1>
          <p className={cn("mt-1 text-sm", textMuted)}>
            {unreadCount > 0 ? (
              <span className="font-semibold text-red-500">
                {unreadCount} non lu{unreadCount !== 1 ? "s" : ""}
              </span>
            ) : (
              "Messages destinés aux parents"
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Tout marquer comme lu
          </button>
        )}
      </div>

      {communiques.length === 0 ? (
        <div className={cn("rounded-2xl border p-8 text-center", card, border, shadow)}>
          <Megaphone className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
          <p className={cn("font-medium", text)}>Aucun communiqué</p>
          <p className={cn("mt-1 text-sm", textMuted)}>
            Les messages de l&apos;école destinés aux parents apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([monthYear, monthItems]) => (
            <div key={monthYear}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className={cn("shrink-0 text-sm font-semibold", text)}>{monthYear}</h3>
                <div className={cn("h-px flex-1", isDark ? "bg-gray-800" : "bg-gray-200")} />
              </div>
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border divide-y",
                  card,
                  border,
                  "divide-gray-100 dark:divide-gray-800"
                )}
              >
                {monthItems.map((c) => (
                  <Link
                    key={c.id}
                    href={`/parent/messages/${c.id}`}
                    className={cn(
                      "relative flex items-start gap-3 p-4 transition-colors",
                      !c.isRead
                        ? "bg-indigo-50/50 dark:bg-indigo-500/5"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    {!c.isRead && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-indigo-500" />
                    )}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        !c.isRead
                          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                      )}
                    >
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn("text-sm", text, !c.isRead && "font-semibold")}>{c.title}</h4>
                        <div className="flex shrink-0 items-center gap-1">
                          {c.isRead && <Check className="h-3.5 w-3.5 text-green-500" />}
                          <ChevronRight className={cn("h-4 w-4", textMuted)} />
                        </div>
                      </div>
                      <span className={cn("mt-1 flex items-center gap-1 text-xs", textMuted)}>
                        <Clock className="h-3 w-3" />
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => fetchCommuniques(page + 1, true)}
                disabled={loadingMore}
                className={cn(
                  "rounded-xl border px-6 py-2.5 text-sm font-medium disabled:opacity-50",
                  border,
                  text
                )}
              >
                {loadingMore && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
                Charger plus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
