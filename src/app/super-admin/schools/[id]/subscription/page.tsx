"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Building2, CreditCard, Calendar, Clock, DollarSign, CheckCircle, AlertTriangle, CalendarX, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type School = {
  id: number
  nomEtablissement: string
  codeEtablissement?: string | null
  etatCompte: string
  dateDebutAbonnement?: string | null
  dateFinAbonnement?: string | null
  periodeAbonnement?: string | null
  planAbonnement?: string | null
  typePaiement?: string | null
  montantPaye?: number | null
}

export default function SubscriptionManagement() {
  const router = useRouter()
  const params = useParams()
  const schoolId = params.id as string

  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [form, setForm] = useState({
    dateDebutAbonnement: "",
    dateFinAbonnement: "",
    periodeAbonnement: "MENSUEL",
    planAbonnement: "BASIC",
    typePaiement: "MOBILE_MONEY",
    montantPaye: ""
  })

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark") setTheme(saved)
  }, [])

  useEffect(() => {
    fetchSchool()
  }, [schoolId])

  const fetchSchool = async () => {
    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}`)
      if (!res.ok) throw new Error("École non trouvée")
      const data = await res.json()
      setSchool(data.school)
      
      // Remplir le formulaire avec les données existantes
      setForm({
        dateDebutAbonnement: data.school.dateDebutAbonnement 
          ? new Date(data.school.dateDebutAbonnement).toISOString().split('T')[0] 
          : "",
        dateFinAbonnement: data.school.dateFinAbonnement 
          ? new Date(data.school.dateFinAbonnement).toISOString().split('T')[0] 
          : "",
        periodeAbonnement: data.school.periodeAbonnement || "MENSUEL",
        planAbonnement: data.school.planAbonnement || "BASIC",
        typePaiement: data.school.typePaiement || "MOBILE_MONEY",
        montantPaye: data.school.montantPaye?.toString() || ""
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch(`/api/super-admin/schools/${schoolId}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateDebutAbonnement: form.dateDebutAbonnement || null,
          dateFinAbonnement: form.dateFinAbonnement || null,
          periodeAbonnement: form.periodeAbonnement,
          planAbonnement: form.planAbonnement,
          typePaiement: form.typePaiement,
          montantPaye: form.montantPaye ? parseFloat(form.montantPaye) : null
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      setSuccess(true)
      fetchSchool() // Refresh data
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    if (!school?.dateFinAbonnement) return { status: "undefined", label: "Non défini", color: "gray" }
    
    const endDate = new Date(school.dateFinAbonnement)
    const today = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return { status: "expired", label: "Expiré", color: "red", days: Math.abs(daysLeft) }
    if (daysLeft <= 7) return { status: "warning", label: `${daysLeft} jours restants`, color: "orange", days: daysLeft }
    if (daysLeft <= 30) return { status: "soon", label: `${daysLeft} jours restants`, color: "yellow", days: daysLeft }
    return { status: "active", label: `${daysLeft} jours restants`, color: "green", days: daysLeft }
  }

  const subscriptionStatus = getSubscriptionStatus()

  // Theme styles
  const bgMain = theme === "dark" ? "bg-[#0d1117]" : "bg-gray-50"
  const cardBg = theme === "dark" ? "bg-[#161b22]" : "bg-white"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-[#0d1117]" : "bg-white"

  if (loading) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <RefreshCw className={`w-6 h-6 ${textSecondary} animate-spin`} />
          <span className={textSecondary}>Chargement...</span>
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className={`${cardBg} p-8 rounded-xl border ${borderColor} text-center`}>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-lg font-semibold ${textColor} mb-2`}>École non trouvée</h2>
          <p className={textSecondary}>L'école demandée n'existe pas.</p>
          <Button onClick={() => router.back()} className="mt-4">Retour</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgMain} p-6`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 ${textSecondary} hover:${textColor} transition-colors mb-6`}
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        {/* School Info Card */}
        <div className={`${cardBg} rounded-xl border ${borderColor} p-6 mb-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"} flex items-center justify-center`}>
                <Building2 className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${textColor}`}>{school.nomEtablissement}</h1>
                <p className={textSecondary}>Code: {school.codeEtablissement || "N/A"}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              subscriptionStatus.color === "red" ? "bg-red-500/10 border border-red-500/30" :
              subscriptionStatus.color === "orange" ? "bg-orange-500/10 border border-orange-500/30" :
              subscriptionStatus.color === "yellow" ? "bg-yellow-500/10 border border-yellow-500/30" :
              subscriptionStatus.color === "green" ? "bg-green-500/10 border border-green-500/30" :
              "bg-gray-500/10 border border-gray-500/30"
            }`}>
              {subscriptionStatus.status === "expired" ? (
                <CalendarX className={`w-5 h-5 text-red-500 animate-pulse`} />
              ) : subscriptionStatus.status === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              ) : subscriptionStatus.status === "active" || subscriptionStatus.status === "soon" ? (
                <CheckCircle className={`w-5 h-5 ${subscriptionStatus.color === "yellow" ? "text-yellow-500" : "text-green-500"}`} />
              ) : (
                <Clock className="w-5 h-5 text-gray-500" />
              )}
              <span className={`font-medium ${
                subscriptionStatus.color === "red" ? "text-red-500" :
                subscriptionStatus.color === "orange" ? "text-orange-500" :
                subscriptionStatus.color === "yellow" ? "text-yellow-500" :
                subscriptionStatus.color === "green" ? "text-green-500" :
                "text-gray-500"
              }`}>
                {subscriptionStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Form */}
        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${borderColor} flex items-center gap-3`}>
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h2 className={`text-lg font-semibold ${textColor}`}>Gestion de l'abonnement</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500">
                <CheckCircle className="w-5 h-5" />
                Abonnement mis à jour avec succès !
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de début
                </label>
                <Input
                  type="date"
                  value={form.dateDebutAbonnement}
                  onChange={(e) => setForm(prev => ({ ...prev, dateDebutAbonnement: e.target.value }))}
                  className={`${inputBg} border ${borderColor} ${textColor}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={form.dateFinAbonnement}
                  onChange={(e) => setForm(prev => ({ ...prev, dateFinAbonnement: e.target.value }))}
                  className={`${inputBg} border ${borderColor} ${textColor}`}
                />
              </div>
            </div>

            {/* Plan & Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Plan d'abonnement</label>
                <select
                  value={form.planAbonnement}
                  onChange={(e) => setForm(prev => ({ ...prev, planAbonnement: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="BASIC">Basic</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Période</label>
                <select
                  value={form.periodeAbonnement}
                  onChange={(e) => setForm(prev => ({ ...prev, periodeAbonnement: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="MENSUEL">Mensuel</option>
                  <option value="TRIMESTRIEL">Trimestriel</option>
                  <option value="SEMESTRIEL">Semestriel</option>
                  <option value="ANNUEL">Annuel</option>
                </select>
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>Type de paiement</label>
                <select
                  value={form.typePaiement}
                  onChange={(e) => setForm(prev => ({ ...prev, typePaiement: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="ESPECES">Espèces</option>
                  <option value="CARTE">Carte bancaire</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Montant payé (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.montantPaye}
                  onChange={(e) => setForm(prev => ({ ...prev, montantPaye: e.target.value }))}
                  placeholder="0.00"
                  className={`${inputBg} border ${borderColor} ${textColor}`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
