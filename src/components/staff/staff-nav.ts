import {
  LayoutGrid,
  Wallet,
  Megaphone,
  Calendar,
  type LucideIcon,
} from "lucide-react"

export interface StaffNavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  badgeKey?: "messages" | "wallet"
}

export const staffNavItems: StaffNavItem[] = [
  {
    href: "/staff",
    label: "Accueil",
    icon: LayoutGrid,
    match: (p) => p === "/staff",
  },
  {
    href: "/staff/calendar",
    label: "Calendrier",
    icon: Calendar,
    match: (p) => p.startsWith("/staff/calendar"),
  },
  {
    href: "/staff/wallet",
    label: "Portefeuille",
    icon: Wallet,
    match: (p) => p.startsWith("/staff/wallet"),
    badgeKey: "wallet",
  },
  {
    href: "/staff/messages",
    label: "Communiqués",
    icon: Megaphone,
    match: (p) =>
      p.startsWith("/staff/messages") || p.startsWith("/staff/communiques"),
    badgeKey: "messages",
  },
]

export const staffMobileNavItems = staffNavItems
