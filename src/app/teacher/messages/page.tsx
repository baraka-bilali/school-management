"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Bell,
  Megaphone,
  Wallet,
  Info,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"
import {
  displayNotificationMessage,
  parseCommuniqueIdFromNotification,
} from "@/lib/communique-user-read"

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

function MessagesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") === "communiques" ? "communiques" : "notifications"
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loadingNotif, setLoadingNotif] = useState(true)
  const [loadingComm, setLoadingComm] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/notifications", { credentials: "include" })
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
      const res = await fetch("/api/teacher/communiques?page=1&limit=30", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setCommuniques(data.communiques || [])
      }
    } finally {
      setLoadingComm(false)
    }
  }, [])

  useEffect(() => {
    void fetchNotifications()
    void fetchCommuniques()
  }, [fetchNotifications, fetchCommuniques])

  useEffect(() => {
    const onNew = () => {
      void fetchNotifications()
      void fetchCommuniques()
    }
    window.addEventListener("teacherNewCommunique", onNew)
    return () => window.removeEventListener("teacherNewCommunique", onNew)
  }, [fetchNotifications, fetchCommuniques])

  useEffect(() => {
    if (searchParams.get("tab") === "communiques") setTab("communiques")
  }, [searchParams])

  const syncBell = () => {
    window.dispatchEvent(new Event("teacherMessagesUpdated"))
  }

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch("/api/teacher/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
        syncBell()
        return true
      }
    } catch {}
    return false
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/teacher/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ readAll: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        syncBell()
        return true
      }
    } catch {}
    return false
  }

  const markCommuniqueAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/teacher/communiques/${id}`, { credentials: "include" })
      if (res.ok) {
        setCommuniques((prev) => prev.map((c) => (c.id === id ? { ...c, isRead: true } : c)))
        setNotifications((prev) =>
          prev.map((n) =>
            parseCommuniqueIdFromNotification(n.message) === id ? { ...n, isRead: true } : n
          )
        )
        syncBell()
        return true
      }
    } catch {}
    return false
  }

  const markAllCommuniquesAsRead = async () => {
    try {
      const res = await fetch("/api/teacher/communiques/read-all", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setCommuniques((prev) => prev.map((c) => ({ ...c, isRead: true })))
        setNotifications((prev) =>
          prev.map((n) =>
            parseCommuniqueIdFromNotification(n.message) ? { ...n, isRead: true } : n
          )
        )
        syncBell()
        return true
      }
    } catch {}
    return false
  }

  const getNotificationIcon = (type: string, message: string) => {
    if (parseCommuniqueIdFromNotification(message)) {
      return <Megaphone className="h-5 w-5 text-indigo-500" />
    }
    switch (type) {
      case "FEE":
      case "PAYMENT":
        return <Wallet className="h-5 w-5 text-orange-500" />
      case "ALERT":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-indigo-500" />
    }
  }

  const unreadNotif = notifications.filter((n) => !n.isRead).length
  const unreadComm = communiques.filter((c) => !c.isRead).length
  const unreadTotal = unreadNotif + unreadComm

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Messages</h1>
          <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>Notifications et communiqués de l&apos;école</p>
        </div>
        {unreadTotal > 0 && (
          <button
            type="button"
            onClick={async () => {
              setMarkingAll(true)
              await Promise.all([markAllAsRead(), markAllCommuniquesAsRead()])
              setMarkingAll(false)
            }}
            disabled={markingAll}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50",
              isDark ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white text-gray-700"
            )}
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Tout marquer comme lu ({unreadTotal})
          </button>
        )}
      </div>

      <div className={cn("flex gap-1 rounded-2xl border p-1 lg:max-w-md", card, border)}>
        <button
          type="button"
          onClick={() => setTab("notifications")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
            tab === "notifications" ? "bg-indigo-600 text-white shadow-sm" : textMuted
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
            tab === "communiques" ? "bg-indigo-600 text-white shadow-sm" : textMuted
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

      {tab === "notifications" && (
        <div className="space-y-3">
          {loadingNotif ? (
            <StudentLoading variant="notifications" />
          ) : notifications.length === 0 ? (
            <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
              <Bell className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
              <p className={cn("font-medium", text)}>Aucune notification</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={async () => {
                  const communiqueId = parseCommuniqueIdFromNotification(n.message)
                  if (communiqueId) {
                    await fetch(`/api/teacher/communiques/${communiqueId}`, { credentials: "include" })
                    syncBell()
                    router.push(`/teacher/communiques/${communiqueId}`)
                    return
                  }
                  if (!n.isRead) await markAsRead(n.id)
                  if (n.type === "FEE" || n.type === "PAYMENT" || n.message.includes("Paiement reçu")) {
                    router.push("/teacher/wallet")
                  }
                }}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left",
                  n.isRead
                    ? cn(card, border)
                    : "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", n.isRead ? (isDark ? "bg-gray-800" : "bg-gray-100") : "bg-indigo-100 dark:bg-indigo-500/20")}>
                    {getNotificationIcon(n.type, n.message)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", n.isRead ? textMuted : cn(text, "font-medium"))}>
                      {displayNotificationMessage(n.message)}
                    </p>
                    <p className={cn("mt-1 flex items-center gap-1 text-xs", textMuted)}>
                      <Clock className="h-3 w-3" />
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {tab === "communiques" && (
        <div className="space-y-3">
          {loadingComm ? (
            <StudentLoading variant="notifications" />
          ) : communiques.length === 0 ? (
            <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
              <Megaphone className={cn("mx-auto mb-3 h-10 w-10", textMuted)} />
              <p className={cn("font-medium", text)}>Aucun communiqué</p>
            </div>
          ) : (
            communiques.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/communiques/${c.id}`}
                onClick={() => { if (!c.isRead) void markCommuniqueAsRead(c.id) }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
                  c.isRead
                    ? cn(card, border, shadow)
                    : "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                  <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-semibold", text)}>{c.title}</p>
                  <p className={cn("text-xs", textMuted)}>{formatDate(c.createdAt)}</p>
                </div>
                <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function TeacherMessagesPage() {
  return (
    <Suspense fallback={<StudentLoading variant="notifications" />}>
      <MessagesContent />
    </Suspense>
  )
}
