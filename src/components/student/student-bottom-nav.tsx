"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { studentMobileNavItems } from "./student-nav"

interface StudentBottomNavProps {
  feePulse?: boolean
}

export default function StudentBottomNav({ feePulse = false }: StudentBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {studentMobileNavItems.map(({ href, label, icon: Icon, match, badgeKey }) => {
          const active = match(pathname)
          const showFeePulse = feePulse && badgeKey === "fees" && !active

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-colors",
                active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  active && "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
                {showFeePulse && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-950" />
                )}
              </span>
              <span className={cn("text-[10px] font-medium leading-none", active && "font-semibold")}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
