"use client"

import { useEffect, useState } from "react"
import { 
  Users, 
  School, 
  ClipboardCheck, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: "...",
    teachers: "...",
    classes: "...",
    attendance: "..."
  })
  const [theme, setTheme] = useState<"light" | "dark">("light")

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

  const fetchStats = async () => {
    try {
      // Récupérer les statistiques des étudiants
      const studentsRes = await fetch('/api/admin/students?pageSize=1')
      const studentsText = await studentsRes.text()
      const studentsData = studentsText ? JSON.parse(studentsText) : { total: 0 }
      
      // Récupérer les statistiques des enseignants
      const teachersRes = await fetch('/api/admin/teachers?pageSize=1')
      const teachersText = await teachersRes.text()
      const teachersData = teachersText ? JSON.parse(teachersText) : { total: 0 }
      
      // Récupérer les métadonnées (classes)
      const metaRes = await fetch('/api/admin/meta')
      const metaText = await metaRes.text()
      const metaData = metaText ? JSON.parse(metaText) : { classes: [] }

      setStats({
        students: studentsData.total || 0,
        teachers: teachersData.total || 0,
        classes: metaData.classes?.length || 0,
        attendance: "94%" // Placeholder pour l'instant
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      setStats({
        students: "Erreur",
        teachers: "Erreur", 
        classes: "Erreur",
        attendance: "Erreur"
      })
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-300"

  return (
    <div>
      {/* Dashboard Content */}
      <div id="dashboard">
        <h2 className={`text-2xl font-bold ${textColor} mb-6`}>Tableau de bord</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${bgCard} rounded-lg shadow p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textSecondary}>Élèves</p>
                <h3 className={`text-2xl font-bold ${textColor}`}>{stats.students}</h3>
                <p className="text-green-500 text-sm mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> 12% vs mois dernier
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${theme === "dark" ? "bg-indigo-900" : "bg-indigo-100"} flex items-center justify-center`}>
                <Users className={`w-6 h-6 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
            </div>
          </div>
          
          <div className={`${bgCard} rounded-lg shadow p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textSecondary}>Enseignants</p>
                <h3 className={`text-2xl font-bold ${textColor}`}>{stats.teachers}</h3>
                <p className="text-green-500 text-sm mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> 5% vs mois dernier
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${theme === "dark" ? "bg-blue-900" : "bg-blue-100"} flex items-center justify-center`}>
                <Users className={`w-6 h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
              </div>
            </div>
          </div>
          
          <div className={`${bgCard} rounded-lg shadow p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textSecondary}>Classes</p>
                <h3 className={`text-2xl font-bold ${textColor}`}>{stats.classes}</h3>
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-1" /> 2% vs mois dernier
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${theme === "dark" ? "bg-green-900" : "bg-green-100"} flex items-center justify-center`}>
                <School className={`w-6 h-6 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
              </div>
            </div>
          </div>
          
          <div className={`${bgCard} rounded-lg shadow p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textSecondary}>Taux de présence</p>
                <h3 className={`text-2xl font-bold ${textColor}`}>{stats.attendance}</h3>
                <p className="text-green-500 text-sm mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> 3% vs mois dernier
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${theme === "dark" ? "bg-purple-900" : "bg-purple-100"} flex items-center justify-center`}>
                <ClipboardCheck className={`w-6 h-6 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`${bgCard} rounded-lg shadow p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${textColor}`}>Présence par classe</h3>
              <select className={`border ${borderColor} ${bgCard} ${textColor} rounded-md px-3 py-1 text-sm`}>
                <option>Ce mois</option>
                <option>Le mois dernier</option>
                <option>Cette année</option>
              </select>
            </div>
            <div className="chart-container">
              <canvas id="attendanceChart" />
            </div>
          </div>
          
          <div className={`${bgCard} rounded-lg shadow p-6 border ${borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${textColor}`}>Répartition des élèves</h3>
              <select className={`border ${borderColor} ${bgCard} ${textColor} rounded-md px-3 py-1 text-sm`}>
                <option>Toutes filières</option>
                <option>Scientifique</option>
                <option>Littéraire</option>
                <option>Technique</option>
              </select>
            </div>
            <div className="chart-container">
              <canvas id="studentsChart" />
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className={`${bgCard} rounded-lg shadow overflow-hidden mb-8 border ${borderColor}`}>
          <div className={`px-6 py-4 border-b ${borderColor}`}>
            <h3 className={`font-semibold ${textColor}`}>Activité récente</h3>
          </div>
          <div className={`divide-y ${borderColor}`}>
            <div className="px-6 py-4 flex items-start">
              <div className={`w-10 h-10 rounded-full ${theme === "dark" ? "bg-indigo-900" : "bg-indigo-100"} flex items-center justify-center mr-4`}>
                <Users className={`w-5 h-5 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${textColor}`}>Nouvel élève inscrit</p>
                <p className={`text-sm ${textSecondary}`}>Jean Dupont a été ajouté à la classe Terminale A</p>
                <p className={`text-xs ${textSecondary} mt-1`}>Il y a 2 heures</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-start">
              <div className={`w-10 h-10 rounded-full ${theme === "dark" ? "bg-blue-900" : "bg-blue-100"} flex items-center justify-center mr-4`}>
                <School className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${textColor}`}>Nouvelle matière ajoutée</p>
                <p className={`text-sm ${textSecondary}`}>Philosophie a été ajoutée au programme de Terminale</p>
                <p className={`text-xs ${textSecondary} mt-1`}>Il y a 5 heures</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-start">
              <div className={`w-10 h-10 rounded-full ${theme === "dark" ? "bg-green-900" : "bg-green-100"} flex items-center justify-center mr-4`}>
                <ClipboardCheck className={`w-5 h-5 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${textColor}`}>Présences mises à jour</p>
                <p className={`text-sm ${textSecondary}`}>M. Martin a mis à jour les présences pour la classe 1ère B</p>
                <p className={`text-xs ${textSecondary} mt-1`}>Il y a 1 jour</p>
              </div>
            </div>
          </div>
          <div className={`px-6 py-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} border-t ${borderColor} text-center`}>
            <a href="#" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Voir toute l'activité</a>
          </div>
        </div>
      </div>
    </div>
  )
}
