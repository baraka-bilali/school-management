"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Users, Building2, CreditCard, DollarSign, Search, Plus, Pencil, Trash2, Bell, Moon, Sun, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Portal from "@/components/portal"

type School = { 
  id: number; 
  nomEtablissement: string; 
  codeEtablissement?: string | null; 
  ville: string;
  province: string;
  typeEtablissement: string;
  telephone: string;
  email: string;
  directeurNom: string;
  etatCompte: string;
  dateCreation: string;
}
type User = { id: number; name: string; email: string; role: string }

export default function SuperAdminHome() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("7")
  const [activeTab, setActiveTab] = useState("stats")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalMounted, setModalMounted] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState({
    // Informations générales
    nomEtablissement: "",
    typeEtablissement: "PRIVE" as "PUBLIC" | "PRIVE" | "SEMI_PRIVE",
    niveauEnseignement: [] as string[],
    codeEtablissement: "",
    anneeCreation: "",
    slogan: "",
    
    // Localisation & Contact
    adresse: "",
    ville: "",
    province: "",
    pays: "RDC",
    telephone: "",
    email: "",
    siteWeb: "",
    
    // Direction
    directeurNom: "",
    directeurTelephone: "",
    directeurEmail: "",
    secretaireAcademique: "",
    comptable: "",
    personnelAdministratifTotal: "",
    
    // Informations légales
    rccm: "",
    idNat: "",
    nif: "",
    agrementMinisteriel: "",
    dateAgrement: "",
    
    // Académique
    cycles: "",
    nombreClasses: "",
    nombreEleves: "",
    nombreEnseignants: "",
    langueEnseignement: "",
    programmes: "",
    joursOuverture: "",
    
    // Abonnement (étape finale)
    formule: "Basic" as "Basic" | "Premium" | "Enterprise"
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role !== 'SUPER_ADMIN') {
          router.replace('/login')
        }
      } catch {}
    }
  }, [router])

  const loadSchools = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/super-admin/schools', {
        credentials: 'include' // Important: envoie les cookies HttpOnly
      })
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Non authentifié ou pas les bonnes permissions
          router.push('/super-admin/login')
          return
        }
        const errorData = await res.json().catch(() => ({}))
        console.error('Error loading schools:', errorData)
        throw new Error(errorData.error || 'Erreur lors du chargement des écoles')
      }
      
      const data = await res.json()
      setSchools(data.schools || [])
    } catch (e: any) {
      console.error('Load schools error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchools()
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Fermer le menu utilisateur quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogoutClick = () => {
    setShowUserMenu(false)
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      localStorage.removeItem('token')
      // Attendre un peu pour montrer l'animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/super-admin/login')
    } catch (e) {
      console.error(e)
      setLoggingOut(false)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  // Modal animation effects
  useEffect(() => {
    if (showCreateModal) {
      setModalMounted(true)
      setCurrentStep(1)
      const id = setTimeout(() => setModalVisible(true), 10)
      return () => clearTimeout(id)
    }
    setModalVisible(false)
    const t = setTimeout(() => {
      setModalMounted(false)
      // Reset form when modal closes
      setForm({
        nomEtablissement: "",
        typeEtablissement: "PRIVE",
        niveauEnseignement: [],
        codeEtablissement: "",
        anneeCreation: "",
        slogan: "",
        adresse: "",
        ville: "",
        province: "",
        pays: "RDC",
        telephone: "",
        email: "",
        siteWeb: "",
        directeurNom: "",
        directeurTelephone: "",
        directeurEmail: "",
        secretaireAcademique: "",
        comptable: "",
        personnelAdministratifTotal: "",
        rccm: "",
        idNat: "",
        nif: "",
        agrementMinisteriel: "",
        dateAgrement: "",
        cycles: "",
        nombreClasses: "",
        nombreEleves: "",
        nombreEnseignants: "",
        langueEnseignement: "",
        programmes: "",
        joursOuverture: "",
        formule: "Basic"
      })
    }, 220)
    return () => clearTimeout(t)
  }, [showCreateModal])

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError("")
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    try {
      const res = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setShowCreateModal(false)
      await loadSchools()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const filteredSchools = schools.filter(s => 
    s.nomEtablissement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.codeEtablissement || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ville.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.directeurNom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: "stats", label: "Statistiques Générales" },
    { id: "schools", label: "Gestion des Écoles" },
    { id: "users", label: "Gestion des Utilisateurs" },
    { id: "notifications", label: "Notifications" }
  ]

  const stats = [
    { label: "Écoles totales", value: schools.length.toLocaleString(), change: "+4%", trend: "up", icon: Building2 },
    { label: "Abonnements actifs", value: "980", change: "+2.1%", trend: "up", icon: CreditCard },
    { label: "Utilisateurs totaux", value: "15,689", change: "+8.6%", trend: "up", icon: Users },
    { label: "Revenu mensuel", value: "€25,400", change: "-1.5%", trend: "down", icon: DollarSign },
  ]

  // Thème colors
  const bgColor = theme === "dark" ? "bg-[#0f1729]" : "bg-gray-100"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const cardBg = theme === "dark" ? "bg-[#1a2332]" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const hoverBg = theme === "dark" ? "hover:bg-[#242f42]" : "hover:bg-gray-50"
  const inputBg = theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"
  const notificationBg = theme === "dark" ? "hover:bg-[#1a2332]" : "hover:bg-gray-100"

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-6 transition-colors duration-300`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"} flex items-center justify-center`}>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold">Tableau de bord Super Admin</h1>
        </div>
        <p className={textSecondary}>Gérez les écoles, les utilisateurs et visualisez les statistiques de la plateforme.</p>
      </div>

      {/* Tabs Navigation */}
      <div className={`mb-6 border-b ${borderColor}`}>
        <div className="flex items-center justify-between">
          {/* Spacer gauche */}
          <div className="flex-1"></div>
          
          {/* Onglets centrés */}
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setActiveTab(tab.id)
                    setTimeout(() => setIsTransitioning(false), 10)
                  }, 150)
                }}
                className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-blue-500"
                    : `${textSecondary} ${theme === "dark" ? "hover:text-gray-300" : "hover:text-gray-900"}`
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Section droite : Utilisateur et notifications */}
          <div className="flex-1 flex items-center justify-end gap-4 pb-4">
            {/* Notification */}
            <button className={`relative p-2 ${notificationBg} rounded-lg transition-colors`}>
              <Bell className={`w-5 h-5 ${textSecondary}`} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>

            {/* Utilisateur */}
            {user && user.name && (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-3 pl-4 border-l ${borderColor} hover:opacity-80 transition-opacity`}
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

                {/* Menu Dropdown */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-56 ${cardBg} rounded-lg shadow-xl border ${borderColor} overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                    {/* User Info */}
                    <div className={`px-4 py-3 border-b ${borderColor}`}>
                      <div className={`text-sm font-medium ${textColor}`}>{user.name}</div>
                      <div className={`text-xs ${textSecondary}`}>{user.email}</div>
                    </div>

                    {/* Theme Toggle */}
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

                    {/* Logout */}
                    <button
                      onClick={handleLogoutClick}
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

      {/* Tab Content */}
      <div className={`transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
      {activeTab === "stats" && (
        <>
      {/* Time Period Filters */}
      <div className="flex gap-2 mb-6">
        {["7", "30", "365"].map((days) => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === days
                ? "bg-blue-500 text-white"
                : `${cardBg} ${textSecondary} ${hoverBg}`
            }`}
          >
            {days === "7" ? "7 derniers jours" : days === "30" ? "30 jours" : "Année en cours"}
          </button>
        ))}
        <button className={`px-4 py-2 rounded-lg text-sm font-medium ${cardBg} ${textSecondary} ${hoverBg}`}>
          Personnalisé
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className={`${cardBg} rounded-xl p-5 border ${borderColor} shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textSecondary} text-sm`}>{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
            </div>
            <div className="flex items-end justify-between">
              <div className={`text-3xl font-bold ${textColor}`}>{stat.value}</div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === "up" ? "text-green-500" : "text-red-500"
              }`}>
                {stat.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Evolution Chart */}
        <div className={`lg:col-span-2 ${cardBg} rounded-xl p-6 border ${borderColor} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-1 ${textColor}`}>Évolution des abonnements</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className={`text-3xl font-bold ${textColor}`}>980</span>
            <span className="text-green-500 text-sm font-medium">Actifs +2.1%</span>
            <span className={`${textSecondary} text-sm`}>sur les 30 derniers jours</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[65, 85, 75, 95, 70, 80, 90, 75, 85, 95, 80, 90, 85, 95, 75, 85, 95, 85, 75, 95].map((height, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-6 ${textColor}`}>Répartition par formule</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="175 440" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="#a855f7" strokeWidth="20" strokeDasharray="220 440" strokeDashoffset="-175" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="#ec4899" strokeWidth="20" strokeDasharray="45 440" strokeDashoffset="-395" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-bold ${textColor}`}>{schools.length.toLocaleString()}</div>
                <div className={`text-xs ${textSecondary}`}>Écoles</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className={textSecondary}>Basic (40%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className={textSecondary}>Premium (35%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className={textSecondary}>Enterprise (25%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schools Table */}
      <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
        <div className={`p-6 border-b ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textColor}`}>Dernières écoles inscrites</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"}>
              <tr className={`text-left text-sm ${textSecondary}`}>
                <th className="px-6 py-4 font-medium">Nom de l'école</th>
                <th className="px-6 py-4 font-medium">Date d'inscription</th>
                <th className="px-6 py-4 font-medium">Formule</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderColor}`}>
              {loading ? (
                <tr><td colSpan={4} className={`px-6 py-8 text-center ${textSecondary}`}>Chargement...</td></tr>
              ) : schools.length === 0 ? (
                <tr><td colSpan={4} className={`px-6 py-8 text-center ${textSecondary}`}>Aucune école enregistrée</td></tr>
              ) : (
                schools.slice(0, 5).map((school) => (
                  <tr key={school.id} className={`${hoverBg} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${textColor}`}>{school.nomEtablissement}</div>
                      <div className={`text-sm ${textSecondary}`}>Code: {school.codeEtablissement || "N/A"}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                      {new Date(school.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {school.typeEtablissement}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        school.etatCompte === "ACTIF" ? "bg-green-500/10 text-green-500" :
                        school.etatCompte === "EN_ATTENTE" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        • {school.etatCompte === "ACTIF" ? "Actif" : school.etatCompte === "EN_ATTENTE" ? "En attente" : "Suspendu"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Schools Tab */}
      {activeTab === "schools" && (
        <div>
          {/* Search and Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Rechercher une école..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${inputBg} border ${borderColor} rounded-lg pl-10 pr-4 py-2.5 ${textColor} ${theme === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2.5 rounded-lg font-medium text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer une école
            </button>
          </div>

          {/* Schools Table */}
          <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
            <table className="w-full">
              <thead className={theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"}>
                <tr className={`text-left text-sm ${textSecondary}`}>
                  <th className="px-6 py-4 font-medium">Nom de l'école</th>
                  <th className="px-6 py-4 font-medium">Date d'inscription</th>
                  <th className="px-6 py-4 font-medium">Formule</th>
                  <th className="px-6 py-4 font-medium">Statut de l'abonnement</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor}`}>
                {loading ? (
                  <tr><td colSpan={5} className={`px-6 py-8 text-center ${textSecondary}`}>Chargement...</td></tr>
                ) : filteredSchools.length === 0 ? (
                  <tr><td colSpan={5} className={`px-6 py-8 text-center ${textSecondary}`}>
                    {searchQuery ? "Aucune école trouvée" : "Aucune école enregistrée"}
                  </td></tr>
                ) : (
                  filteredSchools.map((school) => (
                    <tr key={school.id} className={`${hoverBg} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${textColor}`}>{school.nomEtablissement}</div>
                        <div className={`text-sm ${textSecondary}`}>Code: {school.codeEtablissement || "N/A"}</div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                        {new Date(school.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={`px-6 py-4 text-sm ${textColor}`}>
                        {school.typeEtablissement}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          school.etatCompte === "ACTIF" ? "bg-green-500/10 text-green-500" :
                          school.etatCompte === "EN_ATTENTE" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          • {school.etatCompte === "ACTIF" ? "Actif" : school.etatCompte === "EN_ATTENTE" ? "En attente" : "Suspendu"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className={`p-2 ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"} rounded-lg transition-colors`} title="Modifier">
                            <Pencil className={`w-4 h-4 ${textSecondary} ${theme === "dark" ? "hover:text-white" : "hover:text-blue-600"}`} />
                          </button>
                          <button className={`p-2 ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"} rounded-lg transition-colors`} title="Supprimer">
                            <Trash2 className={`w-4 h-4 ${textSecondary} hover:text-red-500`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className={`${cardBg} rounded-xl border ${borderColor} p-8 text-center shadow-sm`}>
          <Users className={`w-16 h-16 ${textSecondary} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>Gestion des Utilisateurs</h3>
          <p className={textSecondary}>Cette section est en cours de développement.</p>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className={`${cardBg} rounded-xl border ${borderColor} p-8 text-center shadow-sm`}>
          <Building2 className={`w-16 h-16 ${textSecondary} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>Notifications</h3>
          <p className={textSecondary}>Cette section est en cours de développement.</p>
        </div>
      )}

      {/* Create School Modal */}
      {modalMounted && (
        <Portal>
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 overflow-y-auto ${
              modalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!modalVisible}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            
            <div 
              className={`relative w-full max-w-3xl my-8 rounded-xl ${cardBg} border ${borderColor} shadow-2xl transform transition-all duration-200 max-h-[90vh] flex flex-col ${
                modalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              role="dialog"
              aria-modal="true"
            >
              {/* Header avec étapes */}
              <div className={`px-6 py-4 border-b ${borderColor} flex-shrink-0`}>
                <h2 className={`text-lg font-semibold ${textColor} mb-2`}>Création d'une nouvelle école</h2>
                <p className={`text-xs ${textSecondary} mb-4`}>Suivez les étapes pour configurer une nouvelle école sur la plateforme.</p>
                
                {/* Steps indicator */}
                <div className="flex items-center justify-between">
                  {[
                    { num: 1, label: "Général", icon: "🏫" },
                    { num: 2, label: "Contact", icon: "📍" },
                    { num: 3, label: "Direction", icon: "👥" },
                    { num: 4, label: "Académique", icon: "�🏫" },
                    { num: 5, label: "Abonnement", icon: "💳" }
                  ].map((step, idx) => (
                    <div key={step.num} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          currentStep >= step.num 
                            ? "bg-blue-500 text-white" 
                            : `${theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"}`
                        }`}>
                          {step.icon}
                        </div>
                        <span className={`text-[9px] mt-1 text-center ${currentStep >= step.num ? "text-blue-500 font-medium" : textSecondary}`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < 4 && (
                        <div className={`h-0.5 flex-1 mx-1 -mt-5 ${
                          currentStep > step.num ? "bg-blue-500" : `${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <form onSubmit={currentStep === 3 ? handleCreate : (e) => { e.preventDefault(); handleNextStep(); }} className="flex flex-col flex-1 overflow-hidden">
                {/* Content scrollable */}
                <div className="overflow-y-auto flex-1 px-6 py-4">
                {/* Étape 1: Informations Générales */}
                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nom de l'établissement *</label>
                      <Input
                        value={form.nomEtablissement}
                        onChange={(e) => setForm(prev => ({ ...prev, nomEtablissement: e.target.value }))}
                        required
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        placeholder="Ex: Lycée Victor Hugo"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Type d'établissement *</label>
                      <select
                        value={form.typeEtablissement}
                        onChange={(e) => setForm(prev => ({ ...prev, typeEtablissement: e.target.value as any }))}
                        required
                        className={`w-full h-9 px-3 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="PRIVE">École privée</option>
                        <option value="PUBLIC">École publique</option>
                        <option value="SEMI_PRIVE">École semi-privée</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Année de création</label>
                        <select
                          value={form.anneeCreation}
                          onChange={(e) => setForm(prev => ({ ...prev, anneeCreation: e.target.value }))}
                          className={`w-full h-9 px-3 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Sélectionner une année</option>
                          {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Code établissement</label>
                        <Input
                          value={form.codeEtablissement}
                          onChange={(e) => setForm(prev => ({ ...prev, codeEtablissement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: LVH2024"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Description</label>
                      <textarea
                        value={form.slogan}
                        onChange={(e) => setForm(prev => ({ ...prev, slogan: e.target.value }))}
                        className={`w-full px-3 py-2 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none`}
                        placeholder="Brève description de l'école"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 2: Coordonnées */}
                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Adresse *</label>
                      <Input
                        value={form.adresse}
                        onChange={(e) => setForm(prev => ({ ...prev, adresse: e.target.value }))}
                        required
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        placeholder="Ex: 123 Avenue de la Liberté"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Ville *</label>
                        <Input
                          value={form.ville}
                          onChange={(e) => setForm(prev => ({ ...prev, ville: e.target.value }))}
                          required
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: Kinshasa"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Province *</label>
                        <Input
                          value={form.province}
                          onChange={(e) => setForm(prev => ({ ...prev, province: e.target.value }))}
                          required
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: Kinshasa"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Téléphone *</label>
                        <Input
                          value={form.telephone}
                          onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                          required
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="+243 XXX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Email *</label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="contact@ecole.cd"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Site Web</label>
                      <Input
                        value={form.siteWeb}
                        onChange={(e) => setForm(prev => ({ ...prev, siteWeb: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        placeholder="https://www.ecole.cd"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 3: Direction & Personnel */}
                {currentStep === 3 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nom du directeur *</label>
                      <Input
                        value={form.directeurNom}
                        onChange={(e) => setForm(prev => ({ ...prev, directeurNom: e.target.value }))}
                        required
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        placeholder="Nom complet du directeur"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Téléphone directeur *</label>
                        <Input
                          value={form.directeurTelephone}
                          onChange={(e) => setForm(prev => ({ ...prev, directeurTelephone: e.target.value }))}
                          required
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="+243 XXX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Email directeur</label>
                        <Input
                          type="email"
                          value={form.directeurEmail}
                          onChange={(e) => setForm(prev => ({ ...prev, directeurEmail: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="directeur@ecole.cd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Secrétaire académique</label>
                        <Input
                          value={form.secretaireAcademique}
                          onChange={(e) => setForm(prev => ({ ...prev, secretaireAcademique: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Nom du secrétaire"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Comptable</label>
                        <Input
                          value={form.comptable}
                          onChange={(e) => setForm(prev => ({ ...prev, comptable: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Nom du comptable"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Personnel administratif total</label>
                      <Input
                        type="number"
                        value={form.personnelAdministratifTotal}
                        onChange={(e) => setForm(prev => ({ ...prev, personnelAdministratifTotal: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        placeholder="Ex: 15"
                      />
                    </div>

                    <div className={`pt-2 pb-1 border-t ${borderColor}`}>
                      <h4 className={`text-xs font-semibold ${textColor}`}>Informations légales</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>RCCM</label>
                        <Input
                          value={form.rccm}
                          onChange={(e) => setForm(prev => ({ ...prev, rccm: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="CD/XXX/XXX"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>ID National</label>
                        <Input
                          value={form.idNat}
                          onChange={(e) => setForm(prev => ({ ...prev, idNat: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="ID Nat."
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>NIF</label>
                        <Input
                          value={form.nif}
                          onChange={(e) => setForm(prev => ({ ...prev, nif: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="NIF"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Agrément ministériel</label>
                        <Input
                          value={form.agrementMinisteriel}
                          onChange={(e) => setForm(prev => ({ ...prev, agrementMinisteriel: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="N° Agrément"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Date agrément</label>
                        <Input
                          type="date"
                          value={form.dateAgrement}
                          onChange={(e) => setForm(prev => ({ ...prev, dateAgrement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 4: Informations académiques */}
                {currentStep === 4 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Cycles d'enseignement</label>
                      <Input
                        value={form.cycles}
                        onChange={(e) => setForm(prev => ({ ...prev, cycles: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                        placeholder="Ex: Maternel, Primaire, Secondaire"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre de classes</label>
                        <Input
                          type="number"
                          value={form.nombreClasses}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreClasses: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: 24"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre d'élèves</label>
                        <Input
                          type="number"
                          value={form.nombreEleves}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreEleves: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: 600"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre d'enseignants</label>
                        <Input
                          type="number"
                          value={form.nombreEnseignants}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreEnseignants: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: 35"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Langue d'enseignement</label>
                        <Input
                          value={form.langueEnseignement}
                          onChange={(e) => setForm(prev => ({ ...prev, langueEnseignement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: Français"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Jours d'ouverture</label>
                        <Input
                          value={form.joursOuverture}
                          onChange={(e) => setForm(prev => ({ ...prev, joursOuverture: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                          placeholder="Ex: Lundi - Vendredi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Programmes</label>
                      <textarea
                        value={form.programmes}
                        onChange={(e) => setForm(prev => ({ ...prev, programmes: e.target.value }))}
                        className={`w-full px-3 py-2 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none`}
                        placeholder="Programmes d'enseignement suivis"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 5: Abonnement */}
                {currentStep === 5 && (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-semibold ${textColor} mb-3`}>Choisissez une formule d'abonnement</h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Basic", price: "50$", features: ["10 utilisateurs", "Support email", "Stockage 5GB"] },
                        { name: "Premium", price: "150$", features: ["50 utilisateurs", "Support prioritaire", "Stockage 50GB"] },
                        { name: "Enterprise", price: "300$", features: ["Utilisateurs illimités", "Support 24/7", "Stockage illimité"] }
                      ].map((plan) => (
                        <div
                          key={plan.name}
                          onClick={() => setForm(prev => ({ ...prev, formule: plan.name as any }))}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            form.formule === plan.name
                              ? "border-blue-500 bg-blue-500/10"
                              : `${borderColor} ${hoverBg}`
                          }`}
                        >
                          <h5 className={`text-sm font-semibold ${textColor} mb-1`}>{plan.name}</h5>
                          <p className="text-xl font-bold text-blue-500 mb-2">{plan.price}/mois</p>
                          <ul className={`space-y-0.5 text-[11px] ${textSecondary}`}>
                            {plan.features.map((f, i) => (
                              <li key={i}>✓ {f}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {error && (
                <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-700 px-6 pb-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-1.5 text-sm rounded-lg ${textSecondary} hover:${textColor} transition-colors`}
                >
                  Annuler
                </button>

                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={creating}
                      className={`px-4 py-1.5 text-sm rounded-lg border ${borderColor} ${textColor} ${hoverBg} transition-colors`}
                    >
                      Précédent
                    </button>
                  )}
                  
                  {currentStep < 5 ? (
                    <Button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 text-sm h-auto"
                    >
                      Étape suivante →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 text-sm h-auto"
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></div>
                          Création...
                        </>
                      ) : (
                        "Créer l'école"
                      )}
                    </Button>
                  )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/50" onClick={() => !loggingOut && setShowLogoutModal(false)} />
            
            <div className={`relative w-full max-w-md rounded-xl ${cardBg} border ${borderColor} shadow-2xl p-6 animate-in zoom-in-95 duration-200`}>
              {loggingOut ? (
                // Loading state
                <div className="text-center py-8">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <LogOut className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>Déconnexion en cours...</h3>
                  <p className={textSecondary}>Veuillez patienter</p>
                </div>
              ) : (
                // Confirmation state
                <>
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                      <LogOut className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-semibold text-center mb-2 ${textColor}`}>
                    Voulez-vous vous déconnecter ?
                  </h3>
                  <p className={`text-center mb-6 ${textSecondary}`}>
                    Vous serez redirigé vers la page de connexion.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className={`flex-1 px-4 py-2.5 rounded-lg border ${borderColor} ${textColor} ${hoverBg} transition-colors font-medium`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmLogout}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
                    >
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
      </div>
    </div>
  )
}
