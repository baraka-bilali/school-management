"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import { Bell, BellOff, Check, Trash2, AlertCircle, Clock, CheckCircle, Filter } from "lucide-react"

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

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

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await authFetch("/api/notifications", {
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

  const markAsRead = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await authFetch("/api/notifications", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
    }
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
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes("EXPIRED")) return <AlertCircle className="w-5 h-5 text-red-500" />
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return <Clock className="w-5 h-5 text-orange-500" />
    if (type.includes("5_DAYS")) return <Clock className="w-5 h-5 text-yellow-500" />
    return <Bell className="w-5 h-5 text-blue-500" />
  }

  const getNotificationBadge = (type: string) => {
    if (type.includes("EXPIRED")) return { text: "Expiré", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
    if (type.includes("1_DAY")) return { text: "1 jour", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" }
    if (type.includes("2_DAYS")) return { text: "2 jours", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" }
    if (type.includes("5_DAYS")) return { text: "5 jours", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
    return { text: "Info", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead
    if (filter === "read") return n.isRead
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 140px)' }}>
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={textSecondary}>Chargement des notifications...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${textColor}`}>Notifications</h1>
            <p className={textSecondary}>
              {unreadCount > 0 
                ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : "Toutes vos notifications sont lues"
              }
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <Filter className={`w-4 h-4 ${textSecondary}`} />
          <div className={`inline-flex rounded-lg p-1 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === "unread"
                  ? "bg-indigo-600 text-white"
                  : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === "read"
                  ? "bg-indigo-600 text-white"
                  : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Lues ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Liste des notifications */}
        <Card theme={theme}>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <BellOff className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
                <p className={`text-lg font-medium ${textColor}`}>Aucune notification</p>
                <p className={`mt-1 ${textSecondary}`}>
                  {filter === "unread" 
                    ? "Vous êtes à jour ! Aucune notification non lue."
                    : filter === "read"
                    ? "Aucune notification lue pour le moment."
                    : "Vous n'avez pas encore de notifications."
                  }
                </p>
              </div>
            ) : (
              <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                {filteredNotifications.map((notification) => {
                  const badge = getNotificationBadge(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors ${
                        !notification.isRead 
                          ? theme === "dark" ? "bg-indigo-900/10" : "bg-indigo-50/50"
                          : ""
                      } ${theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icône */}
                        <div className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                              {badge.text}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            )}
                          </div>
                          <p className={`text-sm ${textColor}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-2 ${textSecondary}`}>
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark" 
                                  ? "hover:bg-gray-700 text-gray-400 hover:text-green-400" 
                                  : "hover:bg-gray-100 text-gray-500 hover:text-green-600"
                              }`}
                              title="Marquer comme lu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === "dark" 
                                ? "hover:bg-gray-700 text-gray-400 hover:text-red-400" 
                                : "hover:bg-gray-100 text-gray-500 hover:text-red-600"
                            }`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
