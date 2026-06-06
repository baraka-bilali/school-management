"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, AlertCircle, Clock, BellOff, Megaphone } from "lucide-react"
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

// Son "ting dong" généré via Web Audio API — pas de fichier externe
function playBing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const t = ctx.currentTime

    // "Ting" — note aiguë courte
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(1400, t)
    osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.08)
    gain1.gain.setValueAtTime(0.3, t)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc1.start(t)
    osc1.stop(t + 0.35)

    // "Dong" — note grave résonante, décalée de 180ms
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(700, t + 0.18)
    osc2.frequency.exponentialRampToValueAtTime(550, t + 0.5)
    gain2.gain.setValueAtTime(0.0, t)
    gain2.gain.setValueAtTime(0.25, t + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
    osc2.start(t)
    osc2.stop(t + 0.9)
  } catch {}
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps = {}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const isOpenRef = useRef(isOpen)
  const prevUnreadRef = useRef(0)

  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

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

  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch("/api/notifications/count", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        const newCount: number = data.count
        // Jouer le son si nouvelles notifications arrivées
        if (newCount > prevUnreadRef.current && prevUnreadRef.current >= 0) {
          playBing()
        }
        prevUnreadRef.current = newCount
        setUnreadCount(newCount)
      }
    } catch {}
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/notifications?page=1&limit=5", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch {} finally {
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
      const res = await authFetch(`/api/notifications/${id}`, { method: "PATCH", credentials: "include" })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {}
  }

  const deleteNotification = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        const notif = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        if (notif && !notif.isRead) setUnreadCount((prev) => Math.max(0, prev - 1))
        setConfirmDeleteId(null)
      }
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const res = await authFetch("/api/notifications", { method: "POST", credentials: "include" })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch {}
  }

  useEffect(() => {
    let cleanup: (() => void) | undefined
    const initRealtime = async () => {
      fetchUnreadCount()
      try {
        const res = await authFetch("/api/auth/me", { credentials: "include" })
        if (!res.ok) return
        const { user } = await res.json()

        const channelName = user.role === "SUPER_ADMIN"
          ? "notifications:super-admin"
          : `notifications:user:${user.id}`

        const channel = supabaseBrowser
          .channel(channelName)
          .on("broadcast", { event: "new_notification" }, () => {
            fetchUnreadCount()
            if (isOpenRef.current) fetchNotifications()
          })
          .subscribe()

        cleanup = () => supabaseBrowser.removeChannel(channel)
      } catch {}
    }
    initRealtime()
    return () => { if (cleanup) cleanup() }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const loadAndMarkRead = async () => {
      setLoading(true)
      try {
        const [notifRes] = await Promise.all([
          authFetch("/api/notifications?page=1&limit=5", { credentials: "include" }),
          authFetch("/api/notifications", { method: "POST", credentials: "include" }),
        ])
        if (notifRes.ok) {
          const data = await notifRes.json()
          setNotifications(data.notifications.map((n: Notification) => ({ ...n, isRead: true })))
        }
        setUnreadCount(0)
        prevUnreadRef.current = 0
      } catch {} finally {
        setLoading(false)
      }
    }
    loadAndMarkRead()
  }, [isOpen])

  const getNotificationColor = (type: string) => {
    if (type === "SYSTEM_MESSAGE") return "text-purple-400"
    if (type.includes("EXPIRED")) return "text-red-400"
    if (type.includes("1_DAY") || type.includes("2_DAYS")) return "text-orange-400"
    if (type.includes("5_DAYS")) return "text-yellow-400"
    return "text-blue-400"
  }

  const getNotificationIcon = (type: string) => {
    if (type === "SYSTEM_MESSAGE") return <Megaphone className="w-4 h-4" />
    if (type.includes("EXPIRED")) return <AlertCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
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

  const isDark = theme === "dark"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-indigo-500 animate-pulse" : isDark ? "text-gray-300" : "text-gray-600"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setConfirmDeleteId(null) }} />
          <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${isDark ? "bg-indigo-700" : "bg-indigo-600"}`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} non lu{unreadCount > 1 ? "es" : "e"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} title="Tout marquer comme lu" className="text-white/80 hover:text-white p-1 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { setIsOpen(false); setConfirmDeleteId(null) }} className="text-white/80 hover:text-white transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps */}
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500 mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Aucune notification</p>
                </div>
              ) : (
                <div className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
                  {notifications.map((n) => (
                    <div key={n.id} className={`px-4 py-3 transition-colors relative ${
                      !n.isRead
                        ? isDark ? "bg-indigo-900/25 border-l-2 border-l-indigo-400" : "bg-indigo-50 border-l-2 border-l-indigo-500"
                        : isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
                    }`}>
                      {/* Confirmation suppression inline */}
                      {confirmDeleteId === n.id ? (
                        <div className="flex items-center justify-between gap-2 py-1">
                          <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>Supprimer cette notification ?</span>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeleteId(null)} className={`text-xs px-2 py-1 rounded ${isDark ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"} hover:opacity-80`}>
                              Annuler
                            </button>
                            <button onClick={() => deleteNotification(n.id)} className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3" onClick={() => handleNotificationClick(n)}>
                          <div className={`mt-0.5 flex-shrink-0 ${getNotificationColor(n.type)}`}>
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer">
                            <p className={`text-xs leading-snug ${!n.isRead ? `font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}` : isDark ? "text-gray-300" : "text-gray-600"}`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{formatDate(n.createdAt)}</span>
                              {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                              {n.isRead && <span className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"} flex items-center gap-0.5`}><Check className="w-2.5 h-2.5" /> Lu</span>}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(n.id) }}
                            className={`flex-shrink-0 p-1 rounded transition-colors ${isDark ? "text-gray-600 hover:text-red-400" : "text-gray-300 hover:text-red-400"}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <button
                onClick={() => { setIsOpen(false); router.push("/admin/notifications") }}
                className="w-full py-2 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Voir toutes les notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
