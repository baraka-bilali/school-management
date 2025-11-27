"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { authFetch } from "@/lib/auth-fetch"
import { CreditCard, Calendar, AlertCircle, CheckCircle, Clock, PlayCircle, StopCircle, Mail, Phone } from "lucide-react"

interface School {
  id: number
  nomEtablissement: string
  etatCompte: string
  dateDebutAbonnement: string | null
  dateFinAbonnement: string | null
  typePaiement: string | null
  montantPaye: number | null
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
    if (!school) return { label: "Inconnu", color: "gray", icon: AlertCircle }
    
    const daysRemaining = calculateDaysRemaining()
    
    if (school.etatCompte === "ACTIF") {
      if (daysRemaining === null) {
        return { label: "Actif", color: "green", icon: CheckCircle }
      }
      if (daysRemaining <= 0) {
        return { label: "Expiré", color: "red", icon: AlertCircle }
      }
      if (daysRemaining <= 15) {
        return { label: `Expire bientôt (${daysRemaining}j)`, color: "orange", icon: Clock }
      }
      return { label: "Actif", color: "green", icon: CheckCircle }
    }
    
    if (school.etatCompte === "SUSPENDU") {
      return { label: "Suspendu", color: "red", icon: AlertCircle }
    }
    
    if (school.etatCompte === "INACTIF") {
      return { label: "Inactif", color: "gray", icon: AlertCircle }
    }
    
    return { label: school.etatCompte, color: "gray", icon: AlertCircle }
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

  const statusColors = {
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Abonnement</h1>
          <p className={textSecondary}>Gérez votre abonnement et consultez les informations de paiement</p>
        </div>

        {/* Statut de l'abonnement */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Statut de l'abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {/* Point de statut animé */}
                <div className={`w-4 h-4 rounded-full absolute -top-1 -right-1 z-10 ${
                  statusInfo.color === "green" ? "bg-green-500" : 
                  statusInfo.color === "orange" ? "bg-orange-500" : 
                  "bg-red-500"
                }`}>
                  <div className={`absolute inset-0 rounded-full animate-ping ${
                    statusInfo.color === "green" ? "bg-green-500" : 
                    statusInfo.color === "orange" ? "bg-orange-500" : 
                    "bg-red-500"
                  }`}></div>
                </div>
                <StatusIcon className={`w-12 h-12 ${statusInfo.color === "green" ? "text-green-500" : statusInfo.color === "orange" ? "text-orange-500" : statusInfo.color === "red" ? "text-red-500" : "text-gray-500"}`} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[statusInfo.color as keyof typeof statusColors]}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className={`${textSecondary} text-sm mt-2`}>
                  {school.nomEtablissement}
                </p>
              </div>
            </div>

            {daysRemaining !== null && daysRemaining > 0 && (
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
                <p className={`${textColor} font-medium`}>
                  Jours restants : <span className="text-indigo-600 dark:text-indigo-400 text-xl font-bold">{daysRemaining}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline de l'abonnement */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Timeline de l'abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Ligne de progression */}
              <div className="absolute left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-green-500 via-indigo-500 to-red-500"></div>
              
              {/* Début d'abonnement */}
              <div className="relative flex items-start gap-6 mb-12">
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-3">
                  <h3 className={`text-lg font-semibold ${textColor} mb-1`}>Début de l'abonnement</h3>
                  <p className={`${textSecondary} text-sm mb-2`}>{formatDate(school.dateDebutAbonnement)}</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${theme === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}>
                    Activation
                  </div>
                </div>
              </div>

              {/* Aujourd'hui (si l'abonnement est actif) */}
              {daysRemaining !== null && daysRemaining > 0 && (
                <div className="relative flex items-start gap-6 mb-12">
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg animate-pulse">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 pt-3">
                    <h3 className={`text-lg font-semibold ${textColor} mb-1`}>Aujourd'hui</h3>
                    <p className={`${textSecondary} text-sm mb-2`}>{formatDate(new Date().toISOString())}</p>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${theme === "dark" ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`}>
                      {daysRemaining} jours restants
                    </div>
                  </div>
                </div>
              )}

              {/* Fin d'abonnement */}
              <div className="relative flex items-start gap-6">
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-full ${daysRemaining !== null && daysRemaining <= 0 ? "bg-red-500" : "bg-gray-400"} flex items-center justify-center shadow-lg`}>
                    <StopCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-3">
                  <h3 className={`text-lg font-semibold ${textColor} mb-1`}>Fin de l'abonnement</h3>
                  <p className={`${textSecondary} text-sm mb-2`}>{formatDate(school.dateFinAbonnement)}</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    daysRemaining !== null && daysRemaining <= 0 
                      ? theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                      : theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-700"
                  }`}>
                    {daysRemaining !== null && daysRemaining <= 0 ? "Expiré" : "À venir"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détails de l'abonnement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dates */}
          <Card theme={theme}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Période d'abonnement
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className={`${textSecondary} text-sm mb-1`}>Date de début</p>
                <p className={`${textColor} font-medium`}>{formatDate(school.dateDebutAbonnement)}</p>
              </div>
              <div>
                <p className={`${textSecondary} text-sm mb-1`}>Date de fin</p>
                <p className={`${textColor} font-medium`}>{formatDate(school.dateFinAbonnement)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Paiement */}
          <Card theme={theme}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informations de paiement
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className={`${textSecondary} text-sm mb-1`}>Type de paiement</p>
                <p className={`${textColor} font-medium`}>{school.typePaiement || "Non défini"}</p>
              </div>
              <div>
                <p className={`${textSecondary} text-sm mb-1`}>Montant payé</p>
                <p className={`${textColor} font-medium text-xl`}>{formatMontant(school.montantPaye)} USD</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions - Contact Service */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${textSecondary} mb-6`}>
              Pour renouveler votre abonnement, modifier vos informations de paiement ou toute autre question, 
              notre équipe est à votre disposition.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bouton Email */}
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                <Mail className="w-5 h-5" />
                <span>Envoyer un email</span>
              </button>

              {/* Bouton Téléphone */}
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                <Phone className="w-5 h-5" />
                <span>Appeler le support</span>
              </button>
            </div>

            {/* Informations de contact */}
            <div className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
              <p className={`${textSecondary} text-sm`}>
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
