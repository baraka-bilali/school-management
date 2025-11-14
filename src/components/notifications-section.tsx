"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, AlertCircle, Clock, Filter, Search, Trash2 } from "lucide-react"

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

interface NotificationsSectionProps {
  theme: "light" | "dark"
}

export default function NotificationsSection({ theme }: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Styles selon le thème
  const cardBg = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-[#21262d]" : "hover:bg-gray-50"
  const inputBg = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"

  // Récupérer toutes les notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Marquer une notification comme lue
  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  // Supprimer une notification
  const deleteNotification = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !n.isRead) ||
      (filter === "read" && n.isRead)
    
    const matchesSearch = n.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  // Obtenir la couleur selon le type
  const getNotificationColor = (type: string) => {
    if (type.includes("EXPIRED")) return "text-red-400"
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return "text-orange-400"
    if (type.includes("5_DAYS")) return "text-yellow-400"
    return "text-blue-400"
  }

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type: string) => {
    if (type.includes("EXPIRED")) return <AlertCircle className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className={`${cardBg} rounded-xl border ${borderColor} shadow-sm`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {unreadCount} non lues
              </span>
            )}
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Rechercher une notification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-white text-indigo-600"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "unread"
                  ? "bg-white text-indigo-600"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "read"
                  ? "bg-white text-indigo-600"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Lues ({notifications.length - unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
            <p className={textSecondary}>Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className={`w-16 h-16 ${textSecondary} mx-auto mb-4 opacity-30`} />
            <p className={`text-lg font-medium ${textColor} mb-2`}>Aucune notification</p>
            <p className={textSecondary}>
              {searchQuery
                ? "Aucun résultat pour votre recherche"
                : filter === "unread"
                ? "Vous n'avez pas de notification non lue"
                : filter === "read"
                ? "Vous n'avez pas de notification lue"
                : "Vous n'avez pas encore de notification"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  !notification.isRead
                    ? `${borderColor} bg-indigo-500/5 border-l-4 border-l-indigo-500`
                    : `${borderColor} ${hoverBg}`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={getNotificationColor(notification.type)}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${textColor} whitespace-pre-wrap mb-2`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs ${textSecondary}`}>
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.daysLeft !== null && (
                        <span
                          className={`text-xs font-semibold ${
                            notification.daysLeft === 0
                              ? "text-red-400"
                              : notification.daysLeft <= 2
                              ? "text-orange-400"
                              : notification.daysLeft <= 5
                              ? "text-yellow-400"
                              : "text-blue-400"
                          }`}
                        >
                          {notification.daysLeft === 0
                            ? "Expiré"
                            : `${notification.daysLeft}j restants`}
                        </span>
                      )}
                      {!notification.isRead && (
                        <span className="text-xs font-semibold text-indigo-400">
                          • Non lu
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`p-2 rounded hover:bg-gray-700/50 ${textSecondary} hover:text-white transition-colors`}
                        title="Marquer comme lu"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("Supprimer cette notification ?")) {
                          deleteNotification(notification.id)
                        }
                      }}
                      className={`p-2 rounded hover:bg-red-500/10 ${textSecondary} hover:text-red-400 transition-colors`}
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
