"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Bell,
  Megaphone,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  Wallet,
  Clock,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"

interface Notification {
  id: number
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

interface Communique {
  id: number
  title: string
  content: string
  createdAt: string
  isRead: boolean
}

type Tab = "notifications" | "communiques"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function NotificationsHubContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "communiques" ? "communiques" : "notifications"
  const { card, text, textMuted, shadow, border } = useStudentTheme()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loadingNotif, setLoadingNotif] = useState(true)
  const [loadingComm, setLoadingComm] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/student/notifications", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } finally {
      setLoadingNotif(false)
    }
  }, [])

  const fetchCommuniques = useCallback(async () => {
    try {
      const res = await fetch("/api/student/communiques?page=1&limit=30", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setCommuniques(data.communiques || [])
      }
    } finally {
      setLoadingComm(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    fetchCommuniques()
  }, [fetchNotifications, fetchCommuniques])

  useEffect(() => {
    if (searchParams.get("tab") === "communiques") setTab("communiques")
  }, [searchParams])

  const router = useRouter()

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/student/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => {
          const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
          const unread = next.filter((n) => !n.isRead).length
          window.dispatchEvent(new CustomEvent("studentNotificationsUpdated", { detail: { unread } }))
          return next
        })
        return true
      }
    } catch {}

    return false
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/student/notifications/read-all", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => {
          const next = prev.map((n) => ({ ...n, isRead: true }))
          window.dispatchEvent(new CustomEvent("studentNotificationsUpdated", { detail: { unread: 0 } }))
          return next
        })
        return true
      }
    } catch {}

    return false
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "GRADE":
        return <FileText className="h-5 w-5 text-green-500" />
      case "SCHEDULE":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "FEE":
        return <Wallet className="h-5 w-5 text-orange-500" />
      case "ALERT":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-indigo-500" />
    }
  }

  const unreadNotif = notifications.filter((n) => !n.isRead).length
  const unreadComm = communiques.filter((c) => !c.isRead).length

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Messages</h1>
        <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>Notifications et communiqués de votre école</p>
      </div>

      {/* Onglets */}
      <div className={cn("flex gap-1 rounded-2xl border p-1 lg:max-w-md", card, border)}>
        <button
          type="button"
          onClick={() => setTab("notifications")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
            tab === "notifications"
              ? "bg-indigo-600 text-white shadow-sm"
              : cn(textMuted, "hover:bg-gray-50 dark:hover:bg-gray-800")
          )}
        >
          <Bell className="h-4 w-4" />
          Notifications
          {unreadNotif > 0 && (
            <span className={cn("rounded-full px-1.5 text-[10px] font-bold", tab === "notifications" ? "bg-white/20" : "bg-red-500 text-white")}>
              {unreadNotif}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("communiques")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
            tab === "communiques"
              ? "bg-indigo-600 text-white shadow-sm"
              : cn(textMuted, "hover:bg-gray-50 dark:hover:bg-gray-800")
          )}
        >
          <Megaphone className="h-4 w-4" />
          Communiqués
          {unreadComm > 0 && (
            <span className={cn("rounded-full px-1.5 text-[10px] font-bold", tab === "communiques" ? "bg-white/20" : "bg-red-500 text-white")}>
              {unreadComm}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="space-y-3">
          {unreadNotif > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
            >
              <CheckCircle className="h-4 w-4" />
              Tout marquer comme lu
            </button>
          )}
          {loadingNotif ? (
            <StudentLoading variant="notifications" />
          ) : notifications.length === 0 ? (
            <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
              <Bell className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
              <p className={cn("font-medium", text)}>Aucune notification</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={async () => {
                  if (notification.isRead) return
                  const ok = await markAsRead(notification.id)
                  if (ok && notification.type === "FEE") router.push("/student/fees")
                }}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left",
                  notification.isRead
                    ? cn(card, border)
                    : "border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", notification.isRead ? "bg-gray-100 dark:bg-gray-800" : "bg-indigo-100 dark:bg-indigo-500/20")}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", notification.isRead ? textMuted : cn(text, "font-medium"))}>{notification.message}</p>
                    <p className={cn("mt-1 text-xs", textMuted)}>{formatDate(notification.createdAt)}</p>
                  </div>
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                    {notification.isRead ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Communiqués */}
      {tab === "communiques" && (
        <div className="space-y-2">
          {loadingComm ? (
            <StudentLoading variant="communiques" />
          ) : communiques.length === 0 ? (
            <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
              <Megaphone className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
              <p className={cn("font-medium", text)}>Aucun communiqué</p>
            </div>
          ) : (
            communiques.map((c) => (
              <Link
                key={c.id}
                href={`/student/communiques/${c.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
                  !c.isRead ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/20 dark:bg-indigo-500/5" : cn(card, border, shadow)
                )}
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", !c.isRead ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20" : "bg-gray-100 text-gray-500 dark:bg-gray-800")}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", text)}>{c.title}</p>
                  <p className={cn("flex items-center gap-1 text-xs", textMuted)}>
                    <Clock className="h-3 w-3" />
                    {formatDate(c.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {c.isRead && <Check className="h-3.5 w-3.5 text-green-500" />}
                  <ChevronRight className={cn("h-4 w-4", textMuted)} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Footer info — desktop */}
      {tab === "communiques" && !loadingComm && communiques.length > 0 && (
        <div className="hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 p-6 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <h3 className={cn("text-lg font-bold", text)}>Restez informé</h3>
            <p className={cn("mt-2 text-sm leading-relaxed", textMuted)}>
              Toutes les informations importantes pour vous sont centralisées ici. Consultez régulièrement vos communiqués.
            </p>
          </div>
          <Megaphone className="h-16 w-16 text-indigo-500/30" />
        </div>
      )}
    </div>
  )
}

export default function StudentNotificationsPage() {
  return (
    <Suspense fallback={<StudentLoading variant="notifications" />}>
      <NotificationsHubContent />
    </Suspense>
  )
}
