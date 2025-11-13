"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, Calendar, CheckCircle, Clock, Bell, AlertCircle } from "lucide-react"
import confetti from "canvas-confetti"

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
  
  // États pour le système d'abonnement
  const [activationStep, setActivationStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState("starter") // starter ou pro
  const [paymentPeriod, setPaymentPeriod] = useState("monthly") // monthly ou annual
  const [isActivating, setIsActivating] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(5) // Compte à rebours de 5 secondes

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

  // Gérer le compte à rebours de la modale de succès
  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showSuccessModal && countdown === 0) {
      setShowSuccessModal(false)
      setActivationStep(1)
      setCountdown(5) // Réinitialiser pour la prochaine fois
    }
  }, [showSuccessModal, countdown])

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

  // Fonction pour passer à l'étape suivante (directement au récapitulatif)
  const handleNextStep = () => {
    if (activationStep === 1) {
      setActivationStep(2) // Passer directement au récapitulatif
    }
  }

  // Fonction pour revenir à l'étape précédente
  const handlePrevStep = () => {
    if (activationStep > 1) {
      setActivationStep(activationStep - 1)
    }
  }

  // Fonction pour lancer les confettis
  const triggerConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  // Fonction pour activer l'abonnement
  const handleActivateSubscription = async () => {
    setIsActivating(true)
    try {
      // Calculer le prix en fonction du plan et de la période
      const basePrices = { starter: 29, pro: 99 }
      const price = paymentPeriod === "annual" 
        ? basePrices[selectedPlan as keyof typeof basePrices] * 12 * 0.8 // -20% pour annuel
        : basePrices[selectedPlan as keyof typeof basePrices]

      // Calculer la date de fin d'abonnement
      const now = new Date()
      const endDate = new Date(now)
      
      if (paymentPeriod === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      const subscriptionData = {
        plan: selectedPlan,
        paymentPeriod,
        price,
        activationDate: now.toISOString(),
        dateFinAbonnement: endDate.toISOString(),
        etatCompte: "ACTIF" // Activer le compte
      }

      // Mettre à jour le statut de l'école dans le backend
      const res = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          etatCompte: "ACTIF",
          dateFinAbonnement: endDate.toISOString(),
          planAbonnement: selectedPlan,
          periodeAbonnement: paymentPeriod
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        console.error('Erreur API:', errorData)
        throw new Error(errorData.error || 'Erreur lors de l\'activation')
      }

      const result = await res.json()
      console.log('Activation réussie:', result)

      // Simuler un délai pour l'effet
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mettre à jour le statut localement
      if (school) {
        const endDate = new Date()
        if (paymentPeriod === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }
        
        setSchool({ 
          ...school, 
          etatCompte: "ACTIF",
          dateFinAbonnement: endDate.toISOString(),
          planAbonnement: selectedPlan,
          periodeAbonnement: paymentPeriod
        })
      }

      // Lancer les confettis
      triggerConfetti()
      
      // Réinitialiser et afficher la modale de succès avec compte à rebours
      setCountdown(5)
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error("Erreur lors de l'activation:", error)
      alert("❌ Erreur lors de l'activation de l'abonnement")
    } finally {
      setIsActivating(false)
    }
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

            {/* Section Activation de l'abonnement */}
            <div>
              <h2 className={`text-2xl font-bold ${textColor} mb-4`}>Activation de l'abonnement</h2>
              
              <div className={`${cardBg} rounded-lg p-6 border ${borderColor}`}>
                {/* Indicateur d'étapes */}
                <div className="flex items-center gap-4 mb-8">
                  {/* Étape 1 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      activationStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}>
                      {activationStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
                    </div>
                    <span className={`text-sm ${activationStep >= 1 ? textColor : textSecondary}`}>Choisir la formule</span>
                  </div>
                  
                  <div className={`h-px flex-1 ${activationStep > 1 ? "bg-blue-600" : "bg-gray-700"}`}></div>
                  
                  {/* Étape 2 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      activationStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}>
                      2
                    </div>
                    <span className={`text-sm ${activationStep >= 2 ? textColor : textSecondary}`}>Activer l'abonnement</span>
                  </div>
                </div>

                {/* Contenu des étapes */}
                <div className="min-h-[400px]">
                  
                  {/* ÉTAPE 1: Choix de formule */}
                  {activationStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`${textColor} font-semibold text-lg mb-2`}>Choisir une formule</h3>
                        <p className={`text-sm ${textSecondary}`}>Sélectionnez la formule d'abonnement pour cette école.</p>
                      </div>
                      
                      {/* Cartes de formule */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Formule Starter */}
                        <div 
                          onClick={() => setSelectedPlan("starter")}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPlan === "starter" 
                              ? "border-blue-600 bg-blue-600/10" 
                              : `${borderColor} hover:border-gray-600`
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className={`${textColor} font-bold text-lg`}>Starter</h4>
                              <p className={`text-xs ${textSecondary}`}>Idéal pour les petites écoles</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPlan === "starter" ? "border-blue-600" : borderColor
                            }`}>
                              {selectedPlan === "starter" && (
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                          </div>
                          <div className="mb-3">
                            <span className={`${textColor} text-3xl font-bold`}>$29</span>
                            <span className={`${textSecondary} text-sm`}>/mois</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className={textColor}>Jusqu'à 100 élèves</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className={textColor}>Fonctions de base</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className={textColor}>Support par email</span>
                            </div>
                          </div>
                        </div>

                        {/* Formule Pro */}
                        <div 
                          onClick={() => setSelectedPlan("pro")}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPlan === "pro" 
                              ? "border-blue-600 bg-blue-600/10" 
                              : `${borderColor} hover:border-gray-600`
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className={`${textColor} font-bold text-lg`}>Pro</h4>
                              <p className={`text-xs ${textSecondary}`}>Pour écoles en croissance</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedPlan === "pro" ? "border-blue-600" : borderColor
                            }`}>
                              {selectedPlan === "pro" && (
                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                          </div>
                          <div className="mb-3">
                            <span className={`${textColor} text-3xl font-bold`}>$99</span>
                            <span className={`${textSecondary} text-sm`}>/mois</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className={textColor}>Élèves illimités</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className={textColor}>Fonctions avancées</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className={textColor}>Support prioritaire</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Option de paiement */}
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                          <div className="text-yellow-500 text-xl">💡</div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${textColor} mb-1`}>Économisez avec l'abonnement annuel</p>
                            <p className={`text-xs ${textSecondary} mb-3`}>
                              Choisissez le paiement annuel et économisez 20% sur votre abonnement
                            </p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setPaymentPeriod("monthly")}
                                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                                  paymentPeriod === "monthly" 
                                    ? "bg-yellow-600 text-white" 
                                    : `border ${borderColor} ${textColor} hover:bg-gray-800`
                                }`}
                              >
                                💳 Mensuel
                              </button>
                              <button 
                                onClick={() => setPaymentPeriod("annual")}
                                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                                  paymentPeriod === "annual" 
                                    ? "bg-yellow-600 text-white" 
                                    : `border ${borderColor} ${textColor} hover:bg-gray-800`
                                }`}
                              >
                                📅 Annuel (-20%)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2: Récapitulatif et Activation */}
                  {activationStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className={`${textColor} font-semibold text-lg mb-2`}>Récapitulatif</h3>
                        <p className={`text-sm ${textSecondary}`}>Vérifiez les informations avant d'activer l'abonnement.</p>
                      </div>

                      {/* Résumé de la formule */}
                      <div className={`p-4 rounded-lg border ${borderColor} bg-gradient-to-r from-blue-600/10 to-purple-600/10`}>
                        <h4 className={`${textColor} font-semibold mb-3`}>📦 Formule sélectionnée</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={textSecondary}>Plan:</span>
                            <span className={`${textColor} font-semibold capitalize`}>{selectedPlan}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={textSecondary}>Période de paiement:</span>
                            <span className={`${textColor} font-semibold`}>
                              {paymentPeriod === "monthly" ? "Mensuel" : "Annuel (-20%)"}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg">
                            <span className={textSecondary}>Prix:</span>
                            <span className={`${textColor} font-bold`}>
                              ${paymentPeriod === "annual" 
                                ? Math.round((selectedPlan === "starter" ? 29 : 99) * 12 * 0.8) 
                                : (selectedPlan === "starter" ? 29 : 99)
                              }
                              <span className="text-sm font-normal">
                                /{paymentPeriod === "monthly" ? "mois" : "an"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bouton d'activation */}
                      <div className={`p-6 rounded-lg bg-green-600/10 border-2 border-green-600/20`}>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">🎉</div>
                          <div className="flex-1">
                            <h4 className={`${textColor} font-semibold mb-1`}>Prêt à activer</h4>
                            <p className={`text-sm ${textSecondary}`}>
                              L'école aura accès immédiat à toutes les fonctionnalités de la formule {selectedPlan}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons de navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={handlePrevStep}
                    disabled={activationStep === 1}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      activationStep === 1
                        ? "opacity-50 cursor-not-allowed text-gray-500"
                        : `${textColor} hover:bg-gray-800 border ${borderColor}`
                    }`}
                  >
                    ← Précédent
                  </button>

                  {activationStep < 2 ? (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                    >
                      Suivant : Récapitulatif →
                    </button>
                  ) : (
                    <button
                      onClick={handleActivateSubscription}
                      disabled={isActivating}
                      className={`px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg flex items-center gap-2 ${
                        isActivating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isActivating ? (
                        <>
                          <Clock className="w-5 h-5 animate-spin" />
                          Activation en cours...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Activer l'abonnement
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modale de succès avec confettis */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Abonnement activé !
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                L'école <span className="font-semibold text-gray-900 dark:text-white">{school?.nomEtablissement}</span> a maintenant accès à toutes les fonctionnalités de la formule <span className="font-semibold capitalize">{selectedPlan}</span>.
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Statut du compte : <span className="font-semibold text-green-600 dark:text-green-400">Actif</span></span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Plan : <span className="font-semibold capitalize">{selectedPlan}</span></span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Période : <span className="font-semibold">{paymentPeriod === "monthly" ? "Mensuel" : "Annuel"}</span></span>
              </div>
            </div>

            {/* Compte à rebours */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Fermeture automatique dans <span className="font-bold text-lg text-gray-900 dark:text-white">{countdown}</span> seconde{countdown > 1 ? 's' : ''}
                </span>
              </div>
              {/* Barre de progression */}
              <div className="mt-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-green-600 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false)
                setActivationStep(1)
                setCountdown(5)
              }}
              className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors w-full"
            >
              Fermer maintenant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
