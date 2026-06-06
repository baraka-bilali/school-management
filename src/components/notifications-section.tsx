"use client"

import { useState, useEffect } from "react"
import {
  Bell, Check, AlertCircle, Clock, Settings, Trash2,
  CreditCard, Calendar, MoreVertical, Info, Zap
} from "lucide-react"
import { authFetch } from "@/lib/auth-fetch"

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

interface NotificationsSectionProps {
  theme: "light" | "dark"
}

export default function NotificationsSection({ theme }: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const bgSection = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700/40" : "hover:bg-gray-50"

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/notifications", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Erreur récupération notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      }
    } catch {}
  }

  const deleteNotification = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const res = await authFetch("/api/notifications", { method: "POST", credentials: "include" })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch {}
  }

  const getCategory = (type: string): CategoryFilter => {
    if (type.includes("SUBSCRIPTION") || type.includes("EXPIRED")) return "subscription"
    if (type.includes("PAYMENT")) return "payment"
    if (type.includes("DAY") || type.includes("REMINDER")) return "reminder"
    if (type.includes("EVENT")) return "event"
    if (type.includes("SYSTEM")) return "system"
    return "subscription"
  }

  const getIcon = (type: string) => {
    if (type.includes("EXPIRED")) return <AlertCircle className="w-4 h-4" />
    if (type.includes("PAYMENT")) return <CreditCard className="w-4 h-4" />
    if (type.includes("DAY") || type.includes("REMINDER")) return <Clock className="w-4 h-4" />
    if (type.includes("EVENT")) return <Calendar className="w-4 h-4" />
    if (type.includes("SYSTEM")) return <Settings className="w-4 h-4" />
    return <Bell className="w-4 h-4" />
  }

  const getIconStyle = (type: string) => {
    if (type.includes("EXPIRED")) return "bg-red-500/20 text-red-400"
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return "bg-orange-500/20 text-orange-400"
    if (type.includes("5_DAYS") || type.includes("10_DAYS")) return "bg-yellow-500/20 text-yellow-400"
    if (type.includes("PAYMENT")) return "bg-green-500/20 text-green-400"
    if (type.includes("EVENT")) return "bg-purple-500/20 text-purple-400"
    return "bg-indigo-500/20 text-indigo-400"
  }

  const getTitle = (type: string) => {
    if (type === "SUBSCRIPTION_EXPIRED") return "Abonnement expiré"
    if (type === "SUBSCRIPTION_EXPIRING_1_DAY") return "Expiration imminente — 1 jour"
    if (type === "SUBSCRIPTION_EXPIRING_2_DAYS") return "Expiration proche — 2 jours"
    if (type === "SUBSCRIPTION_EXPIRING_5_DAYS") return "Alerte abonnement — 5 jours"
    if (type === "SUBSCRIPTION_EXPIRING_10_DAYS") return "Rappel abonnement — 10 jours"
    if (type === "SUBSCRIPTION_EXPIRING_15_DAYS") return "Rappel abonnement — 15 jours"
    if (type.includes("PAYMENT")) return "Paiement reçu"
    if (type.includes("EVENT")) return "Événement"
    if (type.includes("SYSTEM")) return "Mise à jour système"
    return "Notification"
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    const day = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    return `${time} • ${day}`
  }

  const getMonthLabel = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    return month.charAt(0).toUpperCase() + month.slice(1)
  }

  const filtered = notifications.filter((n) => {
    if (categoryFilter !== "all" && getCategory(n.type) !== categoryFilter) return false
    if (showUnreadOnly && n.isRead) return false
    return true
  })

  const groupedByMonth = filtered.reduce((acc, n) => {
    const label = getMonthLabel(n.createdAt)
    if (!acc[label]) acc[label] = []
    acc[label].push(n)
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

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      {/* ── Header ── */}
      <div className={`px-6 pt-6 pb-4 ${bgCard}`}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className={`text-xl font-bold ${textColor}`}>Historique des notifications</h2>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>
              Vous avez{" "}
              <span className="font-semibold text-indigo-400">{unreadCount} message{unreadCount !== 1 ? "s" : ""} non lu{unreadCount !== 1 ? "s" : ""}</span>
            </p>
          </div>
        </div>

        {/* Catégories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${
                categoryFilter === cat.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : theme === "dark"
                  ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Toggle + Mark all as read */}
        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  showUnreadOnly ? "bg-indigo-600" : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showUnreadOnly ? "translate-x-5" : ""
                }`}
              />
            </div>
            <span className={`text-sm ${textColor}`}>Non lus uniquement</span>
          </label>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={`${bgSection} min-h-[200px]`}>
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className={`text-sm ${textSecondary}`}>Chargement des notifications…</p>
          </div>
        ) : Object.keys(groupedByMonth).length === 0 ? (
          <div className="py-16 text-center">
            <Bell className={`w-14 h-14 mx-auto mb-4 opacity-20 ${textSecondary}`} />
            <p className={`font-medium ${textColor}`}>Aucune notification</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>
              {showUnreadOnly ? "Toutes les notifications ont été lues." : "Vous n'avez pas encore de notifications."}
            </p>
          </div>
        ) : (
          <div className="px-2 py-4 space-y-5">
            {Object.entries(groupedByMonth).map(([month, items]) => (
              <div key={month}>
                {/* Séparateur mois */}
                <div className="px-4 mb-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>{month}</p>
                </div>

                {/* Items */}
                <div className={`${bgCard} rounded-xl border ${borderColor} divide-y ${theme === "dark" ? "divide-gray-700/60" : "divide-gray-100"}`}>
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`relative flex items-start gap-4 px-5 py-4 transition-colors ${hoverBg} ${
                        !n.isRead ? (theme === "dark" ? "bg-indigo-500/5" : "bg-indigo-50/50") : ""
                      }`}
                    >
                      {/* Indicateur non lu */}
                      {!n.isRead && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-red-500 rounded-r-full" />
                      )}

                      {/* Icône */}
                      <div className={`p-2.5 rounded-full flex-shrink-0 mt-0.5 ${getIconStyle(n.type)}`}>
                        {getIcon(n.type)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${textColor}`}>{getTitle(n.type)}</p>
                        <p className={`text-sm mt-0.5 line-clamp-2 ${textSecondary}`}>{n.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-xs ${textSecondary}`}>{formatTime(n.createdAt)}</span>
                          {n.daysLeft !== null && (
                            <span
                              className={`text-xs font-semibold ${
                                n.daysLeft === 0 ? "text-red-400" :
                                n.daysLeft <= 2 ? "text-orange-400" :
                                n.daysLeft <= 5 ? "text-yellow-400" : "text-blue-400"
                              }`}
                            >
                              {n.daysLeft === 0 ? "Expiré" : `${n.daysLeft}j restants`}
                            </span>
                          )}
                          {!n.isRead && (
                            <span className="text-xs font-medium text-red-400">• Non lu</span>
                          )}
                        </div>
                      </div>

                      {/* Menu "..." */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)}
                          className={`p-1.5 rounded-lg transition-colors ${textSecondary} hover:bg-gray-200/60 dark:hover:bg-gray-600/60`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === n.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className={`absolute right-0 mt-1 w-48 ${bgCard} rounded-lg shadow-lg border ${borderColor} py-1 z-20`}>
                              {!n.isRead && (
                                <button
                                  onClick={() => { markAsRead(n.id); setOpenMenuId(null) }}
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${hoverBg} ${textColor}`}
                                >
                                  <Check className="w-4 h-4" /> Marquer comme lu
                                </button>
                              )}
                              <button
                                onClick={() => { deleteNotification(n.id); setOpenMenuId(null) }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${hoverBg} text-red-500`}
                              >
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
