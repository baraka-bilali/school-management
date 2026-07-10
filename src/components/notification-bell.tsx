"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/auth-fetch"
import { getSupabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"

interface NotificationBellProps {
  href?: string
}

export default function NotificationBell({ href = "/admin/notifications" }: NotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))
  const prevUnreadRef = useRef(0)
  const countInitializedRef = useRef(false)

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

  const notifyNewAlerts = async (newCount: number) => {
    if (newCount <= prevUnreadRef.current || prevUnreadRef.current < 0) return
    let message = "Vous avez de nouvelles notifications"
    try {
      const res = await authFetch("/api/notifications?page=1&limit=1", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        const latest = data.notifications?.[0]
        if (latest?.message) message = latest.message
      }
    } catch {}
    await showSystemNotification("Kelasi 360", message, { url: href })
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch("/api/notifications/count", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        const newCount: number = data.count
        if (countInitializedRef.current && newCount > prevUnreadRef.current) {
          await notifyNewAlerts(newCount)
        }
        countInitializedRef.current = true
        prevUnreadRef.current = newCount
        setUnreadCount(newCount)
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

        const channel = getSupabaseBrowser()
          .channel(channelName)
          .on("broadcast", { event: "new_notification" }, () => {
            fetchUnreadCount()
          })
          .subscribe()

        cleanup = () => getSupabaseBrowser().removeChannel(channel)
      } catch {}
    }
    initRealtime()
    return () => { if (cleanup) cleanup() }
  }, [])

  useEffect(() => {
    const onMarkedRead = () => {
      setUnreadCount(0)
      prevUnreadRef.current = 0
    }
    window.addEventListener("notificationsMarkedRead", onMarkedRead)
    return () => window.removeEventListener("notificationsMarkedRead", onMarkedRead)
  }, [])

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`relative p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
      title="Voir les notifications"
    >
      <Bell className={`w-6 h-6 ${unreadCount > 0 ? "text-indigo-500 animate-pulse" : isDark ? "text-gray-300" : "text-gray-600"}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
