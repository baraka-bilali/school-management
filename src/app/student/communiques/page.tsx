"use client"

import { useState, useEffect, useCallback } from "react"
import Layout from "@/components/layout"
import { Megaphone, Clock, ChevronRight, Loader2, Check } from "lucide-react"
import Link from "next/link"

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

export default function StudentCommuniquesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)
    const handleThemeChange = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
    }
    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

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

  const grouped = communiques.reduce((acc, c) => {
    const key = getMonthYear(c.createdAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, Communique[]>)

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const bgPage = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPage} flex items-center justify-center`}>
          <div className="text-center">
            <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${textSecondary}`} />
            <p className={textSecondary}>Chargement des communiqués…</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={`min-h-screen ${bgPage}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${textColor}`}>Communiqués</h1>
                <p className={`text-xs ${textSecondary}`}>
                  {unreadCount > 0
                    ? <span className="text-red-400 font-semibold">{unreadCount} non lu{unreadCount !== 1 ? "s" : ""}</span>
                    : "Tous les messages de votre école"}
                </p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${textSecondary}`}>
                  <span className={`font-semibold ${textColor}`}>{communiques.length}</span> communiqué{communiques.length !== 1 ? "s" : ""}
                </span>
                {unreadCount > 0 && (
                  <>
                    <span className={textSecondary}>·</span>
                    <span className="text-sm font-medium text-red-400">{unreadCount} non lu{unreadCount !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {communiques.length === 0 ? (
            <div className={`${bgCard} border ${borderColor} rounded-xl p-12 text-center`}>
              <Megaphone className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`font-medium ${textColor}`}>Aucun communiqué pour le moment</p>
              <p className={`text-sm ${textSecondary} mt-1`}>Les communiqués de votre école apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([monthYear, monthItems]) => (
                <div key={monthYear}>
                  <h3 className={`text-sm font-semibold ${textSecondary} mb-3`}>{monthYear}</h3>
                  <div className={`${bgCard} border ${borderColor} rounded-xl divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"} overflow-hidden`}>
                    {monthItems.map((c) => (
                      <Link
                        key={c.id}
                        href={`/student/communiques/${c.id}`}
                        className={`relative flex items-start gap-4 p-4 transition-colors ${
                          !c.isRead
                            ? theme === "dark" ? "bg-indigo-500/5 hover:bg-indigo-500/10" : "bg-indigo-50/50 hover:bg-indigo-50"
                            : theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Unread indicator */}
                        {!c.isRead && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-indigo-500 rounded-r" />
                        )}

                        <div className={`p-2.5 rounded-full flex-shrink-0 ${
                          !c.isRead
                            ? theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                            : theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                        }`}>
                          <Megaphone className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium text-sm ${textColor} ${!c.isRead ? "font-semibold" : ""}`}>
                              {c.title}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {c.isRead
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                              }
                              <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`flex items-center gap-1 text-xs ${textSecondary}`}>
                              <Clock className="w-3 h-3" />
                              {formatDate(c.createdAt)}
                            </span>
                            {!c.isRead && (
                              <span className="text-xs font-medium text-red-400">• Non lu</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={() => fetchCommuniques(page + 1, true)}
                    disabled={loadingMore}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      theme === "dark"
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    }`}
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                    Charger plus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
