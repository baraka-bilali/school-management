"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Users,
  Wallet,
  Megaphone,
  Menu,
  UserPlus,
} from "lucide-react"

type BottomNavItem = {
  href?: string
  label: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
  action?: "more"
}

interface AdminBottomNavProps {
  role: string | null
  theme: "light" | "dark"
  canEnrollStudents?: boolean
  onMore: () => void
}

const ADMIN_ROLES = new Set([
  "ADMIN",
  "COMPTABLE",
  "DIRECTEUR_DISCIPLINE",
  "DIRECTEUR_ETUDES",
])

export default function AdminBottomNav({
  role,
  theme,
  canEnrollStudents = false,
  onMore,
}: AdminBottomNavProps) {
  const pathname = usePathname()
  const isDark = theme === "dark"

  if (!role) return null

  let items: BottomNavItem[] = []

  if (role === "CAISSIER") {
    items = [
      {
        href: "/admin/fees",
        label: "Caisse",
        icon: Wallet,
        match: (p) => p.startsWith("/admin/fees"),
      },
      ...(canEnrollStudents
        ? [
            {
              href: "/admin/inscriptions",
              label: "Inscription",
              icon: UserPlus,
              match: (p: string) => p.startsWith("/admin/inscriptions"),
            } as BottomNavItem,
          ]
        : []),
      { label: "Plus", icon: Menu, action: "more" },
    ]
  } else if (ADMIN_ROLES.has(role)) {
    items = [
      {
        href: "/admin",
        label: "Accueil",
        icon: BarChart3,
        match: (p) => p === "/admin",
      },
      {
        href: "/admin/users",
        label: "Utilisateurs",
        icon: Users,
        match: (p) => p.startsWith("/admin/users") || p.startsWith("/admin/students"),
      },
      {
        href: "/admin/fees",
        label: "Frais",
        icon: Wallet,
        match: (p) => p.startsWith("/admin/fees"),
      },
      {
        href: "/admin/communiques",
        label: "Messages",
        icon: Megaphone,
        match: (p) => p.startsWith("/admin/communiques"),
      },
      { label: "Plus", icon: Menu, action: "more" },
    ]
  } else {
    return null
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden ${
        isDark ? "border-gray-800 bg-gray-950/95" : "border-gray-100 bg-white/95"
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around py-1.5">
        {items.map((item) => {
          const active = item.match ? item.match(pathname || "") : false
          const Icon = item.icon

          const content = (
            <>
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  active
                    ? `text-white shadow-md shadow-indigo-600/30 ${isDark ? "bg-indigo-500" : "bg-indigo-600"}`
                    : ""
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span className={`text-[10px] font-medium leading-none ${active ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </>
          )

          const baseClasses = `relative flex min-w-[3.75rem] flex-col items-center gap-1 rounded-2xl px-2 py-1 transition-colors ${
            active
              ? isDark
                ? "text-indigo-400"
                : "text-indigo-600"
              : isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-400 hover:text-gray-600"
          }`

          if (item.action === "more") {
            return (
              <button key={item.label} type="button" onClick={onMore} className={baseClasses}>
                {content}
              </button>
            )
          }

          return (
            <Link key={item.href} href={item.href!} className={baseClasses}>
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
