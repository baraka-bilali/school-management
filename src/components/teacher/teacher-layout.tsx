"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"
import { cn } from "@/lib/utils"
import TeacherHeader from "./teacher-header"
import TeacherDesktopHeader from "./teacher-desktop-header"
import TeacherSidebar from "./teacher-sidebar"
import TeacherBottomNav from "./teacher-bottom-nav"
import { useTeacherTheme } from "./use-teacher-theme"

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
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [walletPulse, setWalletPulse] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

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
      try {
        const notifRes = await fetch("/api/teacher/notifications", { credentials: "include" })
        if (notifRes.ok) {
          const data = await notifRes.json()
          setUnreadNotifications((data.notifications || []).filter((n: { isRead: boolean }) => !n.isRead).length)
        }
      } catch {}
    }
    void load()
  }, [])

  useEffect(() => {
    if (!teacher?.userId) return
    const channel = supabaseBrowser
      .channel(`payments:teacher:${teacher.userId}`)
      .on("broadcast", { event: "payment_received" }, (payload) => {
        setWalletPulse(true)
        setUnreadNotifications((p) => p + 1)
        const inv = (payload.payload as { invoiceNumber?: string })?.invoiceNumber
        void showSystemNotification(
          "digiSchool",
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
        setUnreadNotifications((p) => p + 1)
        void showSystemNotification("digiSchool", "Nouveau communiqué", { url: "/teacher/messages" })
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
        unreadMessages={unreadNotifications}
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
          unreadCount={unreadNotifications}
          isDark={isDark}
        />
        <TeacherDesktopHeader firstName={teacher?.firstName} unreadCount={unreadNotifications} isDark={isDark} />

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2 lg:max-w-5xl lg:px-6 lg:pb-8 lg:pt-6 xl:max-w-6xl xl:px-8">
          {children}
        </main>

        <TeacherBottomNav walletPulse={walletPulse} isDark={isDark} />
      </div>
    </div>
  )
}
