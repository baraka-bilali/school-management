"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Bell, CheckCircle, AlertCircle, Info, Calendar, FileText, Wallet, Trash2 } from "lucide-react"

interface Notification {
  id: number
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function StudentNotificationsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

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
    // Charger les notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/student/notifications", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/student/notifications/${id}/read`, {
        method: "POST",
        credentials: "include"
      })
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/student/notifications/read-all", {
        method: "POST",
        credentials: "include"
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "GRADE":
        return <FileText className="w-5 h-5 text-green-500" />
      case "SCHEDULE":
        return <Calendar className="w-5 h-5 text-blue-500" />
      case "FEE":
        return <Wallet className="w-5 h-5 text-orange-500" />
      case "ALERT":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-indigo-500" />
    }
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Layout>
      <div className="p-6 space-y-6">
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              Mes notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className={`mt-3 ${textSecondary}`}>Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-12 ${textSecondary}`}>
                <Bell className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune notification</p>
                <p className="text-sm text-center max-w-md">
                  Vous n'avez pas encore de notifications. Elles apparaîtront ici 
                  lorsque vous recevrez des informations importantes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      notification.isRead
                        ? `${theme === "dark" ? "bg-gray-700/30 border-gray-700" : "bg-gray-50 border-gray-200"}`
                        : `${theme === "dark" ? "bg-indigo-500/10 border-indigo-500/30" : "bg-indigo-50 border-indigo-200"} hover:shadow-md`
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        notification.isRead
                          ? theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                          : theme === "dark" ? "bg-indigo-500/20" : "bg-indigo-100"
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`${notification.isRead ? textSecondary : textColor} ${!notification.isRead && "font-medium"}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-1 ${textSecondary}`}>
                          {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
