import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Users,
  GraduationCap,
  Wallet,
  Landmark,
  Megaphone,
  CreditCard,
  Calendar,
  FileText,
  Settings,
  Bell,
  UserPlus,
  Banknote,
  BookOpen,
  UserRound,
  UsersRound,
  Briefcase,
  ArrowDownCircle,
  Receipt,
  Layers,
  ClipboardList,
  Link2,
  LayoutDashboard,
  ListOrdered,
} from "lucide-react"

export type FeatureSearchCategory =
  | "all"
  | "overview"
  | "users"
  | "classes"
  | "finance"
  | "communication"
  | "account"
  | "coming"

export const FEATURE_SEARCH_CATEGORIES: Array<{
  id: FeatureSearchCategory
  label: string
}> = [
  { id: "all", label: "Tout" },
  { id: "overview", label: "Aperçu" },
  { id: "users", label: "Utilisateurs" },
  { id: "classes", label: "Classes" },
  { id: "finance", label: "Finances" },
  { id: "communication", label: "Communication" },
  { id: "account", label: "Compte" },
  { id: "coming", label: "Bientôt" },
]

export interface FeatureSearchItem {
  id: string
  title: string
  subtitle: string
  href: string
  category: Exclude<FeatureSearchCategory, "all">
  keywords: string[]
  icon: LucideIcon
  /** Roles that can see this feature. Empty = all authenticated school users in layout. */
  roles: string[]
  comingSoon?: boolean
  /** Requires canEnrollStudents for CAISSIER */
  requiresEnrollPermission?: boolean
  popular?: boolean
}

const ADMIN_LIKE = [
  "ADMIN",
  "COMPTABLE",
  "DIRECTEUR_DISCIPLINE",
  "DIRECTEUR_ETUDES",
  "DIRECTEUR_ADJOINT",
]

const ADMIN_AND_CASHIER = [...ADMIN_LIKE, "CAISSIER"]

export const FEATURE_SEARCH_ITEMS: FeatureSearchItem[] = [
  // Aperçu
  {
    id: "admin-dashboard",
    title: "Tableau de bord",
    subtitle: "Aperçu",
    href: "/admin",
    category: "overview",
    keywords: ["dashboard", "accueil", "statistiques", "overview"],
    icon: BarChart3,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "student-dashboard",
    title: "Tableau de bord",
    subtitle: "Espace élève",
    href: "/student",
    category: "overview",
    keywords: ["dashboard", "accueil", "eleve"],
    icon: BarChart3,
    roles: ["ELEVE"],
    popular: true,
  },

  // Utilisateurs
  {
    id: "admin-users",
    title: "Utilisateurs",
    subtitle: "Gestion des comptes",
    href: "/admin/users",
    category: "users",
    keywords: ["users", "personnes", "comptes"],
    icon: Users,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "admin-students",
    title: "Élèves",
    subtitle: "Utilisateurs",
    href: "/admin/users?tab=students",
    category: "users",
    keywords: ["eleves", "students", "inscriptions", "matricule"],
    icon: UserRound,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "admin-parents",
    title: "Parents",
    subtitle: "Utilisateurs",
    href: "/admin/users?tab=parents",
    category: "users",
    keywords: ["parents", "tuteurs", "famille", "enfants"],
    icon: Users,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-teachers",
    title: "Enseignants",
    subtitle: "Utilisateurs",
    href: "/admin/users?tab=teachers",
    category: "users",
    keywords: ["profs", "teachers", "enseignants"],
    icon: UsersRound,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-staff",
    title: "Personnel",
    subtitle: "Utilisateurs",
    href: "/admin/users?tab=staff",
    category: "users",
    keywords: ["staff", "personnel", "employes", "caissier"],
    icon: Briefcase,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-courses",
    title: "Cours & Affectations",
    subtitle: "Utilisateurs",
    href: "/admin/users?tab=courses",
    category: "users",
    keywords: ["cours", "matieres", "attributions", "courses", "affectations"],
    icon: BookOpen,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "admin-subjects",
    title: "Matières / Cours",
    subtitle: "Cours & Affectations",
    href: "/admin/users?tab=courses",
    category: "users",
    keywords: ["matieres", "cours", "coefficient", "horaires", "subjects"],
    icon: BookOpen,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-assignments",
    title: "Affectations professeurs",
    subtitle: "Cours & Affectations",
    href: "/admin/users?tab=courses&view=assignments",
    category: "users",
    keywords: ["affectations", "assignations", "professeur", "classe", "heures"],
    icon: Link2,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "admin-promotions",
    title: "Passages & réinscriptions",
    subtitle: "Conseil de classe",
    href: "/admin/promotions",
    category: "users",
    keywords: ["passage", "redoublement", "conseil de classe", "propositions", "fin annee"],
    icon: GraduationCap,
    roles: ["ADMIN", "DIRECTEUR_ETUDES", "DIRECTEUR_DISCIPLINE"],
  },
  {
    id: "admin-inscriptions",
    title: "Inscription d'élèves",
    subtitle: "Utilisateurs",
    href: "/admin/inscriptions",
    category: "users",
    keywords: ["inscription", "enroll", "nouvel eleve"],
    icon: UserPlus,
    roles: [...ADMIN_LIKE, "CAISSIER"],
    requiresEnrollPermission: true,
  },

  // Classes
  {
    id: "admin-classes",
    title: "Classes & Filières",
    subtitle: "Organisation scolaire",
    href: "/admin/classes",
    category: "classes",
    keywords: ["classes", "filieres", "sections", "maternelle", "primaire"],
    icon: GraduationCap,
    roles: ADMIN_LIKE,
    popular: true,
  },

  // Finances
  {
    id: "admin-fees",
    title: "Frais scolaires",
    subtitle: "Finances",
    href: "/admin/fees",
    category: "finance",
    keywords: ["frais", "paiement", "caisse", "fees", "argent"],
    icon: Wallet,
    roles: ADMIN_AND_CASHIER,
    popular: true,
  },
  {
    id: "admin-fees-overview",
    title: "Vue d'ensemble des frais",
    subtitle: "Frais scolaires",
    href: "/admin/fees?tab=overview",
    category: "finance",
    keywords: ["apercu frais", "stats frais", "progression"],
    icon: LayoutDashboard,
    roles: ADMIN_AND_CASHIER,
  },
  {
    id: "admin-fees-types",
    title: "Types de frais",
    subtitle: "Frais scolaires",
    href: "/admin/fees?tab=types",
    category: "finance",
    keywords: ["type frais", "nouveau frais", "tarifs"],
    icon: Layers,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-fees-tarifs",
    title: "Tarifications",
    subtitle: "Frais scolaires",
    href: "/admin/fees?tab=tarifications",
    category: "finance",
    keywords: ["tarification", "montant", "classe", "prix"],
    icon: ListOrdered,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-fees-students",
    title: "Frais par élève",
    subtitle: "Frais scolaires",
    href: "/admin/fees?tab=students",
    category: "finance",
    keywords: ["par eleve", "soldes", "impayes", "encaisser"],
    icon: ClipboardList,
    roles: ADMIN_AND_CASHIER,
    popular: true,
  },
  {
    id: "admin-fees-payments",
    title: "Historique des paiements",
    subtitle: "Frais scolaires",
    href: "/admin/fees?tab=payments",
    category: "finance",
    keywords: ["paiements", "historique", "recu", "transactions"],
    icon: Receipt,
    roles: ADMIN_AND_CASHIER,
  },
  {
    id: "admin-treasury",
    title: "Trésorerie",
    subtitle: "Finances",
    href: "/admin/treasury",
    category: "finance",
    keywords: ["tresorerie", "caisse", "flux", "budget"],
    icon: Landmark,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "admin-treasury-outflows",
    title: "Sorties de trésorerie",
    subtitle: "Trésorerie",
    href: "/admin/treasury?view=outflows",
    category: "finance",
    keywords: ["depenses", "sorties", "salaires", "outflows"],
    icon: ArrowDownCircle,
    roles: ADMIN_LIKE,
  },
  {
    id: "admin-salary",
    title: "Portefeuille / salaires",
    subtitle: "Finances",
    href: "/admin/salary",
    category: "finance",
    keywords: ["salaire", "portefeuille", "wallet", "paiement salaire"],
    icon: Banknote,
    roles: ["CAISSIER", ...ADMIN_LIKE],
  },
  {
    id: "student-fees",
    title: "Mes frais scolaires",
    subtitle: "Espace élève",
    href: "/student/fees",
    category: "finance",
    keywords: ["frais", "paiement", "scolaire"],
    icon: Wallet,
    roles: ["ELEVE"],
    popular: true,
  },

  // Communication
  {
    id: "admin-communiques",
    title: "Communiqués",
    subtitle: "Communication",
    href: "/admin/communiques",
    category: "communication",
    keywords: ["annonces", "messages", "communiques", "news"],
    icon: Megaphone,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "student-communiques",
    title: "Communiqués",
    subtitle: "Espace élève",
    href: "/student/communiques",
    category: "communication",
    keywords: ["annonces", "messages", "communiques"],
    icon: Megaphone,
    roles: ["ELEVE"],
    popular: true,
  },
  {
    id: "admin-notifications",
    title: "Notifications",
    subtitle: "Communication",
    href: "/admin/notifications",
    category: "communication",
    keywords: ["alertes", "notifications", "cloche"],
    icon: Bell,
    roles: ADMIN_AND_CASHIER,
  },

  // Compte
  {
    id: "admin-subscription",
    title: "Abonnement",
    subtitle: "Compte école",
    href: "/admin/subscription",
    category: "account",
    keywords: ["abonnement", "subscription", "renouveler", "facture"],
    icon: CreditCard,
    roles: ADMIN_LIKE,
    popular: true,
  },
  {
    id: "admin-settings",
    title: "Paramètres",
    subtitle: "Compte école",
    href: "/admin/settings",
    category: "account",
    keywords: ["settings", "configuration", "ecole", "logo"],
    icon: Settings,
    roles: ADMIN_LIKE,
  },
  {
    id: "student-settings",
    title: "Paramètres",
    subtitle: "Espace élève",
    href: "/student/settings",
    category: "account",
    keywords: ["settings", "profil", "mot de passe"],
    icon: Settings,
    roles: ["ELEVE"],
  },
  {
    id: "admin-payments-journal",
    title: "Journal des paiements d'abonnement",
    subtitle: "Abonnement",
    href: "/admin/subscription",
    category: "account",
    keywords: ["facture", "paiement abonnement", "journal"],
    icon: Receipt,
    roles: ADMIN_LIKE,
  },

  // Bientôt
  {
    id: "admin-schedule",
    title: "Horaire",
    subtitle: "Bientôt disponible",
    href: "/admin/schedule",
    category: "coming",
    keywords: ["horaire", "emploi du temps", "schedule"],
    icon: Calendar,
    roles: ADMIN_LIKE,
    comingSoon: true,
  },
  {
    id: "admin-grades",
    title: "Notes & Bulletins",
    subtitle: "Cycles, maxima et cotations",
    href: "/admin/grades",
    category: "overview",
    keywords: ["notes", "bulletins", "grades", "resultats", "cotation", "maxima"],
    icon: FileText,
    roles: ADMIN_LIKE,
  },
  {
    id: "student-schedule",
    title: "Horaire des cours",
    subtitle: "Bientôt disponible",
    href: "/student/schedule",
    category: "coming",
    keywords: ["horaire", "cours", "schedule"],
    icon: Calendar,
    roles: ["ELEVE"],
    comingSoon: true,
  },
  {
    id: "student-grades",
    title: "Notes & Bulletins",
    subtitle: "Bientôt disponible",
    href: "/student/grades",
    category: "coming",
    keywords: ["notes", "bulletins", "grades"],
    icon: FileText,
    roles: ["ELEVE"],
    comingSoon: true,
  },
]

export function getFeatureSearchItemsForRole(
  role: string | null | undefined,
  options?: { canEnrollStudents?: boolean }
): FeatureSearchItem[] {
  const r = role || "ADMIN"
  const canEnroll = !!options?.canEnrollStudents

  return FEATURE_SEARCH_ITEMS.filter((item) => {
    if (!item.roles.includes(r)) return false
    if (item.requiresEnrollPermission && r === "CAISSIER" && !canEnroll) return false
    // Inscriptions for admin-like: allow ADMIN and DIRECTEUR_ETUDES freely; others ok too per API
    return true
  })
}

export function filterFeatureSearchItems(
  items: FeatureSearchItem[],
  query: string,
  category: FeatureSearchCategory
): FeatureSearchItem[] {
  const q = query.trim().toLowerCase()
  const byCategory =
    category === "all" ? items : items.filter((item) => item.category === category)

  if (!q) {
    const popular = byCategory.filter((i) => i.popular)
    // Show popular first, then fill with other items for richer browsing
    if (popular.length === 0) return byCategory.slice(0, 12)
    const rest = byCategory.filter((i) => !i.popular)
    return [...popular, ...rest].slice(0, 14)
  }

  return byCategory
    .map((item) => {
      const haystack = [item.title, item.subtitle, ...item.keywords]
        .join(" ")
        .toLowerCase()
      const score =
        (item.title.toLowerCase().startsWith(q) ? 30 : 0) +
        (item.title.toLowerCase().includes(q) ? 20 : 0) +
        (haystack.includes(q) ? 10 : 0) +
        (item.keywords.some((k) => k.toLowerCase().startsWith(q)) ? 15 : 0) +
        (item.popular ? 2 : 0)
      return { item, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, "fr"))
    .map((x) => x.item)
}
