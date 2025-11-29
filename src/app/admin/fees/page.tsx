"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Eye,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { authFetch } from "@/lib/auth-fetch"
import Portal from "@/components/portal"

interface FeeType {
  id: number
  name: string
  amount: number
  description?: string
  dueDate?: string
  isActive: boolean
}

interface StudentFee {
  id: number
  studentId: number
  studentName: string
  studentCode: string
  className: string
  feeTypeId: number
  feeTypeName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: "PAID" | "PARTIAL" | "UNPAID"
  lastPaymentDate?: string
}

interface Payment {
  id: number
  studentId: number
  studentName: string
  feeTypeId: number
  feeTypeName: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference?: string
}

export default function AdminFeesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [activeTab, setActiveTab] = useState<"overview" | "types" | "students" | "payments">("overview")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // États pour les données
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    studentsFullyPaid: 0,
    studentsPartiallyPaid: 0,
    studentsUnpaid: 0
  })

  // États pour les modals
  const [showCreateFeeTypeModal, setShowCreateFeeTypeModal] = useState(false)
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null)

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
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Pour l'instant, utiliser des données de démonstration
      // TODO: Remplacer par les vraies API
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Données de démonstration
      setFeeTypes([
        { id: 1, name: "Frais de scolarité", amount: 500, description: "Frais annuels de scolarité", isActive: true },
        { id: 2, name: "Frais d'inscription", amount: 50, description: "Frais d'inscription unique", isActive: true },
        { id: 3, name: "Frais de laboratoire", amount: 30, description: "Accès aux laboratoires", isActive: true },
      ])

      setStudentFees([
        { id: 1, studentId: 1, studentName: "Kabala Bilali Firmin", studentCode: "004", className: "4ème A Secondaire Scientifique", feeTypeId: 1, feeTypeName: "Frais de scolarité", totalAmount: 500, paidAmount: 300, remainingAmount: 200, status: "PARTIAL" },
        { id: 2, studentId: 2, studentName: "Jonhson Mao John", studentCode: "006", className: "1ère A Primaire", feeTypeId: 1, feeTypeName: "Frais de scolarité", totalAmount: 500, paidAmount: 500, remainingAmount: 0, status: "PAID" },
        { id: 3, studentId: 3, studentName: "Naomie Muteba Naomie", studentCode: "001", className: "1ère A Primaire", feeTypeId: 1, feeTypeName: "Frais de scolarité", totalAmount: 500, paidAmount: 0, remainingAmount: 500, status: "UNPAID" },
      ])

      setPayments([
        { id: 1, studentId: 1, studentName: "Kabala Bilali Firmin", feeTypeId: 1, feeTypeName: "Frais de scolarité", amount: 200, paymentDate: "2024-11-15", paymentMethod: "Espèces", reference: "PAY-001" },
        { id: 2, studentId: 1, studentName: "Kabala Bilali Firmin", feeTypeId: 1, feeTypeName: "Frais de scolarité", amount: 100, paymentDate: "2024-10-20", paymentMethod: "Mobile Money", reference: "PAY-002" },
        { id: 3, studentId: 2, studentName: "Jonhson Mao John", feeTypeId: 1, feeTypeName: "Frais de scolarité", amount: 500, paymentDate: "2024-09-01", paymentMethod: "Virement", reference: "PAY-003" },
      ])

      setStats({
        totalExpected: 1500,
        totalCollected: 800,
        totalPending: 700,
        studentsFullyPaid: 1,
        studentsPartiallyPaid: 1,
        studentsUnpaid: 1
      })

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const inputBg = theme === "dark" ? "bg-gray-700" : "bg-white"

  const getStatusBadge = (status: "PAID" | "PARTIAL" | "UNPAID") => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Soldé
          </span>
        )
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Partiel
          </span>
        )
      case "UNPAID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            Impayé
          </span>
        )
    }
  }

  const tabs = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "types", label: "Types de frais" },
    { key: "students", label: "Par élève" },
    { key: "payments", label: "Paiements" },
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textColor}`}>Frais scolaires</h1>
            <p className={textSecondary}>Gestion des frais et paiements des élèves</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRecordPaymentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Enregistrer un paiement
            </button>
            <button
              onClick={() => setShowCreateFeeTypeModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau type de frais
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Total attendu</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{stats.totalExpected.toLocaleString()} $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Total perçu</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{stats.totalCollected.toLocaleString()} $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>En attente</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{stats.totalPending.toLocaleString()} $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Élèves à jour</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{stats.studentsFullyPaid} / {stats.studentsFullyPaid + stats.studentsPartiallyPaid + stats.studentsUnpaid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <div className={`flex items-center gap-2 border-b ${borderColor}`}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : `border-transparent ${textSecondary} hover:${textColor}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu selon l'onglet */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className={textSecondary}>Chargement...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vue d'ensemble */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Répartition des paiements */}
                <Card theme={theme}>
                  <CardHeader>
                    <CardTitle>Répartition des paiements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={textSecondary}>Soldés</span>
                        <span className={`font-medium ${textColor}`}>{stats.studentsFullyPaid} élèves</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.studentsFullyPaid / (stats.studentsFullyPaid + stats.studentsPartiallyPaid + stats.studentsUnpaid)) * 100}%` }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={textSecondary}>Partiels</span>
                        <span className={`font-medium ${textColor}`}>{stats.studentsPartiallyPaid} élèves</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.studentsPartiallyPaid / (stats.studentsFullyPaid + stats.studentsPartiallyPaid + stats.studentsUnpaid)) * 100}%` }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={textSecondary}>Impayés</span>
                        <span className={`font-medium ${textColor}`}>{stats.studentsUnpaid} élèves</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.studentsUnpaid / (stats.studentsFullyPaid + stats.studentsPartiallyPaid + stats.studentsUnpaid)) * 100}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Derniers paiements */}
                <Card theme={theme}>
                  <CardHeader>
                    <CardTitle>Derniers paiements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className={`flex items-center justify-between p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                          <div>
                            <p className={`font-medium ${textColor}`}>{payment.studentName}</p>
                            <p className={`text-sm ${textSecondary}`}>{payment.feeTypeName}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-green-500`}>+{payment.amount} $</p>
                            <p className={`text-xs ${textSecondary}`}>{new Date(payment.paymentDate).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Types de frais */}
            {activeTab === "types" && (
              <Card theme={theme}>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={theme === "dark" ? "bg-gray-700" : "bg-gray-50"}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Nom</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Montant</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Description</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Statut</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                        {feeTypes.map((feeType) => (
                          <tr key={feeType.id} className={theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                            <td className={`px-4 py-3 ${textColor} font-medium`}>{feeType.name}</td>
                            <td className={`px-4 py-3 ${textColor}`}>{feeType.amount} $</td>
                            <td className={`px-4 py-3 ${textSecondary}`}>{feeType.description || "-"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                feeType.isActive 
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"
                              }`}>
                                {feeType.isActive ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button className={`p-1.5 rounded ${textSecondary} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10`}>
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className={`p-1.5 rounded ${textSecondary} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10`}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Par élève */}
            {activeTab === "students" && (
              <Card theme={theme}>
                <CardContent className="pt-6">
                  {/* Barre de recherche */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                      <input
                        type="text"
                        placeholder="Rechercher un élève..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${borderColor} ${inputBg} ${textColor} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={theme === "dark" ? "bg-gray-700" : "bg-gray-50"}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Élève</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Classe</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Total dû</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Payé</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Reste</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Statut</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                        {studentFees
                          .filter(sf => sf.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || sf.studentCode.includes(searchQuery))
                          .map((sf) => (
                          <tr key={sf.id} className={theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                            <td className={`px-4 py-3`}>
                              <div>
                                <p className={`font-medium ${textColor}`}>{sf.studentName}</p>
                                <p className={`text-sm ${textSecondary}`}>Code: {sf.studentCode}</p>
                              </div>
                            </td>
                            <td className={`px-4 py-3 ${textSecondary}`}>{sf.className}</td>
                            <td className={`px-4 py-3 ${textColor} font-medium`}>{sf.totalAmount} $</td>
                            <td className={`px-4 py-3 text-green-500 font-medium`}>{sf.paidAmount} $</td>
                            <td className={`px-4 py-3 ${sf.remainingAmount > 0 ? "text-orange-500" : "text-green-500"} font-medium`}>{sf.remainingAmount} $</td>
                            <td className="px-4 py-3">{getStatusBadge(sf.status)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedStudent(sf)
                                    setShowRecordPaymentModal(true)
                                  }}
                                  className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"
                                  title="Enregistrer un paiement"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                                <button className={`p-1.5 rounded ${textSecondary} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10`} title="Voir détails">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paiements */}
            {activeTab === "payments" && (
              <Card theme={theme}>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={theme === "dark" ? "bg-gray-700" : "bg-gray-50"}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Référence</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Élève</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Type de frais</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Montant</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Date</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Mode</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${textSecondary}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                        {payments.map((payment) => (
                          <tr key={payment.id} className={theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                            <td className={`px-4 py-3 ${textColor} font-mono text-sm`}>{payment.reference}</td>
                            <td className={`px-4 py-3 ${textColor}`}>{payment.studentName}</td>
                            <td className={`px-4 py-3 ${textSecondary}`}>{payment.feeTypeName}</td>
                            <td className={`px-4 py-3 text-green-500 font-bold`}>+{payment.amount} $</td>
                            <td className={`px-4 py-3 ${textSecondary}`}>{new Date(payment.paymentDate).toLocaleDateString("fr-FR")}</td>
                            <td className={`px-4 py-3 ${textSecondary}`}>{payment.paymentMethod}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button className={`p-1.5 rounded ${textSecondary} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10`} title="Imprimer reçu">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
