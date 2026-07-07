import {
  LayoutGrid,
  GraduationCap,
  Wallet,
  ClipboardList,
  Bell,
  User,
  type LucideIcon,
} from "lucide-react"

export interface TeacherNavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  badgeKey?: "messages" | "wallet"
}

export const teacherNavItems: TeacherNavItem[] = [
  {
    href: "/teacher",
    label: "Accueil",
    icon: LayoutGrid,
    match: (p) => p === "/teacher",
  },
  {
    href: "/teacher/classes",
    label: "Classes",
    icon: GraduationCap,
    match: (p) => p.startsWith("/teacher/classes"),
  },
  {
    href: "/teacher/wallet",
    label: "Portefeuille",
    icon: Wallet,
    match: (p) => p.startsWith("/teacher/wallet"),
    badgeKey: "wallet",
  },
  {
    href: "/teacher/tasks",
    label: "Tâches",
    icon: ClipboardList,
    match: (p) => p.startsWith("/teacher/tasks"),
  },
  {
    href: "/teacher/messages",
    label: "Messages",
    icon: Bell,
    match: (p) =>
      p.startsWith("/teacher/messages") || p.startsWith("/teacher/communiques"),
    badgeKey: "messages",
  },
  {
    href: "/teacher/settings",
    label: "Profil",
    icon: User,
    match: (p) => p.startsWith("/teacher/settings"),
  },
]

export const teacherMobileNavItems = teacherNavItems.filter(
  (item) => item.href !== "/teacher/messages"
)
