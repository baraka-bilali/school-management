"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Users, Building2, CreditCard, DollarSign, Search, Plus, Pencil, Trash2, Bell, Moon, Sun, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Portal from "@/components/portal"

type School = { id: number; name: string; code: string; address?: string | null; createdAt: string }
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
  const [form, setForm] = useState({ name: "", code: "", address: "" })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
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
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Non authentifié ou pas les bonnes permissions
          router.push('/super-admin/login')
          return
        }
        throw new Error(data.error || 'Erreur')
      }
      setSchools(data.schools)
    } catch (e: any) {
      console.error(e)
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      localStorage.removeItem('token')
      router.push('/super-admin/login')
    } catch (e) {
      console.error(e)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  // Modal animation effects
  useEffect(() => {
    if (showCreateModal) {
      setModalMounted(true)
      const id = setTimeout(() => setModalVisible(true), 10)
      return () => clearTimeout(id)
    }
    setModalVisible(false)
    const t = setTimeout(() => setModalMounted(false), 220)
    return () => clearTimeout(t)
  }, [showCreateModal])

  // Reset form when modal opens
  useEffect(() => {
    if (showCreateModal) {
      setForm({ name: "", code: "", address: "" })
      setError("")
    }
  }, [showCreateModal])

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
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
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
                schools.slice(0, 5).map((school, i) => (
                  <tr key={school.id} className={`${hoverBg} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${textColor}`}>{school.name}</div>
                      <div className={`text-sm ${textSecondary}`}>Code: {school.code}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                      {new Date(school.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {i % 3 === 0 ? "Premium" : i % 3 === 1 ? "Enterprise" : "Basic"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        i % 4 === 0 ? "bg-green-500/10 text-green-500" : 
                        i % 4 === 1 ? "bg-green-500/10 text-green-500" :
                        i % 4 === 2 ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        • {i % 4 === 0 || i % 4 === 1 ? "Actif" : i % 4 === 2 ? "En attente" : "Expiré"}
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
                  filteredSchools.map((school, i) => (
                    <tr key={school.id} className={`${hoverBg} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${textColor}`}>{school.name}</div>
                        <div className={`text-sm ${textSecondary}`}>Code: {school.code}</div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                        {new Date(school.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={`px-6 py-4 text-sm ${textColor}`}>
                        {i % 3 === 0 ? "Premium" : i % 3 === 1 ? "Enterprise" : "Basic"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          i % 4 === 0 ? "bg-green-500/10 text-green-500" : 
                          i % 4 === 1 ? "bg-green-500/10 text-green-500" :
                          i % 4 === 2 ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          • {i % 4 === 0 || i % 4 === 1 ? "Actif" : i % 4 === 2 ? "En attente" : "Expiré"}
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
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
              modalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!modalVisible}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            
            <div 
              className={`relative w-full max-w-lg rounded-xl ${cardBg} border ${borderColor} shadow-2xl transform transition-all duration-200 ${
                modalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              role="dialog"
              aria-modal="true"
            >
              <div className={`p-6 border-b ${borderColor}`}>
                <h2 className={`text-xl font-semibold ${textColor}`}>Créer une nouvelle école</h2>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Nom de l'école</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className={`${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                    placeholder="Ex: École Les Chênes"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>Code unique</label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                    required
                    className={`${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                    placeholder="Ex: ECH2023"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Adresse (optionnel)</label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                    className={`${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900"}`}
                    placeholder="Ex: 123 Rue de la Liberté"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`px-4 py-2 rounded-lg border ${borderColor} ${textColor} ${hoverBg} transition-colors`}
                  >
                    Annuler
                  </button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {creating ? "Création..." : "Créer l'école"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
      </div>
    </div>
  )
}
