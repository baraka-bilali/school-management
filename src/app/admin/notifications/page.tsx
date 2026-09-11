"use client"

import { useState, useEffect, useCallback } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { getSupabaseBrowser } from "@/lib/supabase-client"
import { notifyNotificationsChanged } from "@/lib/notification-events"
import {
  Bell,
  ArrowLeft,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Clock,
  Calendar,
  Info,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: number
  type: string
  message: string
  schoolId: number | null
  userId: number | null
  isRead: boolean
  daysLeft: number | null
  createdAt: string
}

type CategoryFilter =
  | "all"
  | "subscription"
  | "payment"
  | "reminder"
  | "info"
  | "system"
  | "event"

const LIST_LIMIT = 50

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [serverUnreadCount, setServerUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  )
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: "1",
        limit: String(LIST_LIMIT),
      })
      if (showUnreadOnly) params.set("unreadOnly", "true")

      const res = await authFetch(`/api/notifications?${params}`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setServerUnreadCount(
          typeof data.unreadCount === "number"
            ? data.unreadCount
            : (data.notifications || []).filter((n: Notification) => !n.isRead)
                .length
        )
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [showUnreadOnly])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    const initRealtime = async () => {
      try {
        const res = await authFetch("/api/auth/me", { credentials: "include" })
        if (!res.ok) return
        const { user } = await res.json()
        const channelName =
          user.role === "SUPER_ADMIN"
            ? "notifications:super-admin"
            : `notifications:user:${user.id}`
        const channel = getSupabaseBrowser()
          .channel(channelName)
          .on("broadcast", { event: "new_notification" }, () => {
            fetchNotifications()
            notifyNotificationsChanged()
          })
          .subscribe()
        cleanup = () => getSupabaseBrowser().removeChannel(channel)
      } catch {}
    }
    initRealtime()
    return () => {
      if (cleanup) cleanup()
    }
  }, [fetchNotifications])

  const markAsRead = async (id: number) => {
    const target = notifications.find((n) => n.id === id)
    if (!target || target.isRead) return

    // Optimistic UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setServerUnreadCount((c) => Math.max(0, c - 1))

    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      })
      if (!res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        )
        setServerUnreadCount((c) => c + 1)
        return
      }
      notifyNotificationsChanged()
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      )
      setServerUnreadCount((c) => c + 1)
    }
  }

  const markAllAsRead = async () => {
    const prev = notifications
    const prevCount = serverUnreadCount
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })))
    setServerUnreadCount(0)

    try {
      const res = await authFetch("/api/notifications", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        setNotifications(prev)
        setServerUnreadCount(prevCount)
        return
      }
      notifyNotificationsChanged()
      if (showUnreadOnly) {
        setNotifications([])
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      setNotifications(prev)
      setServerUnreadCount(prevCount)
    }
  }

  const deleteNotification = async (id: number) => {
    const target = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.isRead) {
      setServerUnreadCount((c) => Math.max(0, c - 1))
    }

    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        await fetchNotifications()
        return
      }
      notifyNotificationsChanged()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      await fetchNotifications()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const time = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    return `${time} · ${dateStr}`
  }

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes("EXPIRED") || type.includes("SUBSCRIPTION"))
      return <AlertCircle className="w-4 h-4" />
    if (type.includes("PAYMENT")) return <CreditCard className="w-4 h-4" />
    if (type.includes("DAY")) return <Clock className="w-4 h-4" />
    if (type.includes("EVENT")) return <Calendar className="w-4 h-4" />
    if (type.includes("SYSTEM")) return <Info className="w-4 h-4" />
    return <Bell className="w-4 h-4" />
  }

  const getNotificationCategory = (type: string): CategoryFilter => {
    if (type.includes("EXPIRED") || type.includes("SUBSCRIPTION"))
      return "subscription"
    if (type.includes("PAYMENT")) return "payment"
    if (type.includes("DAY")) return "reminder"
    if (type.includes("EVENT")) return "event"
    if (type.includes("SYSTEM")) return "system"
    return "info"
  }

  const getNotificationTitle = (type: string) => {
    if (type.includes("EXPIRED")) return "Abonnement expiré"
    if (type.includes("1_DAY")) return "Expiration dans 1 jour"
    if (type.includes("2_DAYS")) return "Expiration dans 2 jours"
    if (type.includes("5_DAYS")) return "Expiration dans 5 jours"
    if (type.includes("PAYMENT")) return "Nouveau paiement"
    if (type.includes("EVENT")) return "Événement"
    return "Notification"
  }

  const filteredNotifications = notifications.filter((n) => {
    if (
      categoryFilter !== "all" &&
      getNotificationCategory(n.type) !== categoryFilter
    )
      return false
    return true
  })

  const groupedByMonth = filteredNotifications.reduce(
    (acc, notification) => {
      const monthYear = getMonthYear(notification.createdAt)
      if (!acc[monthYear]) acc[monthYear] = []
      acc[monthYear].push(notification)
      return acc
    },
    {} as Record<string, Notification[]>
  )

  const categories = [
    { key: "all" as CategoryFilter, label: "Tout" },
    { key: "subscription" as CategoryFilter, label: "Abonnement" },
    { key: "payment" as CategoryFilter, label: "Paiements" },
    { key: "reminder" as CategoryFilter, label: "Rappels" },
    { key: "system" as CategoryFilter, label: "Système" },
  ]

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgPrimary = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  if (loading) {
    return (
      <div className={`min-h-screen ${bgPrimary}`}>
          <div
            className="flex items-center justify-center"
            style={{ height: "calc(100vh - 140px)" }}
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={textSecondary}>Chargement des notifications...</p>
            </div>
          </div>
        </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgPrimary}`}>
        <div className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex items-center h-14 gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } ${textColor}`}
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className={`text-lg font-semibold ${textColor}`}>
                  Notifications
                </h1>
                <p className={`text-xs ${textSecondary}`}>
                  {serverUnreadCount === 0
                    ? "Tout est à jour"
                    : `${serverUnreadCount} non lu${serverUnreadCount > 1 ? "s" : ""}`}
                </p>
              </div>
              {serverUnreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-500 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Tout lire
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategoryFilter(cat.key)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                    categoryFilter === cat.key
                      ? "bg-teal-600 text-white border-teal-600"
                      : theme === "dark"
                        ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowUnreadOnly((v) => !v)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ml-auto",
                  showUnreadOnly
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : theme === "dark"
                      ? "bg-transparent text-gray-400 border-gray-600"
                      : "bg-white text-gray-600 border-gray-300"
                )}
              >
                Non lus
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          {Object.keys(groupedByMonth).length === 0 ? (
            <div
              className={`${bgCard} rounded-xl border ${borderColor} p-10 text-center`}
            >
              <Bell
                className={`w-12 h-12 mx-auto mb-3 ${
                  theme === "dark" ? "text-gray-600" : "text-gray-300"
                }`}
              />
              <p className={`text-base font-medium ${textColor}`}>
                Aucune notification
              </p>
              <p className={`mt-1 text-sm ${textSecondary}`}>
                {showUnreadOnly
                  ? "Vous êtes à jour — rien de non lu."
                  : "Pas encore de notifications."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedByMonth).map(
                ([monthYear, monthNotifications]) => (
                  <div key={monthYear}>
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${textSecondary}`}
                    >
                      {monthYear}
                    </h3>
                    <div
                      className={`rounded-xl border ${borderColor} overflow-hidden divide-y ${
                        theme === "dark" ? "divide-gray-700/80" : "divide-gray-100"
                      }`}
                    >
                      {monthNotifications.map((notification) => {
                        const unread = !notification.isRead
                        return (
                          <div
                            key={notification.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => markAsRead(notification.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                markAsRead(notification.id)
                              }
                            }}
                            className={cn(
                              "group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors text-left w-full",
                              unread
                                ? theme === "dark"
                                  ? "bg-teal-500/10 hover:bg-teal-500/15"
                                  : "bg-teal-50 hover:bg-teal-100/70"
                                : theme === "dark"
                                  ? "bg-gray-800/80 hover:bg-gray-800"
                                  : "bg-white hover:bg-gray-50"
                            )}
                          >
                            {/* Indicateur non lu / lu */}
                            <div className="pt-2 w-2 flex-shrink-0">
                              {unread ? (
                                <span
                                  className="block w-2 h-2 rounded-full bg-teal-500"
                                  aria-label="Non lu"
                                />
                              ) : (
                                <span
                                  className={`block w-2 h-2 rounded-full ${
                                    theme === "dark"
                                      ? "bg-gray-600"
                                      : "bg-gray-300"
                                  }`}
                                  aria-label="Lu"
                                />
                              )}
                            </div>

                            <div
                              className={cn(
                                "p-2 rounded-full flex-shrink-0",
                                unread
                                  ? theme === "dark"
                                    ? "bg-teal-500/20 text-teal-300"
                                    : "bg-teal-100 text-teal-700"
                                  : theme === "dark"
                                    ? "bg-gray-700 text-gray-500"
                                    : "bg-gray-100 text-gray-400"
                              )}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className={cn(
                                    "text-sm leading-snug",
                                    unread
                                      ? `font-semibold ${textColor}`
                                      : `font-medium ${
                                          theme === "dark"
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                        }`
                                  )}
                                >
                                  {getNotificationTitle(notification.type)}
                                </h4>
                                <span
                                  className={cn(
                                    "text-[11px] whitespace-nowrap flex-shrink-0",
                                    unread
                                      ? theme === "dark"
                                        ? "text-teal-300/80"
                                        : "text-teal-700/80"
                                      : textSecondary
                                  )}
                                >
                                  {formatDate(notification.createdAt)}
                                </span>
                              </div>
                              <p
                                className={cn(
                                  "text-sm mt-0.5 line-clamp-2",
                                  unread
                                    ? theme === "dark"
                                      ? "text-gray-200"
                                      : "text-gray-700"
                                    : textSecondary
                                )}
                              >
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                {unread && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRead(notification.id)
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-500"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Marquer comme lu
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
  )
}
