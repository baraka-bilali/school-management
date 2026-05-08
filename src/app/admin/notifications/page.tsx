"use client"

import { useState, useEffect, Fragment } from "react"
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
  DollarSign,
  Calendar,
  Info,
  Megaphone,
  CreditCard,
  GraduationCap
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

type CategoryFilter = "all" | "subscription" | "payment" | "reminder" | "info" | "system" | "event"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)

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

  const checkSubscriptions = async () => {
    try {
      setChecking(true)
      const res = await authFetch("/api/notifications/check", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        // Rafraîchir les notifications après vérification
        await fetchNotifications()
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error)
    } finally {
      setChecking(false)
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
    const now = new Date()
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    return `${time} • ${dateStr}`
  }

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes("EXPIRED") || type.includes("SUBSCRIPTION")) return <AlertCircle className="w-5 h-5" />
    if (type.includes("PAYMENT")) return <CreditCard className="w-5 h-5" />
    if (type.includes("DAY")) return <Clock className="w-5 h-5" />
    if (type.includes("EVENT")) return <Calendar className="w-5 h-5" />
    if (type.includes("SYSTEM")) return <Settings className="w-5 h-5" />
    return <Bell className="w-5 h-5" />
  }

  const getNotificationCategory = (type: string): CategoryFilter => {
    if (type.includes("EXPIRED") || type.includes("SUBSCRIPTION")) return "subscription"
    if (type.includes("PAYMENT")) return "payment"
    if (type.includes("DAY")) return "reminder"
    if (type.includes("EVENT")) return "event"
    if (type.includes("SYSTEM")) return "system"
    return "info"
  }

  const getNotificationColor = (type: string) => {
    if (type.includes("EXPIRED")) return theme === "dark" ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return theme === "dark" ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"
    if (type.includes("5_DAYS") || type.includes("PAYMENT")) return theme === "dark" ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-600"
    if (type.includes("EVENT")) return theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600"
    return theme === "dark" ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
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
    // Filtre par catégorie
    if (categoryFilter !== "all" && getNotificationCategory(n.type) !== categoryFilter) {
      return false
    }
    // Filtre non lues
    if (showUnreadOnly && n.isRead) {
      return false
    }
    return true
  })

  // Grouper par mois
  const groupedByMonth = filteredNotifications.reduce((acc, notification) => {
    const monthYear = getMonthYear(notification.createdAt)
    if (!acc[monthYear]) {
      acc[monthYear] = []
    }
    acc[monthYear].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const categories = [
    { key: "all" as CategoryFilter, label: "Tout", icon: null },
    { key: "subscription" as CategoryFilter, label: "Alertes abonnement", icon: AlertCircle },
    { key: "payment" as CategoryFilter, label: "Paiements", icon: CreditCard },
    { key: "reminder" as CategoryFilter, label: "Rappels", icon: Clock },
    { key: "info" as CategoryFilter, label: "Informations", icon: Info },
    { key: "system" as CategoryFilter, label: "Mises à jour système", icon: Settings },
    { key: "event" as CategoryFilter, label: "Événements", icon: Calendar },
  ]

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgPrimary = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPrimary}`}>
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
      <div className={`min-h-screen ${bgPrimary}`}>
        {/* Header fixe */}
        <div className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation */}
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => window.history.back()}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${textColor}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className={`text-xl font-bold ${textColor}`}>Notifications</h1>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={checkSubscriptions}
                  disabled={checking}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    checking
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : theme === "dark"
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  title="Vérifier les abonnements et générer les alertes"
                >
                  {checking ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Vérification...
                    </div>
                  ) : (
                    'Vérifier les abonnements'
                  )}
                </button>
                <button className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${textColor}`}>
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sous-header */}
            <div className="pb-4">
              <div className="mb-4">
                <h2 className={`text-lg font-semibold ${textColor}`}>Historique des notifications</h2>
                <p className={`text-sm ${textSecondary}`}>
                  Vous avez <span className="font-semibold text-indigo-600">{unreadCount} {unreadCount > 1 ? 'messages non lus' : 'message non lu'}</span>
                </p>
              </div>

              {/* Catégories - Scroll horizontal */}
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

              {/* Toggle Unread only + Mark all as read */}
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showUnreadOnly}
                      onChange={(e) => setShowUnreadOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      showUnreadOnly 
                        ? "bg-indigo-600" 
                        : theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                    }`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      showUnreadOnly ? "translate-x-5" : ""
                    }`}></div>
                  </div>
                  <span className={`text-sm font-medium ${textColor}`}>Non lus uniquement</span>
                </label>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu - Notifications groupées par mois */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {Object.keys(groupedByMonth).length === 0 ? (
            <div className={`${bgCard} rounded-xl border ${borderColor} p-12 text-center`}>
              <Bell className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`text-lg font-medium ${textColor}`}>Aucune notification</p>
              <p className={`mt-1 ${textSecondary}`}>
                {showUnreadOnly 
                  ? "Vous êtes à jour ! Aucune notification non lue."
                  : "Vous n'avez pas encore de notifications."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByMonth).map(([monthYear, monthNotifications]) => (
                <div key={monthYear}>
                  {/* Séparateur de mois */}
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold ${textSecondary}`}>{monthYear}</h3>
                  </div>

                  {/* Notifications du mois */}
                  <div className={`${bgCard} rounded-xl border ${borderColor} divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                    {monthNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 transition-colors relative ${
                          !notification.isRead && theme === "dark" 
                            ? "bg-indigo-500/5" 
                            : !notification.isRead 
                            ? "bg-indigo-50/50" 
                            : ""
                        } hover:bg-gray-50 dark:hover:bg-gray-700/30`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Indicateur non lu */}
                          {!notification.isRead && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-red-500 rounded-r"></div>
                          )}

                          {/* Icône */}
                          <div className={`p-3 rounded-full flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Contenu */}
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

                              {/* Menu actions */}
                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === notification.id ? null : notification.id)}
                                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${textSecondary}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Dropdown menu */}
                                {openMenuId === notification.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={() => setOpenMenuId(null)}
                                    ></div>
                                    <div className={`absolute right-0 mt-1 w-48 ${bgCard} rounded-lg shadow-lg border ${borderColor} py-1 z-20`}>
                                      {!notification.isRead && (
                                        <button
                                          onClick={() => {
                                            markAsRead(notification.id)
                                            setOpenMenuId(null)
                                          }}
                                          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${textColor}`}
                                        >
                                          <Check className="w-4 h-4" />
                                          Marquer comme lu
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          deleteNotification(notification.id)
                                          setOpenMenuId(null)
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Date/Heure */}
                            <p className={`text-xs mt-2 ${textSecondary}`}>
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
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
    </Layout>
  )
}
