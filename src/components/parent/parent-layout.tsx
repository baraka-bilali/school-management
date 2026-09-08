"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import ParentHeader from "./parent-header"
import ParentDesktopHeader from "./parent-desktop-header"
import ParentSidebar from "./parent-sidebar"
import ParentBottomNav from "./parent-bottom-nav"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "./parent-context"
import { getSupabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isDark, bg, desktopBg, toggleTheme, theme } = useTeacherTheme()
  const { parent: me } = useParentMe()
  const [unread, setUnread] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("parent-sidebar-open")
    if (saved !== null) setSidebarExpanded(saved === "true")
  }, [])

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev
      localStorage.setItem("parent-sidebar-open", String(next))
      return next
    })
  }

  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await fetch("/api/parent/communiques/count", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setUnread(data.unread || 0)
        }
      } catch {}
    }
    void loadCount()
    const onRead = () => void loadCount()
    window.addEventListener("parentCommuniqueRead", onRead)
    return () => window.removeEventListener("parentCommuniqueRead", onRead)
  }, [])

  useEffect(() => {
    if (!me?.schoolId) return
    const channel = getSupabaseBrowser()
      .channel(`communiques:school:${me.schoolId}`)
      .on("broadcast", { event: "new_communique" }, ({ payload }) => {
        if (payload?.targetParents !== true) return
        setUnread((p) => p + 1)
        void showSystemNotification("Kelasi 360", "Nouveau communiqué", {
          url: "/parent/messages",
        })
      })
      .subscribe()
    return () => {
      getSupabaseBrowser().removeChannel(channel)
    }
  }, [me?.schoolId])

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

  const childrenCount = me?.children?.length ?? 0
  const sidebarProfile = me
    ? {
        school: me.school || "Mon école",
        fullName: `${me.lastName} ${me.middleName || ""} ${me.firstName}`.replace(/\s+/g, " ").trim(),
        firstName: me.firstName,
        childrenLabel:
          childrenCount > 0
            ? `${childrenCount} enfant${childrenCount > 1 ? "s" : ""}`
            : "Espace parent",
      }
    : null

  return (
    <div className={cn("min-h-dvh transition-colors", bg, desktopBg)}>
      <ParentSidebar
        profile={sidebarProfile}
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        unreadCommuniques={unread}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        isDark={isDark}
      />

      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-300 ease-in-out",
          sidebarExpanded ? "lg:pl-64 xl:pl-72" : "lg:pl-[4.25rem]"
        )}
      >
        <ParentHeader
          schoolName={me?.school || "Mon école"}
          firstName={me?.firstName}
          unreadCount={unread}
          isDark={isDark}
          onToggleTheme={() => toggleTheme(theme === "dark" ? "light" : "dark")}
        />

        <ParentDesktopHeader
          firstName={me?.firstName}
          unreadCount={unread}
          isDark={isDark}
          onToggleTheme={() => toggleTheme(theme === "dark" ? "light" : "dark")}
        />

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2 lg:max-w-5xl lg:px-6 lg:pb-8 lg:pt-6 xl:max-w-6xl xl:px-8">
          <RouteTransition>{children}</RouteTransition>
        </main>

        <ParentBottomNav isDark={isDark} unreadCommuniques={unread} />
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
    <div
      className={cn(
        "transform transition-all duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      )}
    >
      {children}
    </div>
  )
}
