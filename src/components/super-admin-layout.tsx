"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell, Moon, Sun, LogOut, Receipt } from "lucide-react"

interface SuperAdminLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  showTabs?: boolean
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function SuperAdminLayout({
  children,
  title = "Tableau de bord Super Admin",
  description = "Gérez les écoles, les administrateurs et les abonnements dans une interface plus dense, centrée et synchronisée avec la base.",
  showTabs = false,
  activeTab,
  onTabChange,
}: SuperAdminLayoutProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") setTheme(saved)

    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Error parsing user:", e)
      }
    }

    fetchUnreadCount()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/count", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) return
      const data = await res.json()
      setUnreadNotifications(data.count || 0)
    } catch (e) {
      console.error("Erreur comptage notifications:", e)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    window.dispatchEvent(new Event("themeChange"))
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      localStorage.removeItem("user")
      router.push("/super-admin/login")
    } catch (e) {
      console.error("Erreur déconnexion:", e)
    }
  }

  const bgMain = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"
  const cardBg = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
  const notificationBg = theme === "dark" ? "bg-[#21262d]" : "bg-white"

  const tabs = [
    { id: "stats", label: "Statistiques Générales" },
    { id: "schools", label: "Gestion des Écoles" },
    { id: "admins", label: "Administrateurs d'Écoles" },
    { id: "notifications", label: "Notifications" },
    { id: "settings", label: "Paramètres" },
  ]

  return (
    <div className={`min-h-screen ${bgMain} transition-colors`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${cardBg} border-b ${borderColor} shadow-sm`}>
        <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
                  Console Compacte
                </span>
              </div>
              <h1 className={`text-2xl font-bold ${textColor}`}>{title}</h1>
              <p className={`text-sm ${textSecondary} mt-1 max-w-2xl`}>{description}</p>
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <button
                onClick={() => router.push("/super-admin")}
                className={`relative rounded-2xl border ${borderColor} p-3 ${notificationBg} transition-colors`}
              >
                <Bell className={`w-5 h-5 ${unreadNotifications > 0 ? "text-yellow-400 animate-pulse" : textSecondary}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>

              {user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-3 rounded-2xl border ${borderColor} px-3 py-2 hover:opacity-80 transition-opacity`}
                  >
                    <div className="text-right">
                      <div className={`text-sm font-medium ${textColor}`}>{user.name}</div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-xs text-emerald-500">Connecté</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 ${cardBg} rounded-lg shadow-xl border ${borderColor} overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                      <div className={`px-4 py-3 border-b ${borderColor}`}>
                        <div className={`text-sm font-medium ${textColor}`}>{user.name}</div>
                        <div className={`text-xs ${textSecondary}`}>{user.email}</div>
                      </div>

                      <a
                        href="/super-admin/subscription-payments"
                        className={`w-full px-4 py-3 flex items-center gap-3 ${hoverBg} transition-colors text-left border-b ${borderColor}`}
                      >
                        <Receipt className="w-5 h-5 text-emerald-500" />
                        <div>
                          <div className={`text-sm font-medium ${textColor}`}>Journal des paiements</div>
                          <div className={`text-xs ${textSecondary}`}>Abonnements & factures</div>
                        </div>
                      </a>

                      <button
                        onClick={toggleTheme}
                        className={`w-full px-4 py-3 flex items-center gap-3 ${hoverBg} transition-colors text-left`}
                      >
                        {theme === "dark" ? (
                          <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <Moon className="w-5 h-5 text-blue-500" />
                        )}
                        <div>
                          <div className={`text-sm font-medium ${textColor}`}>
                            {theme === "dark" ? "Mode clair" : "Mode sombre"}
                          </div>
                          <div className={`text-xs ${textSecondary}`}>Changer le thème</div>
                        </div>
                      </button>

                      <button
                        onClick={handleLogout}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left border-t ${borderColor}`}
                      >
                        <LogOut className="w-5 h-5 text-red-500" />
                        <div>
                          <div className="text-sm font-medium text-red-500">Déconnexion</div>
                          <div className={`text-xs ${textSecondary}`}>Retour à la page login</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        {showTabs && onTabChange && (
          <div className={`max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 border-t ${borderColor}`}>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : `${textSecondary} hover:${textColor} ${hoverBg}`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className={`mt-12 border-t ${borderColor} ${cardBg}`}>
        <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className={`text-sm ${textSecondary}`}>
            © 2026 digiSchool. Tous droits réservés. Développé avec ❤️ par Becker Baraka-Bilali
          </p>
        </div>
      </footer>
    </div>
  )
}
