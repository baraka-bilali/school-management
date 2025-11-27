"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, AlertCircle, Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
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

interface NotificationBellProps {
  onNotificationClick?: () => void
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps = {}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Récupérer le nombre de notifications non lues
  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch("/api/notifications/count", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error("Erreur lors du comptage des notifications:", error)
    }
  }

  // Récupérer les 5 dernières notifications pour le modal
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/notifications", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        // Limiter à 5 pour le modal
        setNotifications(data.notifications.slice(0, 5))
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Gérer le clic sur une notification
  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lue
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    // Fermer le modal
    setIsOpen(false)
    // Rediriger vers l'onglet Notifications ou déclencher le callback
    if (onNotificationClick) {
      onNotificationClick()
    }
  }

  // Marquer une notification comme lue
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
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error)
    }
  }

  // Supprimer une notification
  const deleteNotification = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        const notification = notifications.find((n) => n.id === id)
        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error)
    }
  }

  // Marquer toutes comme lues
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
      console.error("Erreur lors de la mise à jour des notifications:", error)
    }
  }

  // Déclencher la vérification automatique des abonnements
  const checkSubscriptions = async () => {
    try {
      await authFetch("/api/notifications/check", {
        method: "POST",
        credentials: "include",
      })
      // Après vérification, récupérer le nouveau compteur
      fetchUnreadCount()
    } catch (error) {
      console.error("Erreur lors de la vérification des abonnements:", error)
    }
  }

  // Vérifier automatiquement les notifications au chargement et toutes les 5 minutes
  useEffect(() => {
    // Vérifier immédiatement au chargement
    checkSubscriptions()
    fetchUnreadCount()
    
    // Puis vérifier toutes les 5 minutes
    const interval = setInterval(() => {
      checkSubscriptions()
      fetchUnreadCount()
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [])

  // Charger les notifications quand on ouvre le panneau
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Obtenir la couleur selon le type de notification
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
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-yellow-400 animate-pulse" : "text-gray-300"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panneau */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-white/80 hover:text-white flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Tout marquer lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Liste des 5 dernières notifications */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
                  <p className="mt-2">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-indigo-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={getNotificationColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.daysLeft !== null && (
                              <span className={`text-xs font-semibold ${
                                notification.daysLeft === 0 ? "text-red-400" :
                                notification.daysLeft <= 2 ? "text-orange-400" :
                                notification.daysLeft <= 5 ? "text-yellow-400" :
                                "text-blue-400"
                              }`}>
                                {notification.daysLeft === 0 ? "Expiré" : `${notification.daysLeft}j restants`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Voir tout */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    if (onNotificationClick) {
                      onNotificationClick()
                    }
                  }}
                  className="w-full py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2 transition-colors"
                >
                  Voir toutes les notifications
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
