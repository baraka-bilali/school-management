"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { teacherNavItems } from "./teacher-nav"

export interface TeacherSidebarProfile {
  school: string
  fullName: string
  firstName: string
  subtitle?: string
}

export default function TeacherSidebar({
  profile,
  expanded = true,
  onToggle,
  unreadMessages = 0,
  walletPulse = false,
  onLogout,
  loggingOut = false,
  isDark = false,
}: {
  profile: TeacherSidebarProfile | null
  expanded?: boolean
  onToggle?: () => void
  unreadMessages?: number
  walletPulse?: boolean
  onLogout?: () => void
  loggingOut?: boolean
  isDark?: boolean
}) {
  const pathname = usePathname()
  const initials = profile?.firstName?.charAt(0)?.toUpperCase() || "P"

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-300 ease-in-out lg:flex",
        expanded ? "w-64 xl:w-72" : "w-[4.25rem]",
        isDark ? "border-white/5 bg-[#12121a]" : "border-gray-200 bg-white"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b",
          expanded ? "justify-between px-4 py-4" : "justify-center px-2 py-4",
          isDark ? "border-white/5" : "border-gray-100"
        )}
      >
        {expanded && (
          <p className={cn("min-w-0 truncate pr-2 text-sm font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>
            {profile?.school || "Mon école"}
          </p>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
              isDark ? "text-gray-400 hover:bg-white/10 hover:text-gray-200" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            )}
          >
            <PanelLeft className={cn("h-5 w-5 transition-transform", !expanded && "scale-x-[-1]")} />
          </button>
        )}
      </div>

      {profile && (
        <div className={cn("shrink-0 border-b", expanded ? "flex items-center gap-3 px-4 py-4" : "flex justify-center py-3", isDark ? "border-white/5" : "border-gray-100")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {initials}
          </div>
          {expanded && (
            <div className="min-w-0">
              <p className={cn("truncate text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>{profile.fullName}</p>
              {profile.subtitle && (
                <p className={cn("truncate text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{profile.subtitle}</p>
              )}
            </div>
          )}
        </div>
      )}

      <nav className={cn("flex-1 space-y-1 overflow-y-auto py-3", expanded ? "px-3" : "px-2")}>
        {teacherNavItems.map(({ href, label, icon: Icon, match, badgeKey }) => {
          const active = match(pathname)
          const showMsgBadge = badgeKey === "messages" && unreadMessages > 0 && !active
          const showWalletPulse = badgeKey === "wallet" && walletPulse && !active

          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "relative flex items-center rounded-xl text-sm font-medium transition-colors",
                expanded ? "gap-3 px-3 py-3" : "justify-center px-0 py-3",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : isDark ? "text-gray-400 hover:bg-white/5 hover:text-gray-200" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
              </span>
              {expanded && (
                <>
                  <span className="truncate">{label}</span>
                  {showMsgBadge && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                  {showWalletPulse && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-green-500" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {onLogout && (
        <div className={cn("shrink-0 border-t p-2", isDark ? "border-white/5" : "border-gray-100")}>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className={cn(
              "flex w-full items-center rounded-xl text-sm font-medium transition-colors",
              expanded ? "gap-3 px-3 py-3" : "justify-center py-3",
              isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {expanded && (loggingOut ? "Déconnexion..." : "Déconnexion")}
          </button>
        </div>
      )}
    </aside>
  )
}
