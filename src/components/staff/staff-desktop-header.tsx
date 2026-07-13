"use client"

import Link from "next/link"
import { Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

export default function StaffDesktopHeader({
  firstName,
  unreadCount = 0,
  isDark = false,
}: {
  firstName?: string
  unreadCount?: number
  isDark?: boolean
}) {
  const initials = firstName?.charAt(0)?.toUpperCase() || "P"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden border-b backdrop-blur-md lg:block",
        isDark ? "border-white/5 bg-[#0a0a12]/90" : "border-gray-100 bg-[#eef2f9]/90"
      )}
    >
      <div className="flex h-14 items-center justify-end gap-3 px-6 xl:px-8">
        <Link
          href="/staff/messages"
          onMouseDown={() => window.dispatchEvent(new Event("staffMessagesUpdated"))}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            isDark ? "text-gray-300 hover:bg-white/10" : "text-indigo-600 hover:bg-white"
          )}
        >
          <Megaphone className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white ring-2 ring-indigo-500/30">
          {initials}
        </div>
      </div>
    </header>
  )
}
