"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import ParentHeader from "./parent-header"
import ParentBottomNav from "./parent-bottom-nav"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "./parent-context"
import { getSupabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { isDark, bg, desktopBg } = useTeacherTheme()
  const { parent: me } = useParentMe()
  const [unread, setUnread] = useState(0)

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

  return (
    <div className={cn("min-h-dvh transition-colors", bg, desktopBg)}>
      <ParentHeader
        schoolName={me?.school || "Mon école"}
        firstName={me?.firstName}
        isDark={isDark}
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2">
        {children}
      </main>

      <ParentBottomNav isDark={isDark} unreadCommuniques={unread} />
    </div>
  )
}
