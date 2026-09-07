"use client"

import { cn } from "@/lib/utils"
import ParentHeader from "./parent-header"
import ParentBottomNav from "./parent-bottom-nav"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import { useParentMe } from "./parent-context"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { isDark, bg, desktopBg } = useTeacherTheme()
  const { parent: me } = useParentMe()

  return (
    <div className={cn("min-h-screen transition-colors", bg, desktopBg)}>
      <ParentHeader
        schoolName={me?.school || "Mon école"}
        firstName={me?.firstName}
        isDark={isDark}
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-2">
        {children}
      </main>

      <ParentBottomNav isDark={isDark} />
    </div>
  )
}
