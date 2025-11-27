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

        {/* Timeline de l'abonnement - Horizontale */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Progression de l'abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8">
              {/* Conteneur Timeline Horizontale */}
              <div className="relative max-w-4xl mx-auto px-4">
                {/* Structure avec tiges verticales */}
                <div className="flex items-center justify-between">
                  {/* Étape 1 : Début - positionné à gauche */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ${theme === "dark" ? "bg-green-500" : "bg-green-500"} ring-4 ring-offset-2 ${theme === "dark" ? "ring-green-500/30 ring-offset-gray-800" : "ring-green-500/20 ring-offset-white"}`}>
                      <PlayCircle className="w-5 h-5 text-white" />
                    </div>
                    {/* Tige vers la barre - colle au cercle */}
                    <div className={`w-0.5 h-8 bg-green-500 -mt-1`}></div>
                  </div>

                  {/* Étape 2 : Aujourd'hui */}
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl bg-indigo-500 ring-4 ring-offset-2 ${theme === "dark" ? "ring-indigo-500/30 ring-offset-gray-800" : "ring-indigo-500/20 ring-offset-white"} animate-pulse`}>
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      {/* Tige vers la barre - colle au cercle */}
                      <div className={`w-0.5 h-8 bg-indigo-500 -mt-1`}></div>
                    </div>
                  )}

                  {/* Étape 3 : Fin - positionné à droite */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ring-4 ring-offset-2 ${
                      daysRemaining !== null && daysRemaining <= 0 
                        ? `bg-red-500 ${theme === "dark" ? "ring-red-500/30 ring-offset-gray-800" : "ring-red-500/20 ring-offset-white"}`
                        : `${theme === "dark" ? "bg-gray-600" : "bg-gray-400"} ${theme === "dark" ? "ring-gray-600/30 ring-offset-gray-800" : "ring-gray-400/20 ring-offset-white"}`
                    }`}>
                      <StopCircle className="w-5 h-5 text-white" />
                    </div>
                    {/* Tige vers la barre - colle au cercle */}
                    <div className={`w-0.5 h-8 -mt-1 ${
                      daysRemaining !== null && daysRemaining <= 0 ? "bg-red-500" : theme === "dark" ? "bg-gray-600" : "bg-gray-400"
                    }`}></div>
                  </div>
                </div>

                {/* Barre de progression horizontale */}
                <div className="relative mb-8">
                  <div className={`h-3 w-full rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
                    {/* Barre de progression colorée */}
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-green-500 via-indigo-500 to-indigo-600 transition-all duration-500"
                        style={{
                          width: school.dateDebutAbonnement && school.dateFinAbonnement
                            ? `${Math.min(100, Math.max(0, ((new Date().getTime() - new Date(school.dateDebutAbonnement).getTime()) / (new Date(school.dateFinAbonnement).getTime() - new Date(school.dateDebutAbonnement).getTime())) * 100))}%`
                            : '0%'
                        }}
                      ></div>
                    )}
                    {daysRemaining !== null && daysRemaining <= 0 && (
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-green-500 via-indigo-500 to-red-500"></div>
                    )}
                  </div>
                </div>

                {/* Cartes d'information en dessous */}
                <div className="flex items-start justify-between">
                  {/* Info Début */}
                  <div className="flex justify-start" style={{ width: '33.333%' }}>
                    <div className={`text-center px-4 py-3 rounded-lg ${theme === "dark" ? "bg-gray-700/80" : "bg-white"} shadow-md border ${theme === "dark" ? "border-gray-600" : "border-gray-200"} max-w-[140px]`}>
                      <p className={`text-xs font-semibold ${textSecondary} uppercase tracking-wide mb-1`}>Début</p>
                      <p className={`${textColor} font-bold text-sm`}>{formatDate(school.dateDebutAbonnement)}</p>
                    </div>
                  </div>

                  {/* Info Aujourd'hui */}
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <div className="flex justify-center" style={{ width: '33.333%' }}>
                      <div className={`text-center px-4 py-3 rounded-lg ${theme === "dark" ? "bg-indigo-900/40" : "bg-indigo-50"} shadow-md border-2 ${theme === "dark" ? "border-indigo-500/50" : "border-indigo-300"} max-w-[160px]`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${theme === "dark" ? "text-indigo-400" : "text-indigo-700"}`}>Aujourd'hui</p>
                        <p className={`font-bold text-sm ${theme === "dark" ? "text-indigo-300" : "text-indigo-900"}`}>{formatDate(new Date().toISOString())}</p>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${theme === "dark" ? "bg-indigo-500/30 text-indigo-200" : "bg-indigo-200 text-indigo-800"}`}>
                          {daysRemaining}j restants
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Fin */}
                  <div className="flex justify-end" style={{ width: '33.333%' }}>
                    <div className={`text-center px-4 py-3 rounded-lg ${
                      daysRemaining !== null && daysRemaining <= 0 
                        ? theme === "dark" ? "bg-red-900/40" : "bg-red-50"
                        : theme === "dark" ? "bg-gray-700/80" : "bg-white"
                    } shadow-md border ${
                      daysRemaining !== null && daysRemaining <= 0
                        ? theme === "dark" ? "border-red-500/50" : "border-red-300"
                        : theme === "dark" ? "border-gray-600" : "border-gray-200"
                    } max-w-[140px]`}>
                      <p className={`text-xs font-semibold ${
                        daysRemaining !== null && daysRemaining <= 0
                          ? theme === "dark" ? "text-red-400" : "text-red-700"
                          : textSecondary
                      } uppercase tracking-wide mb-1`}>Fin</p>
                      <p className={`${
                        daysRemaining !== null && daysRemaining <= 0
                          ? theme === "dark" ? "text-red-300" : "text-red-900"
                          : textColor
                      } font-bold text-sm`}>{formatDate(school.dateFinAbonnement)}</p>
                      {daysRemaining !== null && daysRemaining <= 0 && (
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${theme === "dark" ? "bg-red-500/30 text-red-200" : "bg-red-200 text-red-800"}`}>
                          Expiré
                        </div>
                      )}
                    </div>
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
