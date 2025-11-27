"use client"

import { useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  School,
  X,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Charger le thème
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // Écouter les changements de thème
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (currentTheme) {
        setTheme(currentTheme)
      }
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

  type NavItem = { icon: LucideIcon; label: string; href: string }
  const navItems: NavItem[] = [
    { icon: BarChart3, label: "Tableau de bord", href: "/admin" },
    { icon: Users, label: "Utilisateurs", href: "/admin/users" },
    { icon: GraduationCap, label: "Classes & Filières", href: "/admin/classes" },
    { icon: BookOpen, label: "Matières", href: "/admin/subjects" },
    { icon: ClipboardCheck, label: "Présences", href: "/admin/attendance" },
    { icon: GraduationCap, label: "Notes & Bulletins", href: "/admin/grades" },
    { icon: CreditCard, label: "Abonnement", href: "/admin/subscription" },
  ]

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
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
  const adminItems: AdminItem[] = [
    { icon: Settings, label: "Paramètres", href: "/admin/settings" },
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
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onToggle}
          />
        )}
        {/* Mobile Sidebar */}
        <aside className={`
          fixed top-0 left-0 bottom-0 z-50 ${bgColor} border-r ${borderColor}
          transform transition-transform duration-300 ease-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-80
        `}
        style={{ willChange: 'transform' }}>
          {/* Shell */}
          <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${borderColor} flex-shrink-0 overflow-hidden`}>
            <button
              onClick={onToggle}
              className={`p-2 rounded-lg ${hoverBg} ml-auto`}
            >
              <X className={`w-5 h-5 ${textSecondary}`} />
            </button>
          </div>
          {/* Navigation (scrollable) */}
          <nav className="px-4 py-6 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mb-6">
              <h3 className={`text-xs uppercase font-semibold ${textSecondary} mb-4 px-2`}>Menu principal</h3>
              <ul className="space-y-1">
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link 
                      href={item.href}
                      className={`
                        flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 ease-out
                        ${isActive(item.href) 
                          ? `${activeBg} text-indigo-700 dark:text-indigo-400 border-r-2 border-indigo-600` 
                          : `${textSecondary} ${hoverBg}`
                        }
                      `}
                      onClick={onToggle}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
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
                      className={`flex items-center px-3 py-2.5 ${textSecondary} ${hoverBg} rounded-lg transition-all duration-300 ease-out w-full text-left`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link 
                      href={(item as { href: string }).href}
                      className={`flex items-center px-3 py-2.5 ${textSecondary} ${hoverBg} rounded-lg transition-all duration-300 ease-out`}
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
          <nav className="px-4 py-6 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mb-6">
              <h3 className={`text-xs uppercase font-semibold ${textSecondary} mb-4 px-2 transition-all duration-300 ease-out ${
                isOpen ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0 overflow-hidden'
              }`}>Menu principal</h3>
              <ul className="space-y-1">
                {navItems.map((item, index) => (
                  <li key={index}>
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
                        <span className="ml-3">{item.label}</span>
                      )}
                      {!isOpen && (
                        <div className={`absolute left-full ml-2 px-2 py-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-900"} text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}>
                          {item.label}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
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
