"use client"

import { useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Settings,
  LogOut,
  School,
  X,
  CreditCard,
  Calendar,
  FileText,
  Wallet,
  Landmark,
  Lock,
  Megaphone,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  subscriptionExpired?: boolean
  studentIsPremium?: boolean
  badgeCounts?: Record<string, number>
}

// Routes always accessible regardless of subscription
const ALWAYS_ALLOWED = ["/admin/subscription", "/admin/settings"]

export default function Sidebar({ isOpen, onToggle, subscriptionExpired = false, studentIsPremium = false, badgeCounts = {} }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))
  const [userRole, setUserRole] = useState<string>("ADMIN")
  const [canEnrollStudents, setCanEnrollStudents] = useState(false)
  const [schoolName, setSchoolName] = useState<string>("")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Charger le thème
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const savedSchoolName = localStorage.getItem("schoolName")
    if (savedSchoolName) setSchoolName(savedSchoolName)

    // Récupérer le rôle de l'utilisateur depuis le token
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUserRole(payload.role || "ADMIN")
        setCanEnrollStudents(!!payload.canEnrollStudents)
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error)
      }
    }

    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.role) setUserRole(data.user.role)
        if (typeof data?.user?.canEnrollStudents === "boolean") {
          setCanEnrollStudents(data.user.canEnrollStudents)
        }
      })
      .catch(() => {})

    // Écouter les changements de thème
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (currentTheme) {
        setTheme(currentTheme)
      }
      const currentSchoolName = localStorage.getItem("schoolName")
      if (currentSchoolName) setSchoolName(currentSchoolName)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChange", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChange", handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  type NavItem = { icon: LucideIcon; label: string; href: string; proOnly?: boolean; premiumOnly?: boolean }

  // Menu pour les administrateurs
  const adminNavItems: NavItem[] = [
    { icon: BarChart3, label: "Tableau de bord", href: "/admin" },
    { icon: Users, label: "Utilisateurs", href: "/admin/users" },
    { icon: GraduationCap, label: "Classes & Filières", href: "/admin/classes" },
    { icon: Wallet, label: "Frais scolaires", href: "/admin/fees" },
    { icon: Landmark, label: "Trésorerie", href: "/admin/treasury" },
    { icon: Megaphone, label: "Communiqués", href: "/admin/communiques" },
    { icon: CreditCard, label: "Abonnement", href: "/admin/subscription" },
    { icon: Calendar, label: "Horaire", href: "/admin/schedule", proOnly: true },
    { icon: FileText, label: "Notes & Bulletins", href: "/admin/grades", proOnly: true },
  ]

  // Menu caissier (POS — encaissement uniquement)
  const cashierNavItems: NavItem[] = [
    { icon: Wallet, label: "Frais scolaires", href: "/admin/fees" },
    ...(canEnrollStudents
      ? [{ icon: UserPlus, label: "Inscription", href: "/admin/inscriptions" }]
      : []),
  ]

  // Menu pour les élèves
  const studentNavItems: NavItem[] = [
    { icon: BarChart3, label: "Tableau de bord", href: "/student" },
    { icon: Calendar, label: "Horaire des cours", href: "/student/schedule", premiumOnly: true },
    { icon: FileText, label: "Notes & Bulletins", href: "/student/grades", premiumOnly: true },
    { icon: Wallet, label: "Frais scolaires", href: "/student/fees" },
    { icon: Megaphone, label: "Communiqués", href: "/student/communiques" },
  ]

  // Sélectionner le menu selon le rôle
  const navItems =
    userRole === "ELEVE"
      ? studentNavItems
      : userRole === "CAISSIER"
        ? cashierNavItems
        : adminNavItems
  const basePath = userRole === "ELEVE" ? "/student" : "/admin"

  // For non-premium students, completely hide premium-only items
  const visibleNavItems = navItems.filter(item =>
    !(item as NavItem).premiumOnly || studentIsPremium
  )

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath
    return pathname?.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      // Clear HttpOnly cookie on server
      await fetch("/api/auth/logout", { method: "POST" })
      // Clear any client-side token fallback
      localStorage.removeItem("token")
      localStorage.removeItem("schoolName")
      // Attendre un peu pour montrer l'animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowLogoutModal(false)
      // Forcer un rechargement complet pour éviter les problèmes de cache
      window.location.href = "/login"
    } catch (error) {
      console.error(error)
      setLoggingOut(false)
    }
  }

  type AdminItem =
    | { icon: LucideIcon; label: string; href: string }
    | { icon: LucideIcon; label: string; key: "logout" }
  
  // Items de pied de page (Paramètres + Déconnexion) selon le rôle
  const adminItems: AdminItem[] =
    userRole === "CAISSIER"
      ? [{ icon: LogOut, label: "Déconnexion", key: "logout" }]
      : [
          { icon: Settings, label: "Paramètres", href: userRole === "ELEVE" ? "/student/settings" : "/admin/settings" },
          { icon: LogOut, label: "Déconnexion", key: "logout" },
        ]

  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const hoverBg = theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
  const activeBg = theme === "dark" ? "bg-indigo-900/50" : "bg-indigo-50"

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay — flou façon modal */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
            onClick={onToggle}
          />
        )}
        {/* Mobile Sidebar */}
        <aside className={`
          fixed top-0 left-0 bottom-0 z-50 ${bgColor} border-r ${borderColor} shadow-2xl
          transform transition-transform duration-300 ease-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-[82%] max-w-xs
        `}
        style={{ willChange: 'transform' }}>
          {/* Shell */}
          <div className="flex h-full flex-col">
          {/* Header — branding + fermeture */}
          <div className={`flex items-center justify-between gap-2 p-4 border-b ${borderColor} flex-shrink-0 overflow-hidden`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                <School className="w-5 h-5" />
              </div>
              <span className={`truncate text-sm font-bold ${textColor}`}>
                {schoolName || "Menu"}
              </span>
            </div>
            <button
              onClick={onToggle}
              className={`shrink-0 p-2 rounded-lg ${hoverBg}`}
              aria-label="Fermer le menu"
            >
              <X className={`w-5 h-5 ${textSecondary}`} />
            </button>
          </div>
          {/* Navigation (scrollable) */}
          <nav className="px-4 py-6 flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
            {subscriptionExpired && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <Lock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400 leading-snug">
                  Abonnement expiré.<br />
                  <span className="opacity-80">Renouvelez pour débloquer l'accès.</span>
                </p>
              </div>
            )}
            <div className="mb-6">
              <h3 className={`text-xs uppercase font-semibold ${textSecondary} mb-4 px-2`}>Menu principal</h3>
              <ul className="space-y-1">
                {visibleNavItems.map((item, index) => {
                  const locked = subscriptionExpired && !ALWAYS_ALLOWED.includes(item.href)
                  const proLocked = !!(item as NavItem).proOnly
                  const badge = badgeCounts[item.href]
                  return (
                  <li key={index}>
                    {locked ? (
                      <span className={`flex items-center px-3 py-2.5 rounded-lg opacity-40 cursor-not-allowed select-none ${textSecondary}`}>
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="flex-1">{item.label}</span>
                        <Lock className="w-3 h-3 opacity-60" />
                      </span>
                    ) : proLocked ? (
                      <span
                        className={`flex items-center px-3 py-2.5 rounded-lg cursor-not-allowed select-none opacity-60 ${textSecondary}`}
                        title="Disponible avec le plan Pro"
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">PRO</span>
                      </span>
                    ) : (item as NavItem).premiumOnly ? (
                    <Link
                      href={item.href}
                      className={`
                        flex items-center px-3 py-3 rounded-xl transition-all duration-200 ease-out
                        ${isActive(item.href)
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : `${textSecondary} ${hoverBg}`
                        }
                      `}
                      onClick={onToggle}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 border border-green-500/30">New</span>
                    </Link>
                    ) : (
                    <Link
                      href={item.href}
                      className={`
                        flex items-center px-3 py-3 rounded-xl transition-all duration-200 ease-out
                        ${isActive(item.href)
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : `${textSecondary} ${hoverBg}`
                        }
                      `}
                      onClick={onToggle}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </Link>
                    )}
                  </li>
                  )
                })}
              </ul>
            </div>
          </nav>
          {/* Footer (pinned) */}
          <div className={`px-4 py-4 border-t ${borderColor} flex-shrink-0`}>
            <h3 className={`text-xs uppercase font-semibold ${textSecondary} mb-3 px-2`}>Administration</h3>
            <ul className="space-y-1">
              {adminItems.map((item, index) => (
                <li key={index}>
                  {"key" in item && item.key === "logout" ? (
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className={`flex items-center px-3 py-3 ${textSecondary} ${hoverBg} rounded-xl transition-all duration-200 ease-out w-full text-left`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link 
                      href={(item as { href: string }).href}
                      className={`flex items-center px-3 py-3 ${textSecondary} ${hoverBg} rounded-xl transition-all duration-200 ease-out`}
                      onClick={onToggle}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </aside>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowLogoutModal(false)}
            />
            
            <div className={`relative ${bgColor} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-md animate-scale-up`}>
              <div className={`p-6 border-b ${borderColor}`}>
                <h3 className={`text-xl font-bold ${textColor} flex items-center gap-2`}>
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  Confirmer la déconnexion
                </h3>
              </div>

              <div className="p-6">
                <p className={`${textColor} mb-6`}>
                  Êtes-vous sûr de vouloir vous déconnecter ?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      theme === "dark"
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    Annuler
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      loggingOut
                        ? "opacity-50 cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                        : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    }`}
                  >
                    {loggingOut ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Déconnexion...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        Déconnexion
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <aside className={`
        fixed top-0 left-0 bottom-0 ${bgColor} border-r ${borderColor} pt-16 z-30
        transition-all duration-300 ease-out overflow-hidden
        ${isOpen ? 'w-64' : 'w-16'}
      `}
      style={{ willChange: 'width' }}>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo Section - Removed */}
          {/* Navigation (scrollable) */}
          <nav className="px-4 py-6 flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
            {/* Subscription expired banner */}
            {subscriptionExpired && isOpen && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <Lock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400 leading-snug">
                  Abonnement expiré. Accès limité.<br />
                  <span className="opacity-80">Renouvelez pour débloquer.</span>
                </p>
              </div>
            )}
            <div className="mb-6">
              <h3 className={`text-xs uppercase font-semibold ${textSecondary} mb-4 px-2 transition-all duration-300 ease-out ${
                isOpen ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
              }`}>Menu principal</h3>
              <ul className="space-y-1">
                {visibleNavItems.map((item, index) => {
                  const locked = subscriptionExpired && !ALWAYS_ALLOWED.includes(item.href)
                  const proLocked = !!(item as NavItem).proOnly
                  const badge = badgeCounts[item.href]
                  return (
                  <li key={index}>
                    {locked ? (
                      <span className={`
                        flex items-center rounded-lg
                        ${isOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                        opacity-40 cursor-not-allowed select-none
                        ${textSecondary}
                      `} title={!isOpen ? item.label : undefined}>
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && (
                          <>
                            <span className="ml-3 flex-1">{item.label}</span>
                            <Lock className="w-3 h-3 ml-1 opacity-60" />
                          </>
                        )}
                      </span>
                    ) : proLocked ? (
                      <span
                        className={`
                          flex items-center rounded-lg opacity-60 cursor-not-allowed select-none
                          ${isOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                          ${textSecondary}
                        `}
                        title={!isOpen ? `${item.label} (Plan Pro)` : undefined}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && (
                          <>
                            <span className="ml-3 flex-1">{item.label}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">PRO</span>
                          </>
                        )}
                      </span>
                    ) : (item as NavItem).premiumOnly ? (
                    <Link
                      href={item.href}
                      className={`
                        flex items-center rounded-lg transition-all duration-300 ease-out group relative
                        ${isOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                        ${isActive(item.href)
                          ? `${activeBg} text-indigo-700 dark:text-indigo-400 ${isOpen ? 'border-r-2 border-indigo-600' : ''}`
                          : `${textSecondary} ${hoverBg}`
                        }
                      `}
                      title={!isOpen ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && (
                        <>
                          <span className="ml-3 flex-1">{item.label}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 border border-green-500/30">New</span>
                        </>
                      )}
                      {!isOpen && (
                        <div className={`absolute left-full ml-2 px-2 py-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-900"} text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                          {item.label}
                        </div>
                      )}
                    </Link>
                    ) : (
                    <Link
                      href={item.href}
                      className={`
                        flex items-center rounded-lg transition-all duration-300 ease-out group relative
                        ${isOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                        ${isActive(item.href)
                          ? `${activeBg} text-indigo-700 dark:text-indigo-400 ${isOpen ? 'border-r-2 border-indigo-600' : ''}`
                          : `${textSecondary} ${hoverBg}`
                        }
                      `}
                      title={!isOpen ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && (
                        <>
                          <span className="ml-3 flex-1">{item.label}</span>
                          {badge > 0 && (
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {badge > 9 ? "9+" : badge}
                            </span>
                          )}
                        </>
                      )}
                      {!isOpen && (
                        <div className={`absolute left-full ml-2 px-2 py-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-900"} text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                          {item.label}
                          {badge > 0 && ` (${badge})`}
                        </div>
                      )}
                    </Link>
                    )}
                  </li>
                  )
                })}
              </ul>
            </div>
          </nav>
          {/* Footer (pinned) */}
          <div className={`px-4 py-4 border-t ${borderColor} flex-shrink-0`}>
            <h3 className={`text-xs uppercase font-semibold ${textSecondary} mb-3 px-2 transition-all duration-300 ease-out ${
              isOpen ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden mb-0'
            }`}>Administration</h3>
            <ul className="space-y-1">
              {adminItems.map((item, index) => (
                <li key={index}>
                  {"key" in item && item.key === "logout" ? (
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className={`flex items-center rounded-lg transition-all duration-300 ease-out w-full text-left group relative ${isOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'} ${textSecondary} ${hoverBg}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="ml-3">{item.label}</span>}
                      {!isOpen && (
                        <div className={`absolute left-full ml-2 px-2 py-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-900"} text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                          {item.label}
                        </div>
                      )}
                    </button>
                  ) : (
                    <Link 
                      href={(item as { href: string }).href}
                      className={`flex items-center rounded-lg transition-all duration-300 ease-out group relative ${isOpen ? 'px-3 py-2.5' : 'p-2.5 justify-center'} ${textSecondary} ${hoverBg}`}
                      title={!isOpen ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="ml-3">{item.label}</span>}
                      {!isOpen && (
                        <div className={`absolute left-full ml-2 px-2 py-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-900"} text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowLogoutModal(false)}
          />
          
          <div className={`relative ${bgColor} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-md animate-scale-up`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <h3 className={`text-xl font-bold ${textColor} flex items-center gap-2`}>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                Confirmer la déconnexion
              </h3>
            </div>

            <div className="p-6">
              <p className={`${textColor} mb-6`}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loggingOut
                      ? "opacity-50 cursor-not-allowed"
                      : theme === "dark"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                      : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  }`}
                >
                  {loggingOut ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Déconnexion...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      Déconnexion
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
