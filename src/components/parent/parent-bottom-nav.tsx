"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { parentMobileNavItems } from "./parent-nav"

interface ParentBottomNavProps {
  isDark?: boolean
}

export default function ParentBottomNav({ isDark = false }: ParentBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
        isDark ? "border-gray-800 bg-gray-950/95" : "border-gray-100 bg-white/95"
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {parentMobileNavItems.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-[4rem] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 transition-colors",
                active
                  ? isDark ? "text-indigo-400" : "text-indigo-600"
                  : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  active && cn("text-white shadow-md shadow-indigo-600/30", isDark ? "bg-indigo-500" : "bg-indigo-600")
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className={cn("text-[10px] font-medium leading-none", active && "font-semibold")}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
