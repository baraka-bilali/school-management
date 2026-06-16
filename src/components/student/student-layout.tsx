"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, ClipboardList, Settings, LogOut } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-client"
import { playBing } from "@/lib/play-bing"
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

const menuLinks = [
  { href: "/student/tasks", label: "Mes tâches", icon: ClipboardList },
  { href: "/student/settings", label: "Paramètres", icon: Settings },
]

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const { isDark, bg, desktopBg } = useStudentTheme()
  const [menuOpen, setMenuOpen] = useState(false)
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

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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
        playBing()
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
        playBing()
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
        playBing()
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

  const showMenuButton = pathname === "/student"
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
          showMenu={showMenuButton}
          onMenuClick={() => setMenuOpen(true)}
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

        <StudentBottomNav feePulse={feePulse} />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className={cn("absolute left-0 top-0 flex h-full w-72 flex-col shadow-2xl", isDark ? "bg-gray-900" : "bg-white")}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <p className="font-bold text-gray-900 dark:text-gray-100">Menu</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {menuLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-gray-100 p-3 dark:border-gray-800">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                {loggingOut ? "Déconnexion..." : "Déconnexion"}
              </button>
            </div>
          </aside>
        </div>
      )}
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
