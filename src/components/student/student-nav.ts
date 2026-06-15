import {
  LayoutGrid,
  Wallet,
  ClipboardList,
  Bell,
  User,
  type LucideIcon,
} from "lucide-react"

export interface StudentNavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  badgeKey?: "messages" | "fees"
}

export const studentNavItems: StudentNavItem[] = [
  {
    href: "/student",
    label: "Accueil",
    icon: LayoutGrid,
    match: (p) => p === "/student",
  },
  {
    href: "/student/fees",
    label: "Frais",
    icon: Wallet,
    match: (p) => p.startsWith("/student/fees"),
    badgeKey: "fees",
  },
  {
    href: "/student/tasks",
    label: "Tâches",
    icon: ClipboardList,
    match: (p) => p.startsWith("/student/tasks"),
  },
  {
    href: "/student/notifications",
    label: "Messages",
    icon: Bell,
    match: (p) =>
      p.startsWith("/student/notifications") || p.startsWith("/student/communiques"),
    badgeKey: "messages",
  },
  {
    href: "/student/settings",
    label: "Profil",
    icon: User,
    match: (p) => p.startsWith("/student/settings"),
  },
]

/** Items shown in mobile bottom bar (4 slots) */
export const studentMobileNavItems = studentNavItems.filter(
  (item) => item.href !== "/student/notifications"
)
