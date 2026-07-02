"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"
import { parseCommuniqueIdFromNotification } from "@/lib/communique-user-read"
import { cn } from "@/lib/utils"
import TeacherHeader from "./teacher-header"
import TeacherDesktopHeader from "./teacher-desktop-header"
import TeacherSidebar from "./teacher-sidebar"
import TeacherBottomNav from "./teacher-bottom-nav"
import { useTeacherTheme } from "./use-teacher-theme"

async function fetchMessageCounts(): Promise<{ comm: number; otherNotif: number }> {
  try {
    const [notifRes, commRes] = await Promise.all([
      fetch("/api/teacher/notifications", { credentials: "include", cache: "no-store" }),
      fetch("/api/teacher/communiques/count", { credentials: "include", cache: "no-store" }),
    ])
    let otherNotif = 0
    let comm = 0
    if (notifRes.ok) {
      const data = await notifRes.json()
      otherNotif = (data.notifications || []).filter(
        (n: { isRead: boolean; message: string }) =>
          !n.isRead && !parseCommuniqueIdFromNotification(n.message)
      ).length
    }
    if (commRes.ok) {
      comm = (await commRes.json()).unread || 0
    }
    return { comm, otherNotif }
  } catch {
    return { comm: 0, otherNotif: 0 }
  }
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isDark, bg, desktopBg } = useTeacherTheme()
  const [teacher, setTeacher] = useState<{
    firstName: string
    fullName: string
    specialty?: string | null
    school: string
    userId: number
    schoolId: number
  } | null>(null)
  const [unreadCommuniques, setUnreadCommuniques] = useState(0)
  const [unreadOtherNotifications, setUnreadOtherNotifications] = useState(0)
  const [walletPulse, setWalletPulse] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  const totalUnread = unreadCommuniques + unreadOtherNotifications

  const refreshCounts = useCallback(async () => {
    const { comm, otherNotif } = await fetchMessageCounts()
    setUnreadCommuniques(comm)
    setUnreadOtherNotifications(otherNotif)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("teacher-sidebar-open")
    if (saved !== null) setSidebarExpanded(saved === "true")
  }, [])

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev
      localStorage.setItem("teacher-sidebar-open", String(next))
      return next
    })
  }

  // Charger les compteurs immédiatement (sans attendre /me)
  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teacher/me", { credentials: "include" })
        if (res.status === 401) {
          window.location.href = "/login"
          return
        }
        if (res.ok) {
          const { teacher: t } = await res.json()
          const fullName = `${t.lastName} ${t.middleName || ""} ${t.firstName}`.replace(/\s+/g, " ").trim()
          setTeacher({
            firstName: t.firstName,
            fullName,
            specialty: t.specialty,
            school: t.school || "Mon école",
            userId: t.userId,
            schoolId: t.schoolId,
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    const handleMessagesUpdated = () => {
      void refreshCounts()
    }
    const handleNotifUpdate = (evt: Event) => {
      const custom = evt as CustomEvent<{ unread?: number; otherOnly?: number }>
      if (typeof custom.detail?.otherOnly === "number") {
        setUnreadOtherNotifications(custom.detail.otherOnly)
        return
      }
      void refreshCounts()
    }

    window.addEventListener("teacherMessagesUpdated", handleMessagesUpdated)
    window.addEventListener("teacherNotificationsUpdated", handleNotifUpdate as EventListener)
    window.addEventListener("teacherCommuniqueRead", handleMessagesUpdated)
    window.addEventListener("teacherNewCommunique", handleMessagesUpdated)
    return () => {
      window.removeEventListener("teacherMessagesUpdated", handleMessagesUpdated)
      window.removeEventListener("teacherNotificationsUpdated", handleNotifUpdate as EventListener)
      window.removeEventListener("teacherCommuniqueRead", handleMessagesUpdated)
      window.removeEventListener("teacherNewCommunique", handleMessagesUpdated)
    }
  }, [refreshCounts])

  useEffect(() => {
    if (!teacher?.userId) return
    const channel = supabaseBrowser
      .channel(`payments:teacher:${teacher.userId}`)
      .on("broadcast", { event: "payment_received" }, (payload) => {
        setWalletPulse(true)
        setUnreadOtherNotifications((p) => p + 1)
        const inv = (payload.payload as { invoiceNumber?: string })?.invoiceNumber
        void showSystemNotification(
          "Kelasi 360",
          inv ? `Paiement reçu — ${inv}` : "Paiement reçu",
          { url: "/teacher/wallet" }
        )
        window.dispatchEvent(new Event("teacherPaymentReceived"))
      })
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [teacher?.userId])

  useEffect(() => {
    if (!teacher?.schoolId) return
    const channel = supabaseBrowser
      .channel(`communiques:school:${teacher.schoolId}`)
      .on("broadcast", { event: "new_communique" }, () => {
        setUnreadCommuniques((p) => p + 1)
        void showSystemNotification("Kelasi 360", "Nouveau communiqué", {
          url: "/teacher/messages?tab=communiques",
        })
        window.dispatchEvent(new Event("teacherNewCommunique"))
      })
      .subscribe()
    return () => { supabaseBrowser.removeChannel(channel) }
  }, [teacher?.schoolId])

  useEffect(() => {
    if (pathname === "/teacher/wallet") setWalletPulse(false)
  }, [pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      localStorage.removeItem("token")
      window.location.href = "/login"
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className={cn("min-h-screen transition-colors", bg, desktopBg)}>
      <TeacherSidebar
        profile={
          teacher
            ? { school: teacher.school, fullName: teacher.fullName, firstName: teacher.firstName, subtitle: teacher.specialty || "Enseignant" }
            : null
        }
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        unreadMessages={totalUnread}
        walletPulse={walletPulse}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        isDark={isDark}
      />

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ease-in-out",
          sidebarExpanded ? "lg:pl-64 xl:pl-72" : "lg:pl-[4.25rem]"
        )}
      >
        <TeacherHeader
          schoolName={teacher?.school}
          firstName={teacher?.firstName}
          unreadCount={totalUnread}
          isDark={isDark}
        />
        <TeacherDesktopHeader firstName={teacher?.firstName} unreadCount={totalUnread} isDark={isDark} />

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2 lg:max-w-5xl lg:px-6 lg:pb-8 lg:pt-6 xl:max-w-6xl xl:px-8">
          {children}
        </main>

        <TeacherBottomNav walletPulse={walletPulse} isDark={isDark} />
      </div>
    </div>
  )
}
