"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import { CreditCard, Calendar, AlertCircle, CheckCircle, Clock, Mail, Phone, Sparkles } from "lucide-react"

interface School {
  id: number
  nomEtablissement: string
  etatCompte: string
  dateDebutAbonnement: string | null
  dateFinAbonnement: string | null
  typePaiement: string | null
  montantPaye: number | null
}

// Composant pour le cercle de progression
const CircularProgress = ({ 
  percentage, 
  daysRemaining, 
  status,
  theme 
}: { 
  percentage: number
  daysRemaining: number | null
  status: string
  theme: "light" | "dark"
}) => {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Couleurs basées sur le statut
  const getGradientColors = () => {
    if (status === "EXPIRÉ" || daysRemaining !== null && daysRemaining <= 0) {
      return { from: "#ef4444", to: "#dc2626" } // Rouge
    }
    if (daysRemaining !== null && daysRemaining <= 15) {
      return { from: "#f97316", to: "#ea580c" } // Orange
    }
    return { from: "#14b8a6", to: "#0d9488" } // Teal (Hostinger style)
  }

  const colors = getGradientColors()

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: colors.from, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: colors.to, stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Cercle de fond */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
          strokeWidth="12"
          fill="none"
        />
        
        {/* Cercle de progression */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: "drop-shadow(0 0 8px rgba(20, 184, 166, 0.4))"
          }}
        />
      </svg>
      
      {/* Contenu au centre du cercle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          {daysRemaining !== null && daysRemaining > 0 ? (
            <>
              <div className={`text-5xl font-bold ${
                daysRemaining <= 15 
                  ? "text-orange-500" 
                  : "text-teal-500"
              }`}>
                {daysRemaining}
              </div>
              <div className={`text-sm font-medium mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                jours restants
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-red-500">Expiré</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  useEffect(() => {
    fetchSchoolData()
  }, [])

  const fetchSchoolData = async () => {
    try {
      setLoading(true)
      const response = await authFetch("/api/admin/school")
      const data = await response.json()
      setSchool(data.school)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysRemaining = () => {
    if (!school?.dateFinAbonnement) return null
    const today = new Date()
    const endDate = new Date(school.dateFinAbonnement)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non défini"
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatMontant = (montant: number | null) => {
    if (!montant) return "0"
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant)
  }

  const getStatusInfo = () => {
    if (!school) return { label: "Inconnu", color: "gray", icon: AlertCircle, status: "INCONNU" }
    
    const daysRemaining = calculateDaysRemaining()
    
    if (school.etatCompte === "ACTIF") {
      if (daysRemaining === null) {
        return { label: "Actif", color: "teal", icon: CheckCircle, status: "ACTIF" }
      }
      if (daysRemaining <= 0) {
        return { label: "Expiré", color: "red", icon: AlertCircle, status: "EXPIRÉ" }
      }
      if (daysRemaining <= 15) {
        return { label: "Expire bientôt", color: "orange", icon: Clock, status: "EXPIRE_BIENTOT" }
      }
      return { label: "Actif", color: "teal", icon: CheckCircle, status: "ACTIF" }
    }
    
    if (school.etatCompte === "SUSPENDU") {
      return { label: "Suspendu", color: "red", icon: AlertCircle, status: "SUSPENDU" }
    }
    
    if (school.etatCompte === "INACTIF") {
      return { label: "Inactif", color: "gray", icon: AlertCircle, status: "INACTIF" }
    }
    
    return { label: school.etatCompte, color: "gray", icon: AlertCircle, status: school.etatCompte }
  }

  const calculateProgress = () => {
    if (!school?.dateDebutAbonnement || !school?.dateFinAbonnement) return 0
    
    const now = new Date().getTime()
    const start = new Date(school.dateDebutAbonnement).getTime()
    const end = new Date(school.dateFinAbonnement).getTime()
    
    const progress = ((now - start) / (end - start)) * 100
    return Math.min(100, Math.max(0, progress))
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={textSecondary}>Chargement...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!school) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-32">
            <p className={textColor}>Aucune donnée d'abonnement disponible</p>
          </div>
        </div>
      </Layout>
    )
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  const daysRemaining = calculateDaysRemaining()
  const progress = calculateProgress()

  const statusColors = {
    teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* En-tête avec badge de statut */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textColor} mb-2`}>Abonnement</h1>
            <p className={textSecondary}>Gérez votre abonnement et consultez les informations</p>
          </div>
          
          <span className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 ${statusColors[statusInfo.color as keyof typeof statusColors]}`}>
            <StatusIcon className="w-4 h-4" />
            {statusInfo.label}
          </span>
        </div>

        {/* Carte principale avec cercle de progression (style Hostinger) */}
        <Card theme={theme}>
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Cercle de progression */}
              <div className="flex-shrink-0">
                <CircularProgress 
                  percentage={progress}
                  daysRemaining={daysRemaining}
                  status={statusInfo.status}
                  theme={theme}
                />
              </div>

              {/* Informations à droite du cercle */}
              <div className="flex-1 space-y-6 w-full">
                {/* Nom de l'établissement */}
                <div>
                  <p className={`${textSecondary} text-sm font-medium mb-1`}>Établissement</p>
                  <h2 className={`${textColor} text-2xl font-bold`}>{school.nomEtablissement}</h2>
                </div>

                {/* Dates d'abonnement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 ${textSecondary}`} />
                      <p className={`${textSecondary} text-xs font-semibold uppercase tracking-wide`}>Date de début</p>
                    </div>
                    <p className={`${textColor} text-lg font-semibold`}>{formatDate(school.dateDebutAbonnement)}</p>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    daysRemaining !== null && daysRemaining <= 15 
                      ? theme === "dark" ? "bg-orange-900/20 border-orange-700" : "bg-orange-50 border-orange-200"
                      : theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className={`w-4 h-4 ${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-500" : textSecondary}`} />
                      <p className={`${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-500" : textSecondary} text-xs font-semibold uppercase tracking-wide`}>Date d'expiration</p>
                    </div>
                    <p className={`${daysRemaining !== null && daysRemaining <= 15 ? "text-orange-600 dark:text-orange-400" : textColor} text-lg font-semibold`}>
                      {formatDate(school.dateFinAbonnement)}
                    </p>
                  </div>
                </div>

                {/* Bouton de renouvellement (style Hostinger) */}
                {daysRemaining !== null && daysRemaining <= 30 && (
                  <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Renouveler l'abonnement
                  </button>
                )}
              </div>
            </div>

            {/* Barre de progression en bas (optionnel, plus subtil) */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className={`${textSecondary} text-sm font-medium`}>Progression de la période</p>
                <p className={`${textColor} text-sm font-semibold`}>{Math.round(progress)}%</p>
              </div>
              <div className={`h-2 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de paiement */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informations de paiement
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className={`${textSecondary} text-sm font-medium mb-2`}>Type de paiement</p>
                <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`${textColor} font-semibold`}>{school.typePaiement || "Non défini"}</p>
                </div>
              </div>
              <div>
                <p className={`${textSecondary} text-sm font-medium mb-2`}>Montant payé</p>
                <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`${textColor} text-2xl font-bold`}>{formatMontant(school.montantPaye)} <span className="text-lg font-normal">USD</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Besoin d'aide */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${textSecondary} mb-6`}>
              Pour renouveler votre abonnement, modifier vos informations de paiement ou toute autre question, 
              notre équipe est à votre disposition.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Mail className="w-5 h-5" />
                <span>Envoyer un email</span>
              </button>

              <button className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all font-semibold">
                <Phone className="w-5 h-5" />
                <span>Appeler le support</span>
              </button>
            </div>

            <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
              <p className={`${textSecondary} text-sm leading-relaxed`}>
                <strong className={textColor}>Email :</strong> support@digischool.com<br />
                <strong className={textColor}>Téléphone :</strong> +243 XXX XXX XXX<br />
                <strong className={textColor}>Horaires :</strong> Lun - Ven : 8h00 - 17h00
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
