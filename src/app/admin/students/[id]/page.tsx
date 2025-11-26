"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Layout from "@/components/layout"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Users, 
  Heart, 
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit
} from "lucide-react"

interface StudentDetails {
  id: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  gender: string
  birthDate: string
  user: {
    email: string
    telephone: string | null
    isActive: boolean
    school: {
      nomEtablissement: string
    } | null
  }
  enrollments: Array<{
    status: string
    class: {
      name: string
      level: string
      section: string
      stream: string | null
    }
    year: {
      name: string
    }
  }>
}

export default function StudentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  
  // États pour gérer l'ouverture/fermeture des sections
  const [openSections, setOpenSections] = useState({
    identification: true,
    administratif: true,
    coordonnees: true,
    parents: true,
    medical: true,
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (currentTheme) setTheme(currentTheme)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("themeChange", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("themeChange", handleStorageChange)
    }
  }, [])

  useEffect(() => {
    fetchStudentDetails()
  }, [params.id])

  const fetchStudentDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/students/${params.id}`, {
        credentials: "include"
      })
      
      if (res.ok) {
        const data = await res.json()
        setStudent(data.student)
      } else {
        const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        setError(errorData.error || "Erreur lors de la récupération des détails")
      }
    } catch (error) {
      console.error("Erreur:", error)
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Thèmes
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const textMuted = theme === "dark" ? "text-gray-500" : "text-gray-500"

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={textSecondary}>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !student) {
    return (
      <Layout>
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="text-center p-8">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`${textColor} text-xl font-semibold mb-2`}>{error || "Élève introuvable"}</p>
            <p className={`${textSecondary} mb-6`}>
              {error || `L'élève avec l'ID ${params.id} n'existe pas ou vous n'avez pas l'autorisation d'y accéder.`}
            </p>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const enrollment = student.enrollments[0]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"} transition-colors ${textColor}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${textColor}`}>Détails de l'élève</h1>
              <p className={`${textSecondary} text-sm mt-0.5`}>
                Informations complètes de l'élève
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button className={`px-4 py-2 ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} ${textColor} rounded-lg transition-colors`}>
              Archiver l'élève
            </button>
          </div>
        </div>

        {/* Carte de profil */}
        <div className={`${cardBg} rounded-xl border ${borderColor} p-6 mb-6`}>
          <div className="flex items-start gap-6">
            {/* Photo de profil */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </div>
            </div>
            
            {/* Informations principales */}
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${textColor}`}>
                {student.lastName} {student.middleName} {student.firstName}
              </h2>
              <p className={`${textSecondary} text-sm mt-1`}>
                N° Matricule: <span className="font-medium">{student.code}</span>
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm ${student.user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {student.user.isActive ? 'Actif' : 'Inactif'}
                </span>
                {enrollment && (
                  <span className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {enrollment.class.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Informations d'identification */}
        <div className={`${cardBg} rounded-xl border ${borderColor} mb-4 overflow-hidden`}>
          <button
            onClick={() => toggleSection('identification')}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <h3 className={`text-lg font-semibold ${textColor}`}>
              Informations d'identification
            </h3>
            {openSections.identification ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
            )}
          </button>
          
          {openSections.identification && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`text-sm ${textMuted}`}>Nom</label>
                <p className={`${textColor} font-medium`}>{student.lastName}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Post-nom</label>
                <p className={`${textColor} font-medium`}>{student.middleName}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Prénom</label>
                <p className={`${textColor} font-medium`}>{student.firstName}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Sexe</label>
                <p className={`${textColor} font-medium`}>{student.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Date de naissance</label>
                <p className={`${textColor} font-medium`}>{formatDate(student.birthDate)}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Lieu de naissance</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Nationalité</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Langue(s) parlée(s)</label>
                <p className={`${textSecondary} italic`}>Français, Anglais</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Informations administratives scolaires */}
        <div className={`${cardBg} rounded-xl border ${borderColor} mb-4 overflow-hidden`}>
          <button
            onClick={() => toggleSection('administratif')}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <h3 className={`text-lg font-semibold ${textColor}`}>
              Informations administratives scolaires
            </h3>
            {openSections.administratif ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
            )}
          </button>
          
          {openSections.administratif && enrollment && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`text-sm ${textMuted}`}>Classe</label>
                <p className={`${textColor} font-medium`}>{enrollment.class.name}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Niveau</label>
                <p className={`${textColor} font-medium`}>{enrollment.class.level}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Section</label>
                <p className={`${textColor} font-medium`}>{enrollment.class.section}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Option</label>
                <p className={`${textColor} font-medium`}>{enrollment.class.stream || 'Non spécifié'}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Année scolaire</label>
                <p className={`${textColor} font-medium`}>{enrollment.year.name}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Établissement</label>
                <p className={`${textColor} font-medium`}>{student.user.school?.nomEtablissement || 'Non renseigné'}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Statut de l'élève</label>
                <p className={`${textColor} font-medium`}>{enrollment.status}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Redoublement</label>
                <p className={`${textColor} font-medium`}>Non</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Coordonnées */}
        <div className={`${cardBg} rounded-xl border ${borderColor} mb-4 overflow-hidden`}>
          <button
            onClick={() => toggleSection('coordonnees')}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <h3 className={`text-lg font-semibold ${textColor}`}>Coordonnées</h3>
            {openSections.coordonnees ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
            )}
          </button>
          
          {openSections.coordonnees && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-sm ${textMuted} flex items-center gap-2`}>
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className={`${textColor} font-medium`}>{student.user.email}</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted} flex items-center gap-2`}>
                  <Phone className="w-4 h-4" />
                  Téléphone
                </label>
                <p className={`${textColor} font-medium`}>{student.user.telephone || 'Non renseigné'}</p>
              </div>
              <div className="md:col-span-2">
                <label className={`text-sm ${textMuted} flex items-center gap-2`}>
                  <MapPin className="w-4 h-4" />
                  Adresse complète
                </label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Informations des parents / tuteurs */}
        <div className={`${cardBg} rounded-xl border ${borderColor} mb-4 overflow-hidden`}>
          <button
            onClick={() => toggleSection('parents')}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <h3 className={`text-lg font-semibold ${textColor}`}>
              Informations des parents / tuteurs
            </h3>
            {openSections.parents ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
            )}
          </button>
          
          {openSections.parents && (
            <div className="px-6 pb-6">
              <div className="mb-6">
                <h4 className={`font-semibold ${textColor} mb-3`}>Responsable 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${textMuted}`}>Nom complet</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Profession</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Téléphone</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Email</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className={`font-semibold ${textColor} mb-3`}>Responsable 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm ${textMuted}`}>Nom complet</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Profession</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Téléphone</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                  <div>
                    <label className={`text-sm ${textMuted}`}>Email</label>
                    <p className={`${textSecondary} italic`}>Non renseigné</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Informations médicales */}
        <div className={`${cardBg} rounded-xl border ${borderColor} mb-4 overflow-hidden`}>
          <button
            onClick={() => toggleSection('medical')}
            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <h3 className={`text-lg font-semibold ${textColor}`}>
              Informations médicales
            </h3>
            {openSections.medical ? (
              <ChevronUp className={`w-5 h-5 ${textSecondary}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${textSecondary}`} />
            )}
          </button>
          
          {openSections.medical && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-sm ${textMuted}`}>Groupe sanguin</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Allergies</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
              <div className="md:col-span-2">
                <label className={`text-sm ${textMuted}`}>Problèmes médicaux à surveiller</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Personne à contacter en cas d'urgence</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
              <div>
                <label className={`text-sm ${textMuted}`}>Numéro d'urgence</label>
                <p className={`${textSecondary} italic`}>Non renseigné</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
