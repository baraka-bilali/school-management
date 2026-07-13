"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Megaphone,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface Communique {
  id: number
  title: string
  content: string
  createdAt: string
  isRead: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function StaffMessagesPage() {
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchCommuniques = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/communiques?page=1&limit=30", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setCommuniques(data.communiques || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCommuniques()
  }, [fetchCommuniques])

  useEffect(() => {
    const onNew = () => void fetchCommuniques()
    window.addEventListener("staffNewCommunique", onNew)
    return () => window.removeEventListener("staffNewCommunique", onNew)
  }, [fetchCommuniques])

  const syncBell = () => {
    window.dispatchEvent(new Event("staffMessagesUpdated"))
  }

  const markAllCommuniquesAsRead = async () => {
    try {
      const res = await fetch("/api/staff/communiques/read-all", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        setCommuniques((prev) => prev.map((c) => ({ ...c, isRead: true })))
        syncBell()
      }
    } catch {
      /* ignore */
    }
  }

  const unreadComm = communiques.filter((c) => !c.isRead).length

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Communiqués</h1>
          <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>Messages officiels de l&apos;école</p>
        </div>
        {unreadComm > 0 && (
          <button
            type="button"
            onClick={async () => {
              setMarkingAll(true)
              await markAllCommuniquesAsRead()
              setMarkingAll(false)
            }}
            disabled={markingAll}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50",
              isDark ? "border-gray-700 bg-gray-800 text-gray-200" : "border-gray-200 bg-white text-gray-700"
            )}
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Tout marquer comme lu ({unreadComm})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
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
              href={`/staff/communiques/${c.id}`}
              onClick={() => {
                if (!c.isRead) {
                  setCommuniques((prev) => prev.map((x) => (x.id === c.id ? { ...x, isRead: true } : x)))
                  syncBell()
                }
              }}
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
                <p className={cn("flex items-center gap-1 text-xs", textMuted)}>
                  <Clock className="h-3 w-3" />
                  {formatDate(c.createdAt)}
                </p>
              </div>
              <ChevronRight className={cn("h-5 w-5 shrink-0", textMuted)} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
