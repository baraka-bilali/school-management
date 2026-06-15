"use client"

import { useState, useEffect, useCallback } from "react"
import { Megaphone, Clock, ChevronRight, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
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
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function getMonthYear(dateStr: string) {
  const d = new Date(dateStr)
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getAuthorName(createdBy: { name: string; nom?: string; prenom?: string }) {
  if (createdBy.nom && createdBy.prenom) return `${createdBy.prenom} ${createdBy.nom}`
  return createdBy.name || "La Direction"
}

export default function StudentCommuniquesPage() {
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchCommuniques = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/student/communiques?page=${pageNum}&limit=15`, { credentials: "include" })
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

  useEffect(() => { fetchCommuniques(1, false) }, [fetchCommuniques])

  const unreadCount = communiques.filter((c) => !c.isRead).length
  const latest = communiques[0]

  const grouped = communiques.reduce((acc, c) => {
    const key = getMonthYear(c.createdAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, Communique[]>)

  if (loading) return <StudentLoading />

  return (
    <div className="space-y-5">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight", text)}>Communiqués</h1>
        <p className={cn("mt-1 text-sm", textMuted)}>
          {unreadCount > 0 ? (
            <span className="font-semibold text-red-500">{unreadCount} non lu{unreadCount !== 1 ? "s" : ""}</span>
          ) : (
            "Tous les messages de votre école"
          )}
        </p>
      </div>

      {communiques.length === 0 ? (
        <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
          <Megaphone className={cn("mx-auto mb-3 h-12 w-12", textMuted)} />
          <p className={cn("font-medium", text)}>Aucun communiqué pour le moment</p>
          <p className={cn("mt-1 text-sm", textMuted)}>Les communiqués de votre école apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {latest && (
            <div className={cn("overflow-hidden rounded-2xl border", card, border, shadow)}>
              <div className={cn("flex items-center justify-between border-b px-4 py-3", border)}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">● Dernier communiqué</span>
                </div>
                <Link href={`/student/communiques/${latest.id}`} className="text-xs font-semibold text-indigo-600">
                  Voir complet &gt;
                </Link>
              </div>
              <div className="p-4">
                <h3 className={cn("mb-2 font-bold", text)}>{latest.title}</h3>
                <div
                  className={cn("prose prose-sm line-clamp-4 max-w-none dark:prose-invert", textMuted)}
                  dangerouslySetInnerHTML={{ __html: latest.content }}
                />
                <div className={cn("mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs", border, textMuted)}>
                  <span>De la part de <strong className={text}>La Direction</strong></span>
                  {latest.isRead ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                      ✓ Lu
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Non lu</span>
                  )}
                  <span>{formatDate(latest.createdAt)}</span>
                </div>
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([monthYear, monthItems]) => (
            <div key={monthYear}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className={cn("shrink-0 text-sm font-semibold", text)}>{monthYear}</h3>
                <div className={cn("h-px flex-1", isDark ? "bg-gray-800" : "bg-gray-200")} />
              </div>
              <div className={cn("overflow-hidden rounded-2xl border divide-y", card, border, "divide-gray-100 dark:divide-gray-800")}>
                {monthItems.map((c) => (
                  <Link
                    key={c.id}
                    href={`/student/communiques/${c.id}`}
                    className={cn(
                      "relative flex items-start gap-3 p-4 transition-colors",
                      !c.isRead ? "bg-indigo-50/50 dark:bg-indigo-500/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    {!c.isRead && <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-indigo-500" />}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        !c.isRead ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
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
                  border, text, "hover:bg-gray-50 dark:hover:bg-gray-800"
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
