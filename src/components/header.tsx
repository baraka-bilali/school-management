"use client"

import { useState, useEffect } from "react"
import { Menu, School, User, Moon, Sun, LogOut, X } from "lucide-react"
import { useRouter } from "next/navigation"
import NotificationBell from "./notification-bell"
import Portal from "./portal"

interface HeaderProps {
  onSidebarToggle: () => void
  role?: string | null
  onNotificationClick?: () => void
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  COMPTABLE: 'Comptable',
  DIRECTEUR_DISCIPLINE: 'Discipline',
  DIRECTEUR_ETUDES: 'Études',
  PROFESSEUR: 'Professeur',
  ELEVE: 'Élève'
}

export default function Header({ onSidebarToggle, role, onNotificationClick }: HeaderProps) {
  const router = useRouter()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    // Récupérer les infos utilisateur depuis le token
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUserName(payload.name || payload.username || "Utilisateur")
        setUserEmail(payload.email || "")
        setUserRole(payload.role || "")
        
        console.log("Payload du token:", payload)
        
        // Toujours appeler fetchSchoolName
        fetchSchoolName()
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error)
        fetchSchoolName()
      }
    } else {
      fetchSchoolName()
    }

    // Récupérer le thème depuis localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  const fetchSchoolName = async () => {
    try {
      // Toujours essayer de récupérer le nom de l'école via l'API
      const res = await fetch(`/api/admin/school`, {
        credentials: "include"
      })
      
      console.log("Réponse API école:", res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log("Données école:", data)
        setSchoolName(data.nom || "École")
      } else {
        console.log("Erreur API:", await res.text())
        setSchoolName("École")
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du nom de l'école:", error)
      setSchoolName("École")
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    
    // Émettre un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new Event("themeChange"))
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    localStorage.removeItem("token")
    setShowLogoutModal(false)
    setShowProfileModal(false)
    router.push("/login")
  }
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 ${bgColor} border-b ${borderColor} z-40 transition-colors`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onSidebarToggle}
              className={`${textSecondary} hover:${textColor} mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className={`text-xl font-semibold ${textColor}`}>
                {schoolName || "School Management"}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <NotificationBell onNotificationClick={onNotificationClick} />
            
            {/* Profile Button */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${textColor}`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {userRole ? ROLE_LABEL[userRole] || userRole : "—"}
                  </span>
                  <span className={`text-xs font-medium ${textSecondary}`}>Connecté</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowProfileModal(false)}
            />
            
            <div className={`relative ${bgColor} rounded-2xl border ${borderColor} shadow-2xl w-full max-w-md animate-scale-up`}>
              {/* Header */}
              <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
                <h3 className={`text-xl font-bold ${textColor}`}>Mon Profil</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${textSecondary} hover:${textColor} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${textColor}`}>{userName}</h4>
                    <p className={`text-sm ${textSecondary}`}>{userEmail}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                      {userRole ? ROLE_LABEL[userRole] || userRole : "Utilisateur"}
                    </span>
                  </div>
                </div>

                {/* School Info */}
                {schoolName && schoolName !== "School Management" && (
                  <div className={`p-4 rounded-lg border ${borderColor} bg-gray-50 dark:bg-gray-800`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className={`text-xs ${textSecondary}`}>École</p>
                        <p className={`text-sm font-semibold ${textColor}`}>{schoolName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                      theme === "dark"
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-4 h-4" />
                        Mode Clair
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        Mode Sombre
                      </>
                    )}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setShowProfileModal(false)
                      setShowLogoutModal(true)
                    }}
                    className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                      theme === "dark"
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                        : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <Portal>
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
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      theme === "dark"
                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                        : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
