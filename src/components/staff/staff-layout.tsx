"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"
import { cn } from "@/lib/utils"
import StaffHeader from "./staff-header"
import StaffDesktopHeader from "./staff-desktop-header"
import StaffSidebar from "./staff-sidebar"
import StaffBottomNav from "./staff-bottom-nav"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useStaffMe } from "./staff-context"

async function fetchMessageCounts(): Promise<number> {
  try {
    const commRes = await fetch("/api/staff/communiques/count", { credentials: "include", cache: "no-store" })
    if (commRes.ok) {
      return (await commRes.json()).unread || 0
    }
  } catch {
    /* ignore */
  }
  return 0
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isDark, bg, desktopBg } = useTeacherTheme()
  const { staff: me } = useStaffMe()
  const profile = me
    ? {
        firstName: me.firstName,
        fullName: `${me.lastName} ${me.firstName}`.replace(/\s+/g, " ").trim(),
        specialty: me.roleLabel,
        school: me.school || "Mon école",
        userId: me.userId,
        schoolId: me.schoolId,
      }
    : null
  const [unreadCommuniques, setUnreadCommuniques] = useState(0)
  const [walletPulse, setWalletPulse] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  const refreshCounts = useCallback(async () => {
    setUnreadCommuniques(await fetchMessageCounts())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("staff-sidebar-open")
    if (saved !== null) setSidebarExpanded(saved === "true")
  }, [])

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const next = !prev
      localStorage.setItem("staff-sidebar-open", String(next))
      return next
    })
  }

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  useEffect(() => {
    const handleMessagesUpdated = () => void refreshCounts()
    window.addEventListener("staffMessagesUpdated", handleMessagesUpdated)
    window.addEventListener("staffCommuniqueRead", handleMessagesUpdated)
    window.addEventListener("staffNewCommunique", handleMessagesUpdated)
    return () => {
      window.removeEventListener("staffMessagesUpdated", handleMessagesUpdated)
      window.removeEventListener("staffCommuniqueRead", handleMessagesUpdated)
      window.removeEventListener("staffNewCommunique", handleMessagesUpdated)
    }
  }, [refreshCounts])

  useEffect(() => {
    if (!profile?.userId) return
    const channel = getSupabaseBrowser()
      .channel(`payments:staff:${profile.userId}`)
      .on("broadcast", { event: "payment_received" }, (payload) => {
        setWalletPulse(true)
        const inv = (payload.payload as { invoiceNumber?: string })?.invoiceNumber
        void showSystemNotification(
          "Kelasi 360",
          inv ? `Paiement reçu — ${inv}` : "Paiement reçu",
          { url: "/staff/wallet" }
        )
        window.dispatchEvent(new Event("staffPaymentReceived"))
      })
      .subscribe()
    return () => { getSupabaseBrowser().removeChannel(channel) }
  }, [profile?.userId])

  useEffect(() => {
    if (!profile?.schoolId) return
    const channel = getSupabaseBrowser()
      .channel(`communiques:school:${profile.schoolId}`)
      .on("broadcast", { event: "new_communique" }, () => {
        setUnreadCommuniques((p) => p + 1)
        void showSystemNotification("Kelasi 360", "Nouveau communiqué", {
          url: "/staff/messages",
        })
        window.dispatchEvent(new Event("staffNewCommunique"))
      })
      .subscribe()
    return () => { getSupabaseBrowser().removeChannel(channel) }
  }, [profile?.schoolId])

  useEffect(() => {
    if (pathname === "/staff/wallet") setWalletPulse(false)
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
      <StaffSidebar
        profile={
          profile
            ? { school: profile.school, fullName: profile.fullName, firstName: profile.firstName, subtitle: profile.specialty }
            : null
        }
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        unreadMessages={unreadCommuniques}
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
        <StaffHeader
          schoolName={profile?.school}
          firstName={profile?.firstName}
          unreadCount={unreadCommuniques}
          isDark={isDark}
        />
        <StaffDesktopHeader firstName={profile?.firstName} unreadCount={unreadCommuniques} isDark={isDark} />

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2 lg:max-w-5xl lg:px-6 lg:pb-8 lg:pt-6 xl:max-w-6xl xl:px-8">
          {children}
        </main>

        <StaffBottomNav walletPulse={walletPulse} unreadMessages={unreadCommuniques} isDark={isDark} />
      </div>
    </div>
  )
}
