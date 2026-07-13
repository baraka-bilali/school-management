"use client"

import { useState, useEffect } from "react"
import { Menu, School, User, Moon, Sun, LogOut, X } from "lucide-react"
import { useRouter } from "next/navigation"
import NotificationBell from "./notification-bell"
import Portal from "./portal"

interface HeaderProps {
  onSidebarToggle: () => void
  role?: string | null
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  COMPTABLE: 'Comptable',
  CAISSIER: 'Caissier(ère)',
  DIRECTEUR_DISCIPLINE: 'Discipline',
  DIRECTEUR_ETUDES: 'Études',
  DIRECTEUR_ADJOINT: 'Dir. adjoint',
  SECRETAIRE: 'Secrétaire',
  INTENDANT: 'Intendant(e)',
  SURVEILLANT_GENERAL: 'Surveillant(e) gén.',
  BIBLIOTHECAIRE: 'Bibliothécaire',
  INFIRMIER: 'Infirmier(ère)',
  CONSEILLER_PEDAGOGIQUE: 'Conseiller péd.',
  PROFESSEUR: 'Professeur',
  ELEVE: 'Élève'
}

export default function Header({ onSidebarToggle, role }: HeaderProps) {
  const router = useRouter()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [schoolPhoto, setSchoolPhoto] = useState<string | null>(null)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    // Récupérer les infos utilisateur depuis le token et l'API
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        setUserEmail(payload.email || "")
        setUserRole(payload.role || "")
        
        console.log("Payload du token:", payload)
        
        // Récupérer le nom depuis l'API pour éviter les problèmes d'encodage UTF-8
        fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Cookie": `token=${token}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.user?.name) {
              setUserName(data.user.name)
              console.log("✅ Nom d'utilisateur récupéré de l'API:", data.user.name)
            }
          })
          .catch(error => {
            console.error("Erreur lors de la récupération du nom:", error)
            // Fallback au JWT si l'API échoue
            setUserName(payload.name || payload.username || "Utilisateur")
          })
        
        // Vérifier si le token contient un schoolId
        if (!payload.schoolId && payload.role === "ADMIN") {
          console.warn("⚠️ Le token ne contient pas de schoolId. Veuillez vous reconnecter pour obtenir les informations de l'école.")
        }
        
        // Vérifier si le nom de l'école est déjà en cache
        const cachedSchoolName = localStorage.getItem("schoolName")
        const cachedSchoolPhoto = localStorage.getItem("schoolProfilePhoto")
        if (cachedSchoolPhoto) setSchoolPhoto(cachedSchoolPhoto)
        // Ignorer le cache s'il contient la valeur par défaut "Établissement"
        if (cachedSchoolName && cachedSchoolName !== "Établissement") {
          console.log("📦 Nom de l'école récupéré du cache:", cachedSchoolName)
          setSchoolName(cachedSchoolName)
        } else {
          // Charger depuis l'API si pas en cache ou si c'est la valeur par défaut
          fetchSchoolName()
        }
      } catch (error) {
        console.error("Erreur lors du décodage du token:", error)
        const cachedSchoolName = localStorage.getItem("schoolName")
        const cachedSchoolPhoto = localStorage.getItem("schoolProfilePhoto")
        if (cachedSchoolPhoto) setSchoolPhoto(cachedSchoolPhoto)
        if (cachedSchoolName && cachedSchoolName !== "Établissement") {
          setSchoolName(cachedSchoolName)
        } else {
          fetchSchoolName()
        }
      }
    } else {
      // Pas de token, vérifier quand même le cache
      const cachedSchoolName = localStorage.getItem("schoolName")
      if (cachedSchoolName && cachedSchoolName !== "Établissement") {
        setSchoolName(cachedSchoolName)
      } else {
        fetchSchoolName()
      }
    }

    // Récupérer le thème depuis localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }

    const onBrandingChange = () => {
      const photo = localStorage.getItem("schoolProfilePhoto")
      setSchoolPhoto(photo)
    }
    window.addEventListener("schoolBrandingChange", onBrandingChange)
    return () => window.removeEventListener("schoolBrandingChange", onBrandingChange)
  }, [])

  const fetchSchoolName = async () => {
    try {
      console.log("🔄 Chargement du nom de l'école depuis l'API...")
      const res = await fetch(`/api/admin/school`, {
        credentials: "include"
      })
      
      console.log("Réponse API école:", res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log("Données école:", data)
        const nom = data.school?.nomEtablissement || data.nom
        const photo = data.school?.profilePhotoUrl || data.school?.logoUrl || null
        if (photo) {
          setSchoolPhoto(photo)
          localStorage.setItem("schoolProfilePhoto", photo)
        } else {
          setSchoolPhoto(null)
          localStorage.removeItem("schoolProfilePhoto")
        }
        if (nom && nom.trim() !== "") {
          setSchoolName(nom)
          // Sauvegarder en localStorage pour les prochaines navigations
          localStorage.setItem("schoolName", nom)
          console.log("✅ Nom de l'école sauvegardé en cache:", nom)
        } else {
          setSchoolName("Établissement")
          localStorage.setItem("schoolName", "Établissement")
        }
      } else {
        const errorText = await res.text()
        console.log("Erreur API école:", errorText)
        setSchoolName("Établissement")
        localStorage.setItem("schoolName", "Établissement")
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du nom de l'école:", error)
      setSchoolName("Établissement")
      localStorage.setItem("schoolName", "Établissement")
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
      setLoggingOut(true)
      await fetch("/api/auth/logout", { method: "POST" })
      localStorage.removeItem("token")
      localStorage.removeItem("schoolName")
      localStorage.removeItem("schoolProfilePhoto")
      console.log("🗑️ Cache du nom de l'école nettoyé")
      // Attendre un peu pour montrer l'animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowLogoutModal(false)
      setShowProfileModal(false)
      // Forcer un rechargement complet pour éviter les problèmes de cache
      window.location.href = "/login"
    } catch (error) {
      console.error(error)
      setLoggingOut(false)
    }
  }
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"

  const notificationsHref =
    (role || userRole) === "SUPER_ADMIN" ? "/super-admin/notifications" : "/admin/notifications"

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 ${bgColor} border-b ${borderColor} z-40 transition-colors`}>
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            <button 
              onClick={onSidebarToggle}
              className={`${textSecondary} hover:${textColor} mr-2 md:mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:inline-flex`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden shrink-0">
                {schoolPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={schoolPhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <h1 className={`text-base md:text-xl font-semibold ${textColor} truncate`}>
                {schoolName || "Chargement..."}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-gray-800 text-yellow-400" : "hover:bg-gray-100 text-indigo-500"}`}
              title={theme === "dark" ? "Mode Clair" : "Mode Sombre"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <NotificationBell href={notificationsHref} />
            
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
            
            <div className={`relative ${bgColor} rounded-xl border ${borderColor} shadow-2xl w-full max-w-sm animate-scale-up overflow-hidden`}>
              {/* Header */}
              <div className={`px-4 py-3 border-b ${borderColor} flex items-center justify-between`}>
                <h3 className={`text-lg font-semibold ${textColor}`}>Mon Profil</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${textSecondary} hover:${textColor} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Avatar and Name */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className={`text-base font-semibold ${textColor}`}>{userName}</h4>
                    <p className={`text-xs ${textSecondary}`}>{userEmail}</p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                      {userRole ? ROLE_LABEL[userRole] || userRole : "Utilisateur"}
                    </span>
                  </div>
                </div>

                {/* School Info */}
                {schoolName && schoolName !== "Chargement..." && schoolName !== "Établissement" && (
                  <div className={`p-3 rounded-lg border ${borderColor} ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                        <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs ${textSecondary}`}>École</p>
                        <p className={`text-sm font-medium ${textColor} truncate`}>{schoolName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`border-t ${borderColor}`}>
                {/* Logout Button */}
                <button
                  onClick={() => {
                    setShowProfileModal(false)
                    setShowLogoutModal(true)
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left`}
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="text-sm font-medium text-red-500">Déconnexion</div>
                    <div className={`text-xs ${textSecondary}`}>Se déconnecter du compte</div>
                  </div>
                </button>
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
        </Portal>
      )}
    </>
  )
}
