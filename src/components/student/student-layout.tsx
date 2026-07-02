"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"
import { cn } from "@/lib/utils"
import StudentHeader from "./student-header"
import StudentDesktopHeader from "./student-desktop-header"
import StudentSidebar from "./student-sidebar"
import StudentBottomNav from "./student-bottom-nav"
import { useStudentTheme } from "./use-student-theme"

interface StudentLayoutProps {
  children: React.ReactNode
}

interface StudentContext {
  firstName: string
  lastName: string
  middleName: string
  fullName: string
  className?: string
  school: string
  photoUrl: string | null
  isPremium: boolean
  studentId: number | null
  classId: number | null
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const { isDark, bg, desktopBg } = useStudentTheme()
  const [student, setStudent] = useState<StudentContext | null>(null)
  const [unreadCommuniques, setUnreadCommuniques] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [feePulse, setFeePulse] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("student-sidebar-open")
    if (saved !== null) setSidebarExpanded(saved === "true")
  }, [])

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev
      localStorage.setItem("student-sidebar-open", String(next))
      return next
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student/me", { credentials: "include" })
        if (res.status === 401) {
          window.location.href = "/login"
          return
        }
        if (res.ok) {
          const data = await res.json()
          const s = data.student
          const fullName = `${s.lastName} ${s.middleName || ""} ${s.firstName}`.replace(/\s+/g, " ").trim()
          setStudent({
            firstName: s.firstName,
            lastName: s.lastName,
            middleName: s.middleName || "",
            fullName,
            className: s.class,
            school: s.school || "Mon école",
            photoUrl: s.photoUrl || null,
            isPremium: s.isPremium === true,
            studentId: s.id,
            classId: s.classId ?? null,
          })
          if (s.schoolId) setSchoolId(s.schoolId)
        }
      } catch (e) {
        console.error("Erreur chargement profil élève:", e)
      }
      try {
        const countRes = await fetch("/api/student/communiques/count", { credentials: "include" })
        if (countRes.ok) {
          const countData = await countRes.json()
          setUnreadCommuniques(countData.unread || 0)
        }
      } catch {}
      try {
        const notifRes = await fetch("/api/student/notifications", { credentials: "include" })
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          const unread = (notifData.notifications || []).filter((n: { isRead: boolean }) => !n.isRead).length
          setUnreadNotifications(unread)
        }
      } catch {}
    }
    fetchData()
  }, [])

  // Sync badge notifications (lu/non lu) après lecture dans /student/notifications
  useEffect(() => {
    const handle = (evt: Event) => {
      const custom = evt as CustomEvent<{ unread?: number }>
      const unread = custom.detail?.unread
      if (typeof unread === "number") {
        setUnreadNotifications(unread)
        return
      }
    }

    window.addEventListener("studentNotificationsUpdated", handle as EventListener)
    return () => window.removeEventListener("studentNotificationsUpdated", handle as EventListener)
  }, [])

  useEffect(() => {
    const handleRead = async () => {
      try {
        const countRes = await fetch("/api/student/communiques/count", { credentials: "include" })
        if (countRes.ok) {
          const countData = await countRes.json()
          setUnreadCommuniques(countData.unread || 0)
        }
      } catch {}
    }
    window.addEventListener("communiqueRead", handleRead)
    return () => window.removeEventListener("communiqueRead", handleRead)
  }, [])

  useEffect(() => {
    if (!schoolId) return
    const channel = supabaseBrowser
      .channel(`communiques:school:${schoolId}`)
      .on("broadcast", { event: "new_communique" }, () => {
        setUnreadCommuniques((prev) => prev + 1)
        void showSystemNotification("Kelasi 360", "Nouveau communiqué", { url: "/student/communiques" })
      })
      .subscribe()
    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [schoolId])

  useEffect(() => {
    if (!student?.studentId) return
    const channel = supabaseBrowser
      .channel(`fees:student:${student.studentId}`)
      .on("broadcast", { event: "payment_received" }, () => {
        setFeePulse(true)
        void showSystemNotification("Kelasi 360", "Paiement enregistré", { url: "/student/fees" })
        window.dispatchEvent(new Event("feePaymentReceived"))
      })
      .subscribe()
    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [student?.studentId])

  useEffect(() => {
    if (!student?.classId) return
    const channel = supabaseBrowser
      .channel(`tasks:class:${student.classId}`)
      .on("broadcast", { event: "new_task" }, () => {
        void showSystemNotification("Kelasi 360", "Nouvelle tâche assignée", { url: "/student/tasks" })
        window.dispatchEvent(new Event("newTaskReceived"))
      })
      .subscribe()
    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [student?.classId])

  useEffect(() => {
    if (pathname === "/student/fees") setFeePulse(false)
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

  const totalUnread = unreadCommuniques + unreadNotifications

  const sidebarProfile = student
    ? {
        school: student.school,
        fullName: student.fullName,
        firstName: student.firstName,
        className: student.className,
        photoUrl: student.photoUrl,
      }
    : null

  return (
    <div className={cn("min-h-screen transition-colors", bg, desktopBg)}>
      <StudentSidebar
        profile={sidebarProfile}
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        unreadMessages={totalUnread}
        feePulse={feePulse}
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
        <StudentHeader
          schoolName={student?.school}
          photoUrl={student?.photoUrl}
          firstName={student?.firstName}
          unreadCount={totalUnread}
          isDark={isDark}
        />

        <StudentDesktopHeader
          photoUrl={student?.photoUrl}
          firstName={student?.firstName}
          unreadCount={totalUnread}
          isDark={isDark}
        />

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2 lg:max-w-5xl lg:px-6 lg:pb-8 lg:pt-6 xl:max-w-6xl xl:px-8">
          <RouteTransition>{children}</RouteTransition>
        </main>

        <StudentBottomNav feePulse={feePulse} isDark={isDark} />
      </div>
    </div>
  )
}

function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(false)
    const id = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(id)
  }, [pathname])

  return (
    <div className={cn("transform transition-all duration-300 ease-out", visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0")}>
      {children}
    </div>
  )
}
