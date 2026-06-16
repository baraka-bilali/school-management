"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentDesktopHeaderProps {
  photoUrl?: string | null
  firstName?: string
  unreadCount?: number
  isDark?: boolean
}

export default function StudentDesktopHeader({
  photoUrl,
  firstName,
  unreadCount = 0,
  isDark = false,
}: StudentDesktopHeaderProps) {
  const initials = firstName?.charAt(0)?.toUpperCase() || "É"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden border-b backdrop-blur-md lg:block",
        isDark ? "border-white/5 bg-[#0a0a12]/90" : "border-gray-100 bg-[#eef2f9]/90"
      )}
    >
      <div className="flex h-14 items-center justify-end gap-3 px-6 xl:px-8">
        <Link
          href="/student/notifications"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            isDark ? "text-gray-300 hover:bg-white/10" : "text-indigo-600 hover:bg-white"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link href="/student/settings">
          <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
            {photoUrl ? (
              <img src={photoUrl} alt={firstName || "Profil"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-sm font-bold text-white">
                {initials}
              </div>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
