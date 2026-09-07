import {
  LayoutGrid,
  Users,
  Megaphone,
  User,
  type LucideIcon,
} from "lucide-react"

export interface ParentNavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

export const parentNavItems: ParentNavItem[] = [
  {
    href: "/parent",
    label: "Accueil",
    icon: LayoutGrid,
    match: (p) => p === "/parent",
  },
  {
    href: "/parent/children",
    label: "Enfants",
    icon: Users,
    match: (p) => p.startsWith("/parent/children"),
  },
  {
    href: "/parent/messages",
    label: "Communiqués",
    icon: Megaphone,
    match: (p) => p.startsWith("/parent/messages"),
  },
  {
    href: "/parent/settings",
    label: "Profil",
    icon: User,
    match: (p) => p.startsWith("/parent/settings"),
  },
]

export const parentMobileNavItems = parentNavItems
