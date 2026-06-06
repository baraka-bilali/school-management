"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/layout"
import { authFetch } from "@/lib/auth-fetch"
import {
  Bell,
  ArrowLeft,
  Settings,
  MoreVertical,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  Calendar,
  Megaphone,
  CreditCard,
  Send,
  Loader2,
} from "lucide-react"

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

type CategoryFilter = "all" | "subscription" | "payment" | "reminder" | "system" | "event"
type BroadcastTarget = "ALL" | "SUPER_ADMIN_ONLY" | "SCHOOL_USER_ONLY"

const LIMIT = 15

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [showBroadcastForm, setShowBroadcastForm] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget>("ALL")
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastStatus, setBroadcastStatus] = useState<"idle" | "success" | "error">("idle")

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

  useEffect(() => {
    fetchNotifications(1, false)
  }, [])

  const fetchNotifications = async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await authFetch(`/api/notifications?page=${pageNum}&limit=${LIMIT}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications])
        } else {
          setNotifications(data.notifications)
        }
        setPage(pageNum)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error("Erreur notifications:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => fetchNotifications(page + 1, true)

  const markAsRead = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, { method: "PATCH", credentials: "include" })
      if (res.ok) setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const res = await authFetch("/api/notifications", { method: "POST", credentials: "include" })
      if (res.ok) setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {}
  }

  const deleteNotification = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setConfirmDeleteId(null)
      }
    } catch {}
  }

  const sendBroadcast = async () => {
    if (broadcastMessage.trim().length < 5) return
    setBroadcastLoading(true)
    setBroadcastStatus("idle")
    try {
      const res = await authFetch("/api/notifications/broadcast", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMessage.trim(), target: broadcastTarget }),
      })
      if (res.ok) {
        setBroadcastStatus("success")
        setBroadcastMessage("")
        setTimeout(() => setBroadcastStatus("idle"), 3000)
        fetchNotifications(1, false)
      } else {
        setBroadcastStatus("error")
      }
    } catch {
      setBroadcastStatus("error")
    } finally {
      setBroadcastLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    return `${time} • ${dateStr}`
  }

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString)
    const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const getNotificationIcon = (type: string) => {
    if (type === "SYSTEM_MESSAGE") return <Megaphone className="w-5 h-5" />
    if (type.includes("EXPIRED") || type.includes("SUBSCRIPTION")) return <AlertCircle className="w-5 h-5" />
    if (type.includes("PAYMENT")) return <CreditCard className="w-5 h-5" />
    if (type.includes("DAY")) return <Clock className="w-5 h-5" />
    if (type.includes("EVENT")) return <Calendar className="w-5 h-5" />
    if (type.includes("SYSTEM")) return <Settings className="w-5 h-5" />
    return <Bell className="w-5 h-5" />
  }

  const getNotificationCategory = (type: string): CategoryFilter => {
    if (type === "SYSTEM_MESSAGE" || type.includes("SYSTEM")) return "system"
    if (type.includes("EXPIRED") || type.includes("SUBSCRIPTION")) return "subscription"
    if (type.includes("PAYMENT")) return "payment"
    if (type.includes("DAY")) return "reminder"
    if (type.includes("EVENT")) return "event"
    return "subscription"
  }

  const getNotificationColor = (type: string) => {
    if (type === "SYSTEM_MESSAGE") return theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
    if (type.includes("EXPIRED")) return theme === "dark" ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return theme === "dark" ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"
    if (type.includes("5_DAYS") || type.includes("PAYMENT")) return theme === "dark" ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-600"
    if (type.includes("EVENT")) return theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
    return theme === "dark" ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
  }

  const getNotificationTitle = (type: string) => {
    if (type === "SYSTEM_MESSAGE") return "Message système"
    if (type === "SUBSCRIPTION_EXPIRED") return "Abonnement expiré"
    if (type === "SUBSCRIPTION_EXPIRING_1_DAY") return "Expiration imminente — 1 jour"
    if (type === "SUBSCRIPTION_EXPIRING_2_DAYS") return "Expiration proche — 2 jours"
    if (type === "SUBSCRIPTION_EXPIRING_5_DAYS") return "Alerte abonnement — 5 jours"
    if (type === "SUBSCRIPTION_EXPIRING_10_DAYS") return "Rappel abonnement — 10 jours"
    if (type === "SUBSCRIPTION_EXPIRING_15_DAYS") return "Rappel abonnement — 15 jours"
    if (type.includes("PAYMENT")) return "Nouveau paiement"
    if (type.includes("EVENT")) return "Événement"
    return "Notification"
  }

  const filteredNotifications = notifications.filter((n) => {
    if (categoryFilter !== "all" && getNotificationCategory(n.type) !== categoryFilter) return false
    if (showUnreadOnly && n.isRead) return false
    return true
  })

  const groupedByMonth = filteredNotifications.reduce((acc, n) => {
    const key = getMonthYear(n.createdAt)
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {} as Record<string, Notification[]>)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const categories = [
    { key: "all" as CategoryFilter, label: "Tout" },
    { key: "subscription" as CategoryFilter, label: "Alertes abonnement" },
    { key: "payment" as CategoryFilter, label: "Paiements" },
    { key: "reminder" as CategoryFilter, label: "Rappels" },
    { key: "system" as CategoryFilter, label: "Mises à jour système" },
    { key: "event" as CategoryFilter, label: "Événements" },
  ]

  const targetLabels: Record<BroadcastTarget, string> = {
    ALL: "Tous les utilisateurs",
    SUPER_ADMIN_ONLY: "Super Admin uniquement",
    SCHOOL_USER_ONLY: "Admins d'école uniquement",
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgPrimary = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-50"

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPrimary} flex items-center justify-center`} style={{ height: "calc(100vh - 140px)" }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={textSecondary}>Chargement des notifications…</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary}`}>
        {/* ── Header fixe ── */}
        <div className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className={`p-2 rounded-lg transition-colors ${textColor} hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className={`text-xl font-bold ${textColor}`}>Notifications</h1>
              </div>
              <button
                onClick={() => { setShowBroadcastForm(!showBroadcastForm); setBroadcastStatus("idle") }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showBroadcastForm
                    ? "bg-purple-600 text-white"
                    : theme === "dark"
                    ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                    : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                }`}
              >
                <Megaphone className="w-4 h-4" />
                Diffuser
              </button>
            </div>

            {/* ── Formulaire broadcast ── */}
            {showBroadcastForm && (
              <div className={`mb-4 p-4 rounded-xl border ${theme === "dark" ? "border-purple-700/40 bg-purple-900/10" : "border-purple-200 bg-purple-50"}`}>
                <p className={`text-sm font-semibold mb-3 flex items-center gap-1.5 ${theme === "dark" ? "text-purple-300" : "text-purple-700"}`}>
                  <Megaphone className="w-4 h-4" />
                  Diffuser un message système
                </p>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Ex : Maintenance programmée ce soir de 22h à 23h. Merci pour votre compréhension."
                  className={`w-full text-sm px-3 py-2 rounded-lg border resize-none outline-none transition-colors ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-purple-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                  }`}
                />
                <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as BroadcastTarget)}
                      className={`text-xs px-2 py-1.5 rounded-lg border outline-none ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-gray-300"
                          : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      {(Object.keys(targetLabels) as BroadcastTarget[]).map((t) => (
                        <option key={t} value={t}>{targetLabels[t]}</option>
                      ))}
                    </select>
                    <span className={`text-xs ${textSecondary}`}>{broadcastMessage.length}/500</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {broadcastStatus === "success" && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Message envoyé !
                      </span>
                    )}
                    {broadcastStatus === "error" && (
                      <span className="text-xs text-red-400">Erreur lors de l'envoi</span>
                    )}
                    <button
                      onClick={sendBroadcast}
                      disabled={broadcastLoading || broadcastMessage.trim().length < 5}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {broadcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sous-header ── */}
            <div className="pb-4">
              <div className="mb-4">
                <h2 className={`text-lg font-semibold ${textColor}`}>Historique des notifications</h2>
                <p className={`text-sm ${textSecondary}`}>
                  Vous avez{" "}
                  <span className="font-semibold text-indigo-500">{unreadCount} message{unreadCount !== 1 ? "s" : ""} non lu{unreadCount !== 1 ? "s" : ""}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${
                      categoryFilter === cat.key
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : theme === "dark"
                        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showUnreadOnly}
                      onChange={(e) => setShowUnreadOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${showUnreadOnly ? "bg-indigo-600" : theme === "dark" ? "bg-gray-600" : "bg-gray-300"}`} />
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showUnreadOnly ? "translate-x-5" : ""}`} />
                  </div>
                  <span className={`text-sm font-medium ${textColor}`}>Non lus uniquement</span>
                </label>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {Object.keys(groupedByMonth).length === 0 ? (
            <div className={`${bgCard} rounded-xl border ${borderColor} p-12 text-center`}>
              <Bell className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`text-lg font-medium ${textColor}`}>Aucune notification</p>
              <p className={`mt-1 ${textSecondary}`}>
                {showUnreadOnly ? "Vous êtes à jour ! Aucune notification non lue." : "Vous n'avez pas encore de notifications."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByMonth).map(([monthYear, monthNotifs]) => (
                <div key={monthYear}>
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold ${textSecondary}`}>{monthYear}</h3>
                  </div>
                  <div className={`${bgCard} rounded-xl border ${borderColor} divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                    {monthNotifs.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative transition-colors ${
                          confirmDeleteId !== notification.id && !notification.isRead
                            ? theme === "dark" ? "bg-indigo-500/5" : "bg-indigo-50/50"
                            : ""
                        }`}
                      >
                        {!notification.isRead && confirmDeleteId !== notification.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-red-500 rounded-r" />
                        )}

                        {confirmDeleteId === notification.id ? (
                          <div className="flex items-center justify-between gap-2 p-4">
                            <span className={`text-sm ${textSecondary}`}>Supprimer cette notification ?</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                  theme === "dark" ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-sm px-3 py-1.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-4 ${hoverBg}`}>
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-full flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className={`text-sm font-semibold ${textColor} mb-1`}>
                                      {getNotificationTitle(notification.type)}
                                    </h4>
                                    <p className={`text-sm ${textSecondary} line-clamp-2`}>
                                      {notification.message}
                                    </p>
                                  </div>
                                  <div className="relative flex-shrink-0">
                                    <button
                                      onClick={() => setOpenMenuId(openMenuId === notification.id ? null : notification.id)}
                                      className={`p-1.5 rounded-lg transition-colors ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-600`}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {openMenuId === notification.id && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                        <div className={`absolute right-0 mt-1 w-48 ${bgCard} rounded-lg shadow-lg border ${borderColor} py-1 z-20`}>
                                          {!notification.isRead && (
                                            <button
                                              onClick={() => { markAsRead(notification.id); setOpenMenuId(null) }}
                                              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${hoverBg} ${textColor}`}
                                            >
                                              <Check className="w-4 h-4" /> Marquer comme lu
                                            </button>
                                          )}
                                          <button
                                            onClick={() => { setConfirmDeleteId(notification.id); setOpenMenuId(null) }}
                                            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${hoverBg} text-red-500`}
                                          >
                                            <Trash2 className="w-4 h-4" /> Supprimer
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                  <p className={`text-xs ${textSecondary}`}>{formatDate(notification.createdAt)}</p>
                                  {notification.daysLeft !== null && (
                                    <span className={`text-xs font-semibold ${
                                      notification.daysLeft === 0 ? "text-red-400" :
                                      notification.daysLeft <= 2 ? "text-orange-400" :
                                      notification.daysLeft <= 5 ? "text-yellow-400" : "text-blue-400"
                                    }`}>
                                      {notification.daysLeft === 0 ? "Expiré" : `${notification.daysLeft}j restants`}
                                    </span>
                                  )}
                                  {!notification.isRead && (
                                    <span className="text-xs font-medium text-red-400">• Non lu</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      theme === "dark"
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    }`}
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                      </span>
                    ) : "Charger plus de notifications"}
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
