"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface TeacherHeaderProps {
  schoolName?: string
  firstName?: string
  unreadCount?: number
  isDark?: boolean
}

export default function TeacherHeader({
  schoolName = "Mon école",
  firstName,
  unreadCount = 0,
  isDark = false,
}: TeacherHeaderProps) {
  const initials = firstName?.charAt(0)?.toUpperCase() || "P"

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md lg:hidden",
        isDark ? "border-gray-800 bg-gray-950/90" : "border-gray-100 bg-[#eef2f9]/90"
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <Link href="/teacher/settings" className="shrink-0">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-2 shadow-sm",
              isDark ? "bg-indigo-900/50 text-indigo-300 ring-gray-800" : "bg-indigo-100 text-indigo-600 ring-white"
            )}
          >
            {initials}
          </div>
        </Link>
        <h1 className={cn("min-w-0 flex-1 truncate text-base font-bold tracking-tight", isDark ? "text-gray-100" : "text-gray-900")}>
          {schoolName}
        </h1>
        <Link
          href="/teacher/messages"
          onMouseDown={() => window.dispatchEvent(new Event("teacherMessagesUpdated"))}
          className={cn(
            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isDark ? "text-gray-300 hover:bg-gray-800" : "text-indigo-600 hover:bg-white"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
