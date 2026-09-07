"use client"

import Link from "next/link"
import { Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParentHeaderProps {
  schoolName?: string
  firstName?: string
  isDark?: boolean
}

export default function ParentHeader({
  schoolName = "Mon école",
  firstName,
  isDark = false,
}: ParentHeaderProps) {
  const initials = firstName?.charAt(0)?.toUpperCase() || "P"

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md",
        isDark ? "border-gray-800 bg-gray-950/90" : "border-gray-100 bg-[#eef2f9]/90"
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <Link href="/parent/settings" className="shrink-0">
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
          href="/parent/messages"
          className={cn(
            "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            isDark ? "text-gray-300 hover:bg-gray-800" : "text-indigo-600 hover:bg-white"
          )}
        >
          <Megaphone className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}
