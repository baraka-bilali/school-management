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
  X
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
  const router = useRouter()
  const pathname = usePathname()

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
  ]

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname?.startsWith(href)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setShowLogoutModal(false)
    router.push("/login")
  }

  type AdminItem =
    | { icon: LucideIcon; label: string; href: string }
    | { icon: LucideIcon; label: string; key: "logout" }
  const adminItems: AdminItem[] = [
    { icon: Settings, label: "Paramètres", href: "/admin/settings" },
    { icon: LogOut, label: "Déconnexion", key: "logout" },
  ]

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
          fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-80
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <School className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-lg font-semibold text-gray-800">École ABC</span>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {/* Navigation */}
          <nav className="p-4">
            <div className="mb-6">
              <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Menu principal</h3>
              <ul className="space-y-2">
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link 
                      href={item.href}
                      className={`
                        flex items-center px-4 py-3 rounded-lg transition-colors
                        ${isActive(item.href) 
                          ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600' 
                          : 'text-gray-600 hover:bg-gray-100'
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
            <div className="mb-6">
              <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Administration</h3>
              <ul className="space-y-2">
                {adminItems.map((item, index) => (
                  <li key={index}>
                    {"key" in item && item.key === "logout" ? (
                      <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full text-left"
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                      </button>
                    ) : (
                      <Link 
                        href={(item as { href: string }).href}
                        className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
          </nav>
        </aside>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Déconnexion</h2>
              <p className="mb-6">Voulez-vous vraiment vous déconnecter ?</p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick={() => setShowLogoutModal(false)}
                >Annuler</button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={handleLogout}
                >Se déconnecter</button>
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
        fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 pt-16 z-30
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-16'}
      `}>
        {/* Logo Section */}
        <div className="px-4 py-4 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <School className="w-4 h-4 text-indigo-600" />
          </div>
          {isOpen && (
            <span className="text-lg font-semibold text-gray-800 truncate">École ABC</span>
          )}
        </div>
        {/* Navigation */}
        <nav className="px-4">
          <div className="mb-6">
            {isOpen && (
              <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Menu principal</h3>
            )}
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-colors group
                      ${isActive(item.href) 
                        ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    title={!isOpen ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <span className="ml-3">{item.label}</span>
                    )}
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-6">
            {isOpen && (
              <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Administration</h3>
            )}
            <ul className="space-y-2">
              {adminItems.map((item, index) => (
                <li key={index}>
                  {"key" in item && item.key === "logout" ? (
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full text-left"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="ml-3">{item.label}</span>}
                      {!isOpen && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  ) : (
                    <Link 
                      href={(item as { href: string }).href}
                      className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors group"
                      title={!isOpen ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="ml-3">{item.label}</span>}
                      {!isOpen && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Déconnexion</h2>
            <p className="mb-6">Voulez-vous vraiment vous déconnecter ?</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowLogoutModal(false)}
              >Annuler</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleLogout}
              >Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
