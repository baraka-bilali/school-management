"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { studentNavItems } from "./student-nav"

export interface StudentSidebarProfile {
  school: string
  fullName: string
  firstName: string
  className?: string
  photoUrl?: string | null
}

interface StudentSidebarProps {
  profile: StudentSidebarProfile | null
  open?: boolean
  unreadMessages?: number
  feePulse?: boolean
  onLogout?: () => void
  loggingOut?: boolean
  isDark?: boolean
}

export default function StudentSidebar({
  profile,
  open = true,
  unreadMessages = 0,
  feePulse = false,
  onLogout,
  loggingOut = false,
  isDark = false,
}: StudentSidebarProps) {
  const pathname = usePathname()
  const initials = profile?.firstName?.charAt(0)?.toUpperCase() || "É"

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col overflow-hidden border-r transition-[width] duration-300 ease-in-out lg:flex",
        open ? "w-64 xl:w-72" : "w-0 border-r-0",
        isDark
          ? "border-white/5 bg-[#12121a]"
          : "border-gray-200 bg-white"
      )}
    >
      <div className={cn("flex h-full w-64 shrink-0 flex-col xl:w-72", !open && "invisible")}>
      <div className={cn("border-b px-5 py-5", isDark ? "border-white/5" : "border-gray-100")}>
        <p className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>
          {profile?.school || "Mon école"}
        </p>
      </div>

      {profile && (
        <div className={cn("flex items-center gap-3 border-b px-5 py-4", isDark ? "border-white/5" : "border-gray-100")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>
              {profile.fullName}
            </p>
            {profile.className && (
              <p className={cn("truncate text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {profile.className}
              </p>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {studentNavItems.map(({ href, label, icon: Icon, match, badgeKey }) => {
          const active = match(pathname)
          const showMsgBadge = badgeKey === "messages" && unreadMessages > 0 && !active
          const showFeePulse = badgeKey === "fees" && feePulse && !active

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : isDark
                    ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span>{label}</span>
              {showMsgBadge && (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
              {showFeePulse && (
                <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-green-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {onLogout && (
        <div className={cn("border-t p-3", isDark ? "border-white/5" : "border-gray-100")}>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              isDark
                ? "text-red-400 hover:bg-red-500/10"
                : "text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className="h-5 w-5" />
            {loggingOut ? "Déconnexion..." : "Déconnexion"}
          </button>
        </div>
      )}
      </div>
    </aside>
  )
}
