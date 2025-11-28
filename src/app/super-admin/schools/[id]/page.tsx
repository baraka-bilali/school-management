"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, Bell, AlertCircle } from "lucide-react"

interface School {
  id: number
  nomEtablissement: string
  typeEtablissement: string
  codeEtablissement?: string
  ville: string
  province: string
  telephone: string
  email: string
  directeurNom: string
  etatCompte: string
  dateCreation: string
  dateFinAbonnement?: string
  planAbonnement?: string
  periodeAbonnement?: string
}

export default function SchoolDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const schoolId = params.id as string
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") setTheme(saved)
  }, [])

  useEffect(() => {
    const loadSchool = async () => {
      try {
        const res = await fetch(`/api/super-admin/schools/${schoolId}`, {
          credentials: 'include'
        })
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push('/super-admin/login')
            return
          }
          throw new Error('Erreur lors du chargement')
        }
        
        const data = await res.json()
        setSchool(data.school)
      } catch (error) {
        console.error('Error loading school:', error)
      } finally {
        setLoading(false)
      }
    }

    if (schoolId) {
      loadSchool()
    }
  }, [schoolId, router])

  // Fonction pour calculer le temps restant de l'abonnement
  const calculateTimeRemaining = () => {
    if (!school?.dateFinAbonnement) return null

    const now = new Date()
    const endDate = new Date(school.dateFinAbonnement)
    const diff = endDate.getTime() - now.getTime()

    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { expired: false, days, hours, minutes }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-white">École non trouvée</div>
      </div>
    )
  }

  const bgColor = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Header avec bouton retour */}
      <div className={`border-b ${borderColor} ${cardBg}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 ${textSecondary} hover:${textColor} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux écoles</span>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne gauche - Carte de l'école */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg sticky top-8">
              {/* Logo/Initiales */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/30">
                  <span className="text-5xl font-bold">
                    {school.nomEtablissement.split(' ').map(word => word[0]).slice(0, 2).join('')}
                  </span>
                </div>
              </div>

              {/* Nom et Code */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">{school.nomEtablissement}</h1>
                {school.codeEtablissement && (
                  <p className="text-white/80 text-sm">Code: {school.codeEtablissement}</p>
                )}
              </div>

              {/* Informations rapides */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/80">Date d'inscription:</span>
                  <span className="font-semibold">{new Date(school.dateCreation).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/80">Formule:</span>
                  <span className="font-semibold">{school.typeEtablissement}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-white/80">Statut:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    school.etatCompte === "ACTIF" ? "bg-green-400 text-green-900" :
                    school.etatCompte === "EN_ATTENTE" ? "bg-yellow-400 text-yellow-900" :
                    "bg-red-400 text-red-900"
                  }`}>
                    • {school.etatCompte === "ACTIF" ? "Actif" : school.etatCompte === "EN_ATTENTE" ? "En attente" : "Suspendu"}
                  </span>
                </div>

                {/* Compte à rebours de l'abonnement */}
                {school.etatCompte === "ACTIF" && school.dateFinAbonnement && (() => {
                  const timeRemaining = calculateTimeRemaining()
                  if (!timeRemaining) return null
                  
                  const isExpiringSoon = timeRemaining.days <= 7 && !timeRemaining.expired
                  
                  return (
                    <div className={`py-3 px-4 rounded-lg border-2 ${
                      timeRemaining.expired 
                        ? "bg-red-500/20 border-red-400" 
                        : isExpiringSoon 
                        ? "bg-yellow-500/20 border-yellow-400" 
                        : "bg-green-500/20 border-green-400"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className={`w-4 h-4 ${
                          timeRemaining.expired ? "text-red-200" : isExpiringSoon ? "text-yellow-200" : "text-green-200"
                        } ${isExpiringSoon || timeRemaining.expired ? 'animate-bounce' : ''}`} />
                        <span className="font-semibold text-white">
                          {timeRemaining.expired ? "Abonnement expiré" : "Temps restant"}
                        </span>
                      </div>
                      {!timeRemaining.expired && (
                        <div className="flex items-center justify-between text-white">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{timeRemaining.days}</div>
                            <div className="text-xs opacity-80">Jours</div>
                          </div>
                          <div className="text-xl opacity-60">:</div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{timeRemaining.hours}</div>
                            <div className="text-xs opacity-80">Heures</div>
                          </div>
                          <div className="text-xl opacity-60">:</div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{timeRemaining.minutes}</div>
                            <div className="text-xs opacity-80">Minutes</div>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-white/70 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>
                          Expire le {new Date(school.dateFinAbonnement).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      {school.planAbonnement && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/70">Plan:</span>
                            <span className="font-semibold capitalize">{school.planAbonnement}</span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-white/70">Période:</span>
                            <span className="font-semibold">{school.periodeAbonnement === 'monthly' ? 'Mensuel' : 'Annuel'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Colonne droite - Informations détaillées */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section Informations sur l'école */}
            <div>
              <h2 className={`text-2xl font-bold ${textColor} mb-4`}>Informations sur l'école</h2>
              
              <div className={`${cardBg} rounded-lg p-6 border ${borderColor} space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide flex items-center gap-2`}>
                      <Building2 className="w-4 h-4" />
                      Nom établissement
                    </label>
                    <p className={`${textColor} font-medium mt-1 text-lg`}>{school.nomEtablissement}</p>
                  </div>
                  {school.codeEtablissement && (
                    <div>
                      <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Code</label>
                      <p className={`${textColor} font-medium mt-1 text-lg`}>{school.codeEtablissement}</p>
                    </div>
                  )}
                  <div>
                    <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Type</label>
                    <p className={`${textColor} font-medium mt-1`}>{school.typeEtablissement}</p>
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide flex items-center gap-2`}>
                      <MapPin className="w-4 h-4" />
                      Ville
                    </label>
                    <p className={`${textColor} font-medium mt-1`}>{school.ville}</p>
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>Province</label>
                    <p className={`${textColor} font-medium mt-1`}>{school.province}</p>
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide flex items-center gap-2`}>
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </label>
                    <p className={`${textColor} font-medium mt-1`}>{school.telephone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className={`text-xs font-medium ${textSecondary} uppercase tracking-wide flex items-center gap-2`}>
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className={`${textColor} font-medium mt-1`}>{school.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Administrateur */}
            <div>
              <h2 className={`text-2xl font-bold ${textColor} mb-4`}>Administrateur</h2>
              
              <div className={`${cardBg} rounded-lg p-6 border ${borderColor}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                    {school.directeurNom.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className={`${textColor} font-semibold text-lg flex items-center gap-2`}>
                      <User className="w-5 h-5" />
                      {school.directeurNom}
                    </p>
                    <p className={`${textSecondary} text-sm`}>Directeur</p>
                  </div>
                </div>
                <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className={`${textSecondary} flex items-center gap-2`}>
                        <Phone className="w-4 h-4" />
                        Contact
                      </label>
                      <p className={`${textColor} font-medium mt-1`}>{school.telephone}</p>
                    </div>
                    <div>
                      <label className={`${textSecondary} flex items-center gap-2`}>
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className={`${textColor} font-medium mt-1`}>{school.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
