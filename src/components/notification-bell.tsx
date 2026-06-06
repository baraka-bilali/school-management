"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, AlertCircle, Clock, BellOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/auth-fetch"
import { supabaseBrowser } from "@/lib/supabase-client"

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

interface NotificationBellProps {
  onNotificationClick?: () => void
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps = {}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const isOpenRef = useRef(isOpen)

  // Garder isOpenRef synchronisé pour l'utiliser dans le callback Realtime
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

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

  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch("/api/notifications/count", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error("Erreur comptage notifications:", error)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/notifications", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications.slice(0, 5))
      }
    } catch (error) {
      console.error("Erreur récupération notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) await markAsRead(notification.id)
    setIsOpen(false)
    if (onNotificationClick) onNotificationClick()
  }

  const markAsRead = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Erreur mise à jour notification:", error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        const notification = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Erreur suppression notification:", error)
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
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Erreur mise à jour toutes notifications:", error)
    }
  }

  // Initialiser le compteur + abonnement Supabase Realtime au montage
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const initRealtime = async () => {
      // Charger le compteur initial
      fetchUnreadCount()

      // Récupérer l'utilisateur courant pour choisir le bon canal
      try {
        const res = await authFetch("/api/auth/me", { credentials: "include" })
        if (!res.ok) return
        const { user } = await res.json()

        const channelName =
          user.role === "SUPER_ADMIN"
            ? "notifications:super-admin"
            : `notifications:user:${user.id}`

        const channel = supabaseBrowser
          .channel(channelName)
          .on("broadcast", { event: "new_notification" }, () => {
            // Mettre à jour le badge en temps réel
            fetchUnreadCount()
            // Si le panneau est ouvert, recharger la liste
            if (isOpenRef.current) fetchNotifications()
          })
          .subscribe()

        cleanup = () => {
          supabaseBrowser.removeChannel(channel)
        }
      } catch (error) {
        console.error("Erreur initialisation Realtime:", error)
      }
    }

    initRealtime()

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // Charger les notifications quand on ouvre le panneau
  useEffect(() => {
    if (isOpen) fetchNotifications()
  }, [isOpen])

  const getNotificationColor = (type: string) => {
    if (type.includes("EXPIRED")) return "text-red-400"
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return "text-orange-400"
    if (type.includes("5_DAYS")) return "text-yellow-400"
    return "text-blue-400"
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes("EXPIRED")) return <AlertCircle className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString("fr-FR")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-100"
        }`}
      >
        <Bell
          className={`w-6 h-6 ${
            unreadCount > 0
              ? "text-indigo-500 animate-pulse"
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div
            className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden border ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-4 py-3 flex items-center justify-between ${
                theme === "dark" ? "bg-indigo-600" : "bg-indigo-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} non lues
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
                  <p className={`mt-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Chargement...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff
                    className={`w-12 h-12 mx-auto mb-3 ${
                      theme === "dark" ? "text-gray-600" : "text-gray-300"
                    }`}
                  />
                  <p className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Aucune notification
                  </p>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    Vous êtes à jour.
                  </p>
                </div>
              ) : (
                <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 transition-colors cursor-pointer ${
                        !notification.isRead
                          ? theme === "dark"
                            ? "bg-indigo-900/20"
                            : "bg-indigo-50"
                          : ""
                      } ${theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={getNotificationColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs ${
                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.daysLeft !== null && (
                              <span
                                className={`text-xs font-semibold ${
                                  notification.daysLeft === 0
                                    ? "text-red-500"
                                    : notification.daysLeft <= 2
                                    ? "text-orange-500"
                                    : notification.daysLeft <= 5
                                    ? "text-yellow-500"
                                    : "text-blue-500"
                                }`}
                              >
                                {notification.daysLeft === 0
                                  ? "Expiré"
                                  : `${notification.daysLeft}j restants`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-100"}`}>
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push("/admin/notifications")
                }}
                className="w-full py-2 text-sm font-medium text-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors"
              >
                Voir toutes les notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
